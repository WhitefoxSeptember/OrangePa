import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress, Chip } from '@mui/material';
import { AccountTree, PlayArrow, Folder } from '@mui/icons-material';

interface DirectedGraph {
  [key: string]: string[];
}

interface RelationshipResponse {
  success: boolean;
  folderName: string;
  analysisFiles: number;
  relationshipFile: string;
  directedGraph: DirectedGraph;
  error?: string;
}

const PageRelationshipAnalyzer: React.FC = () => {
  const [folderName, setFolderName] = useState('');
  const [pageType, setPageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RelationshipResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!folderName.trim()) {
      setError('Please enter a folder name');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/file-analysis/relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderName: folderName.trim(),
          pageType: pageType.trim() || 'application'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to generate page relationships');
      }
    } catch (err) {
      setError('Network error: Unable to connect to server');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderDirectedGraph = (graph: DirectedGraph) => {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountTree />
          Page Flow Relationships
        </Typography>
        
        <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
          {Object.entries(graph).map(([fromPage, toPages]) => (
            <Box key={fromPage} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip 
                  label={fromPage} 
                  color="primary" 
                  variant="filled"
                  sx={{ fontWeight: 'bold' }}
                />
                {toPages.length > 0 && <PlayArrow sx={{ color: '#666' }} />}
              </Box>
              
              {toPages.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 4 }}>
                  {toPages.map((toPage, index) => (
                    <Chip 
                      key={index}
                      label={toPage} 
                      color="secondary" 
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              )}
              
              {toPages.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  No outgoing connections
                </Typography>
              )}
            </Box>
          ))}
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountTree />
        Page Relationship Analyzer
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Generate a directed graph showing navigation relationships between analyzed pages
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Folder Name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="e.g., test, banking-app"
            variant="outlined"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <Folder sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
          
          <TextField
            label="Page Type (Optional)"
            value={pageType}
            onChange={(e) => setPageType(e.target.value)}
            placeholder="e.g., banking application, e-commerce"
            variant="outlined"
            sx={{ flex: 1, minWidth: 200 }}
          />
        </Box>

        <Button
          variant="contained"
          onClick={handleAnalyze}
          disabled={loading || !folderName.trim()}
          sx={{ mt: 1 }}
          startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
        >
          {loading ? 'Analyzing...' : 'Generate Relationships'}
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Paper sx={{ p: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Successfully analyzed {result.analysisFiles} files and generated {result.relationshipFile}
          </Alert>

          {result.directedGraph && Object.keys(result.directedGraph).length > 0 ? (
            renderDirectedGraph(result.directedGraph)
          ) : (
            <Typography color="text.secondary">
              No page relationships found in the analysis files.
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default PageRelationshipAnalyzer;
