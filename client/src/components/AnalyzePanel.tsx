import React, { useState } from 'react';
import { createAnalyzePagePrompt } from '../assets/prompts';

interface AnalyzeResult {
  filename: string;
  response: string;
}

const AnalyzePanel: React.FC = () => {
  const [filename, setFilename] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latest, setLatest] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageType = "banking application"; // Static page type as requested

  const analyzeFile = async () => {
    if (!filename.trim()) {
      setError('Please enter a filename');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load JSON file from public/json_datas
      const response = await fetch(`/json_datas/${filename}`);
      if (!response.ok) {
        throw new Error(`File not found: ${filename}`);
      }
      
      const jsonContent = await response.json();
      const pageContext = JSON.stringify(jsonContent, null, 2);
      
      // Combine with prompt
      const prompt = createAnalyzePagePrompt(pageType, pageContext);
      const key = import.meta.env.VITE_OPENAI_KEY;
      console.log(key);
      // Call OpenAI API
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 20000,
          temperature: 0.7,
        }),
      });

      if (!openaiResponse.ok) {
        console.log(openaiResponse);
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const openaiData = await openaiResponse.json();
      const analysisResult = openaiData.choices[0]?.message?.content || 'No response received';

      // Update latest result
      setLatest({
        filename,
        response: analysisResult
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      analyzeFile();
    }
  };

  return (
    <div className="p-6">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h2>Page Analysis</h2>
        <p style={{ color: '#666', marginBottom: 16 }}>
          Page Type: <strong>{pageType}</strong>
        </p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Enter filename (e.g., test/Desktop.json)"
              style={{ 
                flex: 1, 
                padding: '10px 12px', 
                border: '1px solid #ccc', 
                borderRadius: 6 
              }}
            />
            <button
              onClick={analyzeFile}
              disabled={!filename.trim() || isLoading}
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                background: isLoading ? '#ccc' : '#1976d2',
                color: '#fff',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ 
            padding: 12, 
            background: '#ffebee', 
            color: '#c62828', 
            borderRadius: 6, 
            marginBottom: 16 
          }}>
            {error}
          </div>
        )}

        <div style={{ 
          padding: 16, 
          border: '1px solid #eee', 
          borderRadius: 8, 
          minHeight: 200 
        }}>
          {latest ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#666' }}>File</div>
                <div style={{ fontFamily: 'monospace' }}>{latest.filename}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Analysis Result</div>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  fontSize: 14,
                  lineHeight: 1.5
                }}>
                  {latest.response}
                </pre>
              </div>
            </>
          ) : (
            <div style={{ color: '#888' }}>
              No analysis yet. Enter a filename from json_datas and click Analyze.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyzePanel;