const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { buildSlimPayload } = require('../util/fileOptimizer');
const { createAnalyzePagePrompt, createPageFlowPrompt } = require('../datas/prompts');

// Process individual file with OpenAI
const processFileWithOpenAI = async (filePath, fileName, pageType = "banking application") => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonContent = JSON.parse(fileContent);
      const slimPayload = buildSlimPayload(jsonContent);
      const pageContext = JSON.stringify(slimPayload, null, 2);
      
      const prompt = createAnalyzePagePrompt(pageType, pageContext);
      
      const openaiResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.7,
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
        }
      });

      const analysisResult = openaiResponse.data.choices[0]?.message?.content || 'No response received';
      const totalTokens = openaiResponse.data.usage?.total_tokens || 0;
      
      return {
        filename: fileName,
        response: analysisResult,
        totalTokens
      };

    } catch (err) {
      retryCount++;
      if (err.response?.status === 429 || err.response?.status === 402) {
        if (retryCount < maxRetries) {
          console.log(`Rate limit hit, retrying in 30 seconds... (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 30000));
          continue;
        }
      }
      
      if (retryCount >= maxRetries) {
        console.log(`Failed to process ${fileName} after ${maxRetries} attempts:`, err.message);
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  return null;
};

// Batch analysis controller with OpenAI integration
const analyzeBatch = async (req, res) => {
  try {
    const { folderName, maxFiles = -1, tokensPerMinute = 10000, pageType = "banking application" } = req.body;
    
    if (!folderName) {
      return res.status(400).json({
        error: 'missing_parameters',
        error_description: 'Missing folderName'
      });
    }

    // Check if folder exists in server/datas/json_datas
    const jsonDataDir = path.join(__dirname, '..', 'datas', 'json_datas', folderName);
    
    if (!fs.existsSync(jsonDataDir)) {
      return res.status(404).json({
        error: 'folder_not_found',
        error_description: `Folder '${folderName}' not found in server/datas/json_datas`
      });
    }

    // Get all JSON files in the folder
    const allFiles = fs.readdirSync(jsonDataDir).filter(file => file.endsWith('.json'));
    const filesToProcess = maxFiles === -1 ? allFiles : allFiles.slice(0, maxFiles);
    
    const results = [];
    const skippedFiles = [];
    let totalTokensUsed = 0;
    let tokenBudgetUsed = 0;
    const startTime = Date.now();

    // Ensure project_data directory exists
    const projectDataDir = path.join(__dirname, '..', 'datas', 'project_data');
    if (!fs.existsSync(projectDataDir)) {
      fs.mkdirSync(projectDataDir, { recursive: true });
    }

    for (let i = 0; i < filesToProcess.length; i++) {
      const fileName = filesToProcess[i];
      const filePath = path.join(jsonDataDir, fileName);
      
      // Token rate limiting
      const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
      if (elapsedMinutes > 0 && tokenBudgetUsed / elapsedMinutes > tokensPerMinute) {
        const waitTime = Math.ceil((tokenBudgetUsed / tokensPerMinute - elapsedMinutes) * 60 * 1000);
        console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime/1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const result = await processFileWithOpenAI(filePath, fileName, pageType);
      if (result) {
        let analysisData;
        try {
          // Try to parse the OpenAI response as JSON
          analysisData = JSON.parse(result.response);
        } catch {
          // If parsing fails, create a structured object with the raw response
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
        
        // Save individual file analysis in folder structure
        const folderPath = path.join(projectDataDir, folderName);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        
        const individualFileName = fileName; // Keep original filename
        const individualFilePath = path.join(folderPath, individualFileName);
        // Save the parsed JSON object directly, not as a string
        fs.writeFileSync(individualFilePath, JSON.stringify(analysisData, null, 2));
        
        totalTokensUsed += result.totalTokens || 0;
        tokenBudgetUsed += result.totalTokens || 0;
      } else {
        skippedFiles.push(fileName);
      }
    }

    // Save batch summary
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

    // Return processing summary
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

// Generate page relationships from analysis files
const generatePageRelationships = async (req, res) => {
  try {
    const { folderName, pageType = "banking application" } = req.body;
    
    if (!folderName) {
      return res.status(400).json({
        error: 'missing_parameters',
        error_description: 'Missing folderName'
      });
    }

    // Check if analysis folder exists
    const projectDataDir = path.join(__dirname, '..', 'datas', 'project_data');
    const folderPath = path.join(projectDataDir, folderName);
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({
        error: 'folder_not_found',
        error_description: `Analysis folder '${folderName}' not found. Run batch analysis first.`
      });
    }

    // Collect all analysis JSON files
    const analysisFiles = fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.json') && file !== 'page_relationship.json');
    
    if (analysisFiles.length === 0) {
      return res.status(404).json({
        error: 'no_analysis_files',
        error_description: 'No analysis files found in folder'
      });
    }

    // Read all analysis files
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

    // Create prompt for page flow analysis
    const pagesContentString = JSON.stringify(pagesContents, null, 2);
    const prompt = createPageFlowPrompt(pageType, pagesContentString);

    // Send to OpenAI for directed graph generation
    const maxRetries = 3;
    let retryCount = 0;
    let directedGraph = null;

    while (retryCount < maxRetries && !directedGraph) {
      try {
        const openaiResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
          model: "gpt-4.1",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 10000,
          temperature: 0.7,
        }, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
          }
        });

        const responseContent = openaiResponse.data.choices[0]?.message?.content || '';
        
        try {
          directedGraph = JSON.parse(responseContent);
        } catch {
          // If response isn't valid JSON, wrap it
          directedGraph = {
            error: "Could not parse directed graph",
            raw_response: responseContent
          };
        }
        
        break;
      } catch (err) {
        retryCount++;
        if (err.response?.status === 429 || err.response?.status === 402) {
          if (retryCount < maxRetries) {
            console.log(`Rate limit hit, retrying in 30 seconds... (attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 30000));
            continue;
          }
        }
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to generate page relationships after ${maxRetries} attempts: ${err.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    // Save page_relationship.json in the same folder
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

module.exports = {
  analyzeBatch,
  generatePageRelationships
};