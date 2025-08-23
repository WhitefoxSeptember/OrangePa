import React, { useState } from 'react';
import { FigmaApiService } from '../services/figmaApi';
import { importFigmaData } from '../utils/figmaDataUtils';
import './FigmaFileImporter.css';

const FigmaFileImporter: React.FC = () => {
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [fileUrlError, setFileUrlError] = useState('');
  const [formattedFile, setFormattedFile] = useState<any>(null);
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  // Extract file key from Figma URL
  const extractFileKeyFromUrl = (url: string): string | null => {
    const match = url.match(/figma\.com\/design\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  // Validate file key
  const isValidFileKey = (key: string): boolean => {
    return key.length >= 20 && /^[a-zA-Z0-9]+$/.test(key);
  };

  // Handle URL input and import
  const handleFileUrlInput = async (url: string) => {
    setFileUrlError('');
    setIsLoading(true);
    
    try {
      if (!url.trim()) {
        setFileUrlError('Please enter a Figma URL');
        return;
      }

      const fileKey = extractFileKeyFromUrl(url);
      if (!fileKey || !isValidFileKey(fileKey)) {
        setFileUrlError('Invalid Figma URL or file key');
        return;
      }

      console.log('🚀 Importing file with key:', fileKey);
      
      // Check if we have an access token
      if (!accessToken) {
        setFileUrlError('Please enter your Figma access token first');
        setIsLoading(false);
        return;
      }

      // Validate access token format
      if (!accessToken.startsWith('figd_')) {
        setFileUrlError('Invalid access token format. Should start with "figd_"');
        setIsLoading(false);
        return;
      }

      console.log('🔑 Using access token:', accessToken.substring(0, 10) + '...');
      
      // Create Figma API service instance
      const figmaApi = new FigmaApiService(accessToken);
      
      // Test the API connection first
      console.log('🧪 Testing API connection...');
      try {
        // Try to get user info first to test the token
        const response = await fetch('https://api.figma.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Access token is invalid or expired. Please check your token.');
          } else if (response.status === 401) {
            throw new Error('Unauthorized. Please check your access token.');
          } else {
            throw new Error(`API test failed: ${response.status} ${response.statusText}`);
          }
        }
        
        const userInfo = await response.json();
        console.log('✅ API connection successful. User:', userInfo.handle || userInfo.email);
        
      } catch (testError) {
        console.error('❌ API connection test failed:', testError);
        throw testError;
      }
      
      // Get the file data from Figma API
      console.log('📡 Fetching file data from Figma API...');
      const startTime = performance.now();
      
      const fileData = await figmaApi.getFile(fileKey);
      
      const endTime = performance.now();
      const fetchTime = endTime - startTime;
      
      console.log('✅ File data fetched in', fetchTime.toFixed(2), 'ms');
      console.log('📊 Raw file data:', fileData);
      
      // Import and format the data
      console.log('🔄 Processing file data...');
      const processStartTime = performance.now();
      
      const formatted = importFigmaData(fileData);
      
      const processEndTime = performance.now();
      const processTime = processEndTime - processStartTime;
      
      console.log('✅ Data processed in', processTime.toFixed(2), 'ms');
      console.log('✨ Formatted data:', formatted);
      
      // Set the formatted data
      setFormattedFile(formatted);
      
      // Performance summary
      const totalTime = endTime - startTime;
      const dataSize = JSON.stringify(formatted).length;
      console.log('📈 Performance Summary:');
      console.log('  - Total time:', totalTime.toFixed(2), 'ms');
      console.log('  - Fetch time:', fetchTime.toFixed(2), 'ms');
      console.log('  - Process time:', processTime.toFixed(2), 'ms');
      console.log('  - Data size:', dataSize, 'bytes');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Import failed:', err);
      
      // Provide more specific error messages
      if (errorMessage.includes('403')) {
        setFileUrlError('Access denied (403). This file may be private or require team access. Try using a personal file or check file permissions.');
      } else if (errorMessage.includes('401')) {
        setFileUrlError('Unauthorized (401). Please check your access token.');
      } else if (errorMessage.includes('404')) {
        setFileUrlError('File not found (404). Please check the URL or file key.');
      } else if (errorMessage.includes('rate limit')) {
        setFileUrlError('Rate limit exceeded. Please wait a moment and try again.');
      } else {
        setFileUrlError(`Failed to import: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="figma-importer">
      {/* Access Token Input */}
      <div className="token-input-section">
        <h3>🔑 Figma Access Token</h3>
        <div className="token-input-group">
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Enter your Figma access token..."
            className="token-input"
          />
          <div className="token-help">
            <p>Get your access token from: <a href="https://www.figma.com/settings" target="_blank" rel="noopener noreferrer">Figma Account Settings → Personal Access Tokens</a></p>
            <button 
              onClick={async () => {
                if (!accessToken.trim()) {
                  alert('Please enter an access token first');
                  return;
                }
                
                if (!accessToken.startsWith('figd_')) {
                  alert('Invalid token format. Should start with "figd_"');
                  return;
                }
                
                try {
                  console.log('🧪 Testing connection...');
                  console.log('🔑 Token being used:', accessToken.substring(0, 10) + '...');
                  
                  // First, try to get user info
                  const response = await fetch('https://api.figma.com/v1/me', {
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json',
                    },
                  });
                  
                  console.log('📡 Response status:', response.status);
                  console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
                  
                  if (response.ok) {
                    const userInfo = await response.json();
                    alert(`✅ Connection successful!\nUser: ${userInfo.handle || userInfo.email}\nEmail: ${userInfo.email}`);
                    console.log('User info:', userInfo);
                  } else {
                    const errorText = await response.text();
                    console.error('❌ Error response:', errorText);
                    
                    if (response.status === 403) {
                      alert(`❌ Access denied (403)\n\nPossible causes:\n• Token not activated yet (wait 5-10 min)\n• Wrong token type\n• Account restrictions\n• Token permissions\n\nCheck console for details.`);
                    } else {
                      alert(`❌ Connection failed: ${response.status} ${response.statusText}\n\nCheck console for details.`);
                    }
                  }
                } catch (error) {
                  console.error('❌ Network error:', error);
                  alert(`❌ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`);
                }
              }}
              className="test-connection-btn"
              disabled={!accessToken.trim()}
            >
              🧪 Test Connection
            </button>
          </div>
        </div>
      </div>

      {/* URL Input Section */}
      <div className="url-input-section">
        <h3>📥 Import Figma File</h3>
        <div className="url-input-group">
          <input
            type="text"
            value={fileUrlInput}
            onChange={(e) => setFileUrlInput(e.target.value)}
            placeholder="Paste Figma file URL here..."
            className="url-input"
          />
          <button 
            onClick={() => handleFileUrlInput(fileUrlInput)}
            disabled={!fileUrlInput.trim() || !accessToken.trim() || isLoading}
            className="import-btn"
          >
            {isLoading ? '⏳ Importing...' : '🚀 Import File'}
          </button>
        </div>
        
        {fileUrlError && (
          <div className="url-error">
            ❌ {fileUrlError}
          </div>
        )}
        
        <div className="url-help">
          <h4>📋 Example URLs:</h4>
          <div className="example-urls">
            <code>https://www.figma.com/design/tNvw9yTMvBNwPKRJmsTfYC/QUASQ-3D---Landing-Page</code>
            <code>https://www.figma.com/design/abc123def456/My-Design-File</code>
          </div>
        </div>
      </div>

      {/* JSON Data Display */}
      {formattedFile && (
        <div className="json-display">
          <h3>📊 Imported File Data</h3>
          
          {/* File Summary */}
          <div className="file-summary">
            <h4>📋 File Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Name:</span>
                <span className="value">{formattedFile.name}</span>
              </div>
              <div className="summary-item">
                <span className="label">Version:</span>
                <span className="value">{formattedFile.version}</span>
              </div>
              <div className="summary-item">
                <span className="label">Pages:</span>
                <span className="value">{formattedFile.summary?.totalPages || 'N/A'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Total Nodes:</span>
                <span className="value">{formattedFile.summary?.totalNodes || 'N/A'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Components:</span>
                <span className="value">{formattedFile.summary?.totalComponents || 'N/A'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Styles:</span>
                <span className="value">{formattedFile.summary?.totalStyles || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* JSON Controls */}
          <div className="json-controls">
            <h4>🔍 JSON Data</h4>
            <div className="control-buttons">
              <button 
                onClick={() => setJsonExpanded(!jsonExpanded)}
                className="toggle-btn"
              >
                {jsonExpanded ? '📁 Collapse JSON' : '📂 Expand JSON'}
              </button>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(formattedFile, null, 2));
                  alert('JSON copied to clipboard!');
                }}
                className="copy-btn"
              >
                📋 Copy JSON
              </button>
              
              <button 
                onClick={() => {
                  const dataStr = JSON.stringify(formattedFile, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${formattedFile.name.replace(/\s+/g, '_')}_data.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="download-btn"
              >
                📥 Download JSON
              </button>
            </div>
          </div>

          {/* JSON Content */}
          {jsonExpanded && (
            <div className="json-content">
              <pre className="json-text">
                {JSON.stringify(formattedFile, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* No File Selected */}
      {!formattedFile && (
        <div className="no-file">
          <h3>🎯 Ready to Import</h3>
          <p>Enter your Figma access token and paste a Figma file URL above to get started!</p>
          <div className="features">
            <h4>✨ Features:</h4>
            <ul>
              <li>Import any Figma file by URL</li>
              <li>View formatted JSON data</li>
              <li>Download data as JSON file</li>
              <li>Copy data to clipboard</li>
              <li>Performance metrics</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FigmaFileImporter;

