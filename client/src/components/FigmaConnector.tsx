import React, { useState, useEffect } from 'react';
import useFigma from '../hooks/useFigma';
import type { FigmaFile, FigmaNode } from '../services/figmaApi';
import { extractFileKeyFromUrl, isValidFileKey, generateFigmaFileUrl } from '../utils/figmaUtils';
import FigmaOAuthService from '../services/figmaOAuth';
import './FigmaConnector.css';

const FigmaConnector: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFileKey, setSelectedFileKey] = useState('');
  const [fileData, setFileData] = useState<any>(null);
  const [commentMessage, setCommentMessage] = useState('');
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [fileUrlError, setFileUrlError] = useState('');
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  const oauthService = FigmaOAuthService.getInstance();
  const accessToken = oauthService.getAccessToken();

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
    setFileData(null);
    if (teamId) {
      await refreshProjects(teamId);
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedFileKey('');
    setFileData(null);
    if (projectId) {
      await refreshFiles(projectId);
    }
  };

  const handleFileSelect = async (fileKey: string) => {
    setSelectedFileKey(fileKey);
    if (fileKey) {
      const file = await getFile(fileKey);
      setFileData(file);
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
          {fileData ? (
            <div className="file-viewer">
              <h3>{fileData.name}</h3>
              <div className="file-info">
                <p><strong>Version:</strong> {fileData.version}</p>
                <p><strong>Last Modified:</strong> {new Date(fileData.lastModified).toLocaleString()}</p>
              </div>
              
              <div className="node-tree">
                <h4>Document Structure</h4>
                {renderNodeTree(fileData.document)}
              </div>
            </div>
          ) : (
            <div className="placeholder">
              <p>Select a file to view its contents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FigmaConnector;
