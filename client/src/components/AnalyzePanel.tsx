import React, { useState } from 'react';

interface AnalyzeResult {
  filename: string;
  response: string;
  totalTokens?: number;
}

interface BatchResult {
  folderName: string;
  processedFiles: number;
  totalFiles: number;
  totalTokens: number;
  failedFiles: number;
  outputFile: string;
  results?: any;
}

const AnalyzePanel: React.FC = () => {
  const [folderName, setFolderName] = useState('test');
  const [maxFiles, setMaxFiles] = useState(-1);
  const [tokensPerMinute, setTokensPerMinute] = useState(10000);
  const [isLoading, setIsLoading] = useState(false);
  const [latest, setLatest] = useState<AnalyzeResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageType = "banking application";

  const analyzeBatch = async () => {
    if (!folderName.trim()) {
      setError('Please enter a folder name');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBatchResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/file-analysis/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderName,
          maxFiles,
          tokensPerMinute,
          pageType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || `Server error: ${response.statusText}`);
      }

      const result = await response.json();

      setBatchResult({
        folderName: result.folderName,
        processedFiles: result.processedFiles,
        totalFiles: result.totalFiles,
        totalTokens: result.totalTokens,
        failedFiles: result.failedFiles,
        outputFile: result.outputFile,
        results: result.results
      });

      setLatest({
        filename: result.outputFile,
        response: JSON.stringify(result.results, null, 2),
        totalTokens: result.totalTokens
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      analyzeBatch();
    }
  };

  return (
    <div className="p-6">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h2>Batch Page Analysis</h2>
        <p style={{ color: '#666', marginBottom: 16 }}>
          Application Type: <strong>{pageType}</strong>
        </p>

        <div style={{ marginBottom: 16, display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
              Folder Name
            </label>
            <input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g., test"
              style={{ 
                width: '100%',
                padding: '8px 12px', 
                border: '1px solid #ccc', 
                borderRadius: 6 
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
              Max Files (-1 for all)
            </label>
            <input
              type="number"
              value={maxFiles}
              onChange={(e) => setMaxFiles(parseInt(e.target.value) || -1)}
              style={{ 
                width: '100%',
                padding: '8px 12px', 
                border: '1px solid #ccc', 
                borderRadius: 6 
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
              Tokens/Minute
            </label>
            <input
              type="number"
              value={tokensPerMinute}
              onChange={(e) => setTokensPerMinute(parseInt(e.target.value) || 10000)}
              style={{ 
                width: '100%',
                padding: '8px 12px', 
                border: '1px solid #ccc', 
                borderRadius: 6 
              }}
            />
          </div>
        </div>

        <button
          onClick={analyzeBatch}
          disabled={!folderName.trim() || isLoading}
          style={{
            padding: '12px 24px',
            borderRadius: 6,
            background: isLoading ? '#ccc' : '#1976d2',
            color: '#fff',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginBottom: 16,
            width: '100%'
          }}
        >
          {isLoading ? 'Processing Batch...' : 'Analyze Batch'}
        </button>

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

        {batchResult && (
          <div style={{ 
            padding: 16, 
            background: '#e8f5e8', 
            borderRadius: 8, 
            marginBottom: 16 
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#2e7d32' }}>Batch Complete</h3>
            <div style={{ fontSize: 14 }}>
              <div><strong>Folder:</strong> {batchResult.folderName}</div>
              <div><strong>Processed:</strong> {batchResult.processedFiles}/{batchResult.totalFiles} files</div>
              <div><strong>Total Tokens:</strong> {batchResult.totalTokens.toLocaleString()}</div>
              <div><strong>Output File:</strong> {batchResult.outputFile}</div>
              {batchResult.failedFiles > 0 && (
                <div><strong>Failed:</strong> {batchResult.failedFiles} files</div>
              )}
            </div>
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
                <div style={{ fontSize: 12, color: '#666' }}>Output File</div>
                <div style={{ fontFamily: 'monospace' }}>{latest.filename}</div>
              </div>
              {latest.totalTokens && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Total Tokens Consumed</div>
                  <div style={{ fontSize: 14, color: '#1976d2', fontWeight: 'bold' }}>
                    {latest.totalTokens.toLocaleString()}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Analysis Results</div>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  fontSize: 12,
                  lineHeight: 1.4,
                  maxHeight: 400,
                  overflow: 'auto'
                }}>
                  {latest.response}
                </pre>
              </div>
            </>
          ) : (
            <div style={{ color: '#888' }}>
              No batch analysis yet. Enter a folder name and click Analyze Batch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyzePanel;
