import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { get_encoding } from 'tiktoken';               // ✅ 用 o200k_base 估算 4.1/4o
import { buildSlimPayload } from '../util/fileOptimizer.js';
import { createAnalyzePagePrompt, createPageFlowPrompt } from '../datas/prompts.js';

// ====== 配置区（按需调）======
const MODEL = "gpt-4.1";
const TPM_LIMIT = 10_000;                // 你当前的 TPM 上限
const DEFAULT_MAX_OUT_TOKENS = 900;      // 单次输出上限，避免一次请求超过 TPM
const MAX_RETRIES = 3;

// === Token 预估：适配 4.1/4o 家族 ===
function estimateTokensForChat({ messages, maxTokens = 0 }) {
  const enc = get_encoding("o200k_base");
  try {
    // 简单估算：拼 role+content 即可（够安全）；必要可加固定开销
    const text = messages.map(m => `${m.role}: ${m.content}`).join("\n");
    const inputTokens = enc.encode(text).length;
    return inputTokens + maxTokens;
  } finally {
    enc.free();
  }
}

// 从错误信息中提取“Requested NNNN”数字（OpenAI 在 429 时常带上）
function parseRequestedFromError(err) {
  const msg = err?.response?.data?.error?.message || "";
  const m = msg.match(/Requested\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

// 计算等待时长：优先读 Retry-After / x-ratelimit-reset-tokens
function getRetryAfterMs(err) {
  const h = err?.response?.headers || {};
  const ra = h["retry-after"];
  if (ra) {
    const s = Number(ra);
    if (!Number.isNaN(s)) return s * 1000;
  }
  const rst = h["x-ratelimit-reset-tokens"] || h["x-ratelimit-reset-requests"];
  if (rst && typeof rst === "string" && rst.endsWith("s")) {
    const seconds = Number(rst.replace("s", ""));
    if (!Number.isNaN(seconds)) return seconds * 1000;
  }
  // 兜底：30~40s 随机
  return 30_000 + Math.floor(Math.random() * 10_000);
}

// 简单的每分钟“预估节流”（比事后统计更安全）
let windowStart = Date.now();
let estUsedThisMinute = 0;
function maybeThrottle(projected, tokensPerMinute = TPM_LIMIT) {
  const elapsedMs = Date.now() - windowStart;
  if (elapsedMs > 60_000) {
    // 新窗口
    windowStart = Date.now();
    estUsedThisMinute = 0;
  }
  if (estUsedThisMinute + projected > tokensPerMinute) {
    // 这里也可以更精确：计算还剩多少秒到 60s 末尾；简单起见给个短等待
    const waitMs = 2_000 + Math.random() * 1_000;
    return Math.ceil(waitMs);
  }
  return 0;
}

// ====== 单文件处理 ======
const processFileWithOpenAI = async (filePath, fileName, pageType = "banking application") => {
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonContent = JSON.parse(fileContent);
      const slimPayload = buildSlimPayload(jsonContent); // ✅ 你自己的瘦身器
      const pageContext = JSON.stringify(slimPayload, null, 2);
      const prompt = createAnalyzePagePrompt(pageType, pageContext);

      // ✅ 估算 tokens（输入 + 预计输出）
      const messages = [{ role: "user", content: prompt }];
      const projected = estimateTokensForChat({
        messages,
        maxTokens: DEFAULT_MAX_OUT_TOKENS
      });

      console.log(`🔍 Processing ${fileName}:`);
      console.log(`  - File size: ${fileContent.length} bytes`);
      console.log(`  - Optimized payload size: ${pageContext.length} bytes`);
      console.log(`  - Prompt length: ${prompt.length} characters`);
      console.log(`  - Projected tokens (in+out): ${projected}/${TPM_LIMIT}`);

      if (projected > TPM_LIMIT) {
        console.log(`❌ Skipping ${fileName}: projected ${projected} exceeds TPM ${TPM_LIMIT}`);
        return {
          filename: fileName,
          response: null,
          totalTokens: 0,
          skipped: true,
          reason: 'token_limit_exceeded_single_request'
        };
      }

      // ✅ 每分钟节流（用预估值控制发车）
      const waitMs = maybeThrottle(projected, TPM_LIMIT);
      if (waitMs > 0) {
        console.log(`⏳ Throttling ${Math.ceil(waitMs/1000)}s to respect TPM...`);
        await new Promise(r => setTimeout(r, waitMs));
      }
      // 先累加预估用量；成功后再用真实 usage 做微调也可以（这里简化）
      estUsedThisMinute += projected;

      // ✅ 发请求时，降低 max_tokens，避免单次把 TPM 顶爆
      const openaiResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: MODEL,
          messages,
          max_tokens: DEFAULT_MAX_OUT_TOKENS,
          temperature: 0.5
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
          },
          // 可选：设置合理超时
          timeout: 120_000
        }
      );

      const analysisResult = openaiResponse.data.choices?.[0]?.message?.content || 'No response received';
      const usage = openaiResponse.data.usage || { total_tokens: 0 };
      const totalTokens = usage.total_tokens || 0;

      console.log(`✅ Completed ${fileName}:`);
      console.log(`  - Actual tokens used: ${totalTokens}`);
      console.log(`  - Response length: ${analysisResult.length} characters`);

      return {
        filename: fileName,
        response: analysisResult,
        totalTokens
      };

    } catch (err) {
      retryCount++;

      const status = err?.response?.status;
      const requested = parseRequestedFromError(err);
      const msg = err?.response?.data?.error?.message || err.message || String(err);

      console.log(`❗ Error processing ${fileName} (try ${retryCount}/${MAX_RETRIES})`);
      if (requested) console.log(`  - Requested tokens reported by API: ${requested}`);
      console.log(`  - Status: ${status}  Message: ${msg}`);

      if (status === 429 || status === 402) {
        const wait = getRetryAfterMs(err);
        console.log(`🚫 Rate limited. Waiting ${Math.ceil(wait/1000)}s before retry...`);
        await new Promise(r => setTimeout(r, wait));
        continue; // 重试
      }

      if (retryCount >= MAX_RETRIES) {
        console.log(`❌ Failed to process ${fileName} after ${MAX_RETRIES} attempts.`);
        return {
          filename: fileName,
          response: null,
          totalTokens: 0,
          skipped: true,
          reason: 'max_retries_exceeded'
        };
      }

      // 其它错误：短暂等待再尝试
      await new Promise(r => setTimeout(r, 30_000));
    }
  }

  return null;
};

// ====== 批处理控制器 ======
const analyzeBatch = async (req, res) => {
  try {
    const { folderName, maxFiles = -1, tokensPerMinute = TPM_LIMIT, pageType = "banking application" } = req.body;

    if (!folderName) {
      return res.status(400).json({
        error: 'missing_parameters',
        error_description: 'Missing folderName'
      });
    }

    const jsonDataDir = path.join(__dirname, '..', 'datas', 'json_datas', folderName);
    if (!fs.existsSync(jsonDataDir)) {
      return res.status(404).json({
        error: 'folder_not_found',
        error_description: `Folder '${folderName}' not found in server/datas/json_datas`
      });
    }

    const allFiles = fs.readdirSync(jsonDataDir).filter(file => file.endsWith('.json'));
    const filesToProcess = maxFiles === -1 ? allFiles : allFiles.slice(0, maxFiles);

    const results = [];
    const skippedFiles = [];
    let totalTokensUsed = 0;

    // 输出目录
    const projectDataDir = path.join(__dirname, '..', 'datas', 'project_data');
    if (!fs.existsSync(projectDataDir)) fs.mkdirSync(projectDataDir, { recursive: true });
    const folderPath = path.join(projectDataDir, folderName);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    for (let i = 0; i < filesToProcess.length; i++) {
      const fileName = filesToProcess[i];
      const filePath = path.join(jsonDataDir, fileName);

      // ⚠️ 注意：现在的节流是在 processFileWithOpenAI 里按“预估”做
      const result = await processFileWithOpenAI(filePath, fileName, pageType);

      if (result) {
        totalTokensUsed += result.totalTokens || 0;

        if (result.skipped) {
          skippedFiles.push({
            filename: fileName,
            reason: result.reason,
            tokens: result.totalTokens || 0
          });
        } else {
          let analysisData;
          try {
            analysisData = JSON.parse(result.response);
          } catch {
            analysisData = {
              page_name: fileName.replace('.json', ''),
              purpose: "Analysis could not be parsed as JSON",
              raw_response: result.response
            };
          }

          results.push({
            filename: fileName,
            analysis: analysisData,
            tokens: result.totalTokens || 0
          });

          const individualFilePath = path.join(folderPath, fileName);
          fs.writeFileSync(individualFilePath, JSON.stringify(analysisData, null, 2));
        }
      } else {
        skippedFiles.push({
          filename: fileName,
          reason: 'processing_failed',
          tokens: 0
        });
      }
    }

    // 批量总结
    const outputFileName = `${folderName}_analysis.json`;
    const outputData = {
      folderName,
      processedAt: new Date().toISOString(),
      totalFiles: filesToProcess.length,
      processedFiles: results.length,
      skippedFiles,
      totalTokens: totalTokensUsed,
      pages: results
    };

    const batchFilePath = path.join(projectDataDir, outputFileName);
    fs.writeFileSync(batchFilePath, JSON.stringify(outputData, null, 2));

    res.json({
      success: true,
      folderName,
      totalFiles: filesToProcess.length,
      processedFiles: results.length,
      failedFiles: skippedFiles.length,
      totalTokens: totalTokensUsed,
      outputFile: outputFileName,
      results: outputData
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      error: 'batch_analysis_error',
      error_description: error.message
    });
  }
};

