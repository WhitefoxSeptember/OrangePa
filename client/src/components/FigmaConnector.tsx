import React, { useState, useEffect } from 'react';
import useFigma from '../hooks/useFigma';
import type { FigmaFile, FigmaNode } from '../services/figmaApi';
import { extractFileKeyFromUrl, isValidFileKey, generateFigmaFileUrl } from '../utils/figmaUtils';
import { importFigmaData } from '../utils/figmaDataUtils';
import FigmaOAuthService from '../services/figmaOAuth';
import './FigmaConnector.css';

const FigmaConnector: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFileKey, setSelectedFileKey] = useState('');
  const [commentMessage, setCommentMessage] = useState('');
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [fileUrlError, setFileUrlError] = useState('');
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  const oauthService = FigmaOAuthService.getInstance();
  const accessToken = oauthService.getAccessToken();
  
  // Local state for formatted data
  const [formattedFile, setFormattedFile] = useState<any>(null);
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);

  const {
    figmaService,
    isConnected,
    isLoading,
    error,
    user,
    teams,
    projects,
    files,
    connect,
    disconnect,
    refreshTeams,
    refreshProjects,
    refreshFiles,
    getFile,
    addComment,
  } = useFigma({ accessToken: accessToken || '', autoConnect: !!accessToken });

  const handleConnect = async () => {
    setIsOAuthLoading(true);
    try {
      oauthService.initiateAuth();
    } catch (error) {
      setIsOAuthLoading(false);
      alert('Failed to initiate OAuth flow');
    }
  };

  const handleTeamSelect = async (teamId: string) => {
    setSelectedTeamId(teamId);
    setSelectedProjectId('');
    setSelectedFileKey('');
    setSelectedNodes([]);
    if (teamId) {
      await refreshProjects(teamId);
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedFileKey('');
    setSelectedNodes([]);
    if (projectId) {
      await refreshFiles(projectId);
    }
  };

  const handleFileSelect = async (fileKey: string) => {
    setSelectedFileKey(fileKey);
    if (fileKey) {
      const file = await getFile(fileKey);
      if (file) {
        const formatted = importFigmaData(file);
        setFormattedFile(formatted);
      }
    }
  };

  const handleFileUrlInput = (url: string) => {
    setFileUrlInput(url);
    setFileUrlError('');
    
    if (url.trim()) {
      const fileKey = extractFileKeyFromUrl(url);
      if (fileKey && isValidFileKey(fileKey)) {
        setSelectedFileKey(fileKey);
        handleFileSelect(fileKey);
      } else {
        setFileUrlError('Invalid Figma URL or file key');
      }
    }
  };

  const handleAddComment = async () => {
    if (!commentMessage.trim() || !selectedFileKey) {
      alert('Please enter a comment message and select a file');
      return;
    }

    try {
      await addComment(selectedFileKey, commentMessage, commentPosition);
      setCommentMessage('');
      alert('Comment added successfully!');
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  const renderNodeTree = (node: FigmaNode, depth: number = 0): React.ReactNode => {
    const indent = '  '.repeat(depth);
    
    return (
      <div key={node.id} style={{ marginLeft: depth * 20 }}>
        <div className="node-item">
          <span className="node-name">{indent}{node.name}</span>
          <span className="node-type">({node.type})</span>
          {node.absoluteBoundingBox && (
            <span className="node-dimensions">
              {node.absoluteBoundingBox.width} × {node.absoluteBoundingBox.height}
            </span>
          )}
        </div>
        {node.children && node.children.map(child => renderNodeTree(child, depth + 1))}
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="figma-connector">
        <h2>Connect to Figma</h2>
        <div className="connection-form">
          <div className="oauth-info">
            <p>Connect your Figma account securely using OAuth</p>
            <p className="oauth-benefits">
              ✅ No need to copy/paste tokens<br/>
              ✅ Automatic token refresh<br/>
              ✅ Secure authentication
            </p>
          </div>
          <button 
            onClick={handleConnect} 
            disabled={isOAuthLoading}
            className="connect-btn oauth-btn"
          >
            {isOAuthLoading ? 'Redirecting...' : '🔐 Connect with Figma'}
          </button>
          {error && <div className="error">{error}</div>}
        </div>
        <div className="help-text">
          <p>
            Click the button above to securely connect your Figma account.
          </p>
          <p>
            You'll be redirected to Figma to authorize this application, then redirected back here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="figma-connector">
      <div className="header">
        <h2>Figma API Connector</h2>
        <div className="user-info">
          <span>Connected as: {user?.handle || user?.email}</span>
          <button onClick={() => { oauthService.logout(); window.location.reload(); }} className="disconnect-btn">Disconnect</button>
        </div>
      </div>

      <div className="main-content">
        <div className="sidebar">
          <div className="section">
            <h3>Teams</h3>
            <select 
              value={selectedTeamId} 
              onChange={(e) => handleTeamSelect(e.target.value)}
              className="select-dropdown"
            >
              <option value="">Select a team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          {selectedTeamId && (
            <div className="section">
              <h3>Projects</h3>
              <select 
                value={selectedProjectId} 
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="select-dropdown"
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedProjectId && (
            <div className="section">
              <h3>Files</h3>
              <select 
                value={selectedFileKey} 
                onChange={(e) => handleFileSelect(e.target.value)}
                className="select-dropdown"
              >
                <option value="">Select a file</option>
                {files.map(file => (
                  <option key={file.key} value={file.key}>{file.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="section">
            <h3>Open File by URL</h3>
            <div className="url-input-group">
              <input
                type="text"
                value={fileUrlInput}
                onChange={(e) => handleFileUrlInput(e.target.value)}
                placeholder="Paste Figma file URL or file key"
                className="url-input"
              />
              {fileUrlError && <div className="url-error">{fileUrlError}</div>}
            </div>
            <p className="url-help">
              You can paste a Figma file URL or directly enter a file key
            </p>
          </div>

          {selectedFileKey && (
            <div className="section">
              <h3>Add Comment</h3>
              <div className="comment-form">
                <textarea
                  value={commentMessage}
                  onChange={(e) => setCommentMessage(e.target.value)}
                  placeholder="Enter your comment..."
                  rows={3}
                />
                <div className="position-inputs">
                  <input
                    type="number"
                    placeholder="X"
                    value={commentPosition.x}
                    onChange={(e) => setCommentPosition(prev => ({ ...prev, x: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    placeholder="Y"
                    value={commentPosition.y}
                    onChange={(e) => setCommentPosition(prev => ({ ...prev, y: Number(e.target.value) }))}
                  />
                </div>
                <button onClick={handleAddComment} className="comment-btn">
                  Add Comment
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="content">
          {formattedFile ? (
            <div className="file-data-display">
              <h3>📊 Figma File Data</h3>
              <div className="file-summary">
                <h4>File Summary</h4>
                <p><strong>Name:</strong> {formattedFile.name}</p>
                <p><strong>Version:</strong> {formattedFile.version}</p>
                <p><strong>Last Modified:</strong> {formattedFile.lastModified}</p>
                <p><strong>Pages:</strong> {formattedFile.summary.totalPages}</p>
                <p><strong>Total Nodes:</strong> {formattedFile.summary.totalNodes}</p>
                <p><strong>Components:</strong> {formattedFile.summary.totalComponents}</p>
                <p><strong>Styles:</strong> {formattedFile.summary.totalStyles}</p>
              </div>
              
              <div className="data-export">
                <h4>📥 Export Data</h4>
                <button 
                  onClick={() => {
                    const dataStr = JSON.stringify(formattedFile, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${formattedFile.name.replace(/\s+/g, '_')}_data.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="export-btn"
                >
                  📄 Download JSON
                </button>
                <button 
                  onClick={() => {
                    console.log('Figma Data:', formattedFile);
                    alert('Data logged to console!');
                  }}
                  className="log-btn"
                >
                  📋 Log to Console
                </button>
              </div>
              
              <div className="json-preview">
                <h4>🔍 Data Preview</h4>
                <details>
                  <summary>Click to expand JSON preview</summary>
                  <pre className="json-content">
                    {JSON.stringify(formattedFile, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ) : (
            <div className="no-file-selected">
              <p>Select a Figma file to view formatted data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FigmaConnector;
