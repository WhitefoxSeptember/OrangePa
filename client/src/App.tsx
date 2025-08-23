import React from 'react';
import FigmaConnector from './components/FigmaConnector';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>🎨 Figma Design System Explorer</h1>
        <p>Connect to Figma and explore your design files with powerful data utilities</p>
      </header>
      
      <main className="app-main">
        <FigmaConnector />
      </main>
      
      <footer className="app-footer">
        <p>Built with React + TypeScript • Figma API Integration</p>
      </footer>
    </div>
  );
}

export default App;