// ====== 关系列生成（也做了相同的 token 控制）======
const generatePageRelationships = async (req, res) => {
  try {
    const { folderName, pageType = "banking application" } = req.body;

    if (!folderName) {
      return res.status(400).json({
        error: 'missing_parameters',
        error_description: 'Missing folderName'
      });
    }

    const projectDataDir = path.join(__dirname, '..', 'datas', 'project_data');
    const folderPath = path.join(projectDataDir, folderName);
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({
        error: 'folder_not_found',
        error_description: `Analysis folder '${folderName}' not found. Run batch analysis first.`
      });
    }

    const analysisFiles = fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.json') && file !== 'page_relationship.json');

    if (analysisFiles.length === 0) {
      return res.status(404).json({
        error: 'no_analysis_files',
        error_description: 'No analysis files found in folder'
      });
    }

    const pagesContents = [];
    for (const fileName of analysisFiles) {
      try {
        const filePath = path.join(folderPath, fileName);
        const analysisData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        pagesContents.push({
          filename: fileName.replace('.json', ''),
          ...analysisData
        });
      } catch (error) {
        console.log(`Failed to read analysis file ${fileName}:`, error.message);
      }
    }

    const pagesContentString = JSON.stringify(pagesContents, null, 2);
    const prompt = createPageFlowPrompt(pageType, pagesContentString);

    let retryCount = 0;
    let directedGraph = null;

    while (retryCount < MAX_RETRIES && !directedGraph) {
      try {
        const messages = [{ role: "user", content: prompt }];
        const projected = estimateTokensForChat({
          messages,
          maxTokens: DEFAULT_MAX_OUT_TOKENS
        });

        if (projected > TPM_LIMIT) {
          throw new Error(`page_relationship prompt too large: ${projected} > ${TPM_LIMIT}`);
        }

        const waitMs = maybeThrottle(projected, TPM_LIMIT);
        if (waitMs > 0) {
          console.log(`⏳ Relationship throttling ${Math.ceil(waitMs/1000)}s...`);
          await new Promise(r => setTimeout(r, waitMs));
        }
        estUsedThisMinute += projected;

        const openaiResponse = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: MODEL,
            messages,
            max_tokens: DEFAULT_MAX_OUT_TOKENS,
            temperature: 0.5
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
            },
            timeout: 120_000
          }
        );

        const responseContent = openaiResponse.data.choices?.[0]?.message?.content || '';

        try {
          directedGraph = JSON.parse(responseContent);
        } catch {
          directedGraph = {
            error: "Could not parse directed graph",
            raw_response: responseContent
          };
        }
        break;

      } catch (err) {
        retryCount++;
        const status = err?.response?.status;
        const requested = parseRequestedFromError(err);
        const msg = err?.response?.data?.error?.message || err.message || String(err);
        console.log(`❗ Relationship gen error (try ${retryCount}/${MAX_RETRIES}) status=${status} msg=${msg}`);
        if (requested) console.log(`  - Requested tokens: ${requested}`);

        if ((status === 429 || status === 402) && retryCount < MAX_RETRIES) {
          const wait = getRetryAfterMs(err);
          console.log(`🚫 Rate limited. Waiting ${Math.ceil(wait/1000)}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, wait));
          continue;
        }
        if (retryCount >= MAX_RETRIES) {
          throw new Error(`Failed to generate page relationships after ${MAX_RETRIES} attempts: ${msg}`);
        }
        await new Promise(resolve => setTimeout(resolve, 30_000));
      }
    }

    const relationshipFilePath = path.join(folderPath, 'page_relationship.json');
    fs.writeFileSync(relationshipFilePath, JSON.stringify(directedGraph, null, 2));

    res.json({
      success: true,
      folderName,
      analysisFiles: analysisFiles.length,
      relationshipFile: 'page_relationship.json',
      directedGraph
    });

  } catch (error) {
    console.error('Page relationship generation error:', error);
    res.status(500).json({
      error: 'relationship_generation_error',
      error_description: error.message
    });
  }
};

export {
  analyzeBatch,
  generatePageRelationships
};
