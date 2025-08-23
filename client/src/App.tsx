import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FigmaFileImporter from './components/FigmaFileImporter';
import PageRelationshipAnalyzer from './components/PageRelationshipAnalyzer';
import Main from './components/Main';
import './App.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <div style={{ padding: '24px' }}>{children}</div>}
    </div>
  );
}

function HomePage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎨 OrangePa Analysis Suite</h1>
        <p>Figma file import and page relationship analysis</p>
      </header>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ borderBottom: '1px solid #e0e0e0', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            <button
              onClick={(e) => handleTabChange(e, 0)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: tabValue === 0 ? '2px solid #1976d2' : '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: tabValue === 0 ? 'bold' : 'normal',
                color: tabValue === 0 ? '#1976d2' : '#666'
              }}
            >
              Figma File Importer
            </button>
            <button
              onClick={(e) => handleTabChange(e, 1)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: tabValue === 1 ? '2px solid #1976d2' : '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: tabValue === 1 ? 'bold' : 'normal',
                color: tabValue === 1 ? '#1976d2' : '#666'
              }}
            >
              Page Relationships
            </button>
          </div>
        </div>
        
        <TabPanel value={tabValue} index={0}>
          <FigmaFileImporter />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <PageRelationshipAnalyzer />
        </TabPanel>
      </div>
      
      <footer className="app-footer">
        <p>Built with React + TypeScript • Figma API Integration • Page Flow Analysis</p>
        <div style={{ marginTop: '16px' }}>
          <Link 
            to="/main" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#1976d2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
          >
            🚀 Launch Full Analysis Suite
          </Link>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/main" element={<Main />} />
      </Routes>
    </Router>
  );
}

export default App
