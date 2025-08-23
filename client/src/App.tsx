import React from 'react';
import FigmaFileImporter from './components/FigmaFileImporter';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>🎨 Figma File Importer</h1>
        <p>Import Figma files and view formatted JSON data</p>
      </header>
      
      <main className="app-main">
        <FigmaFileImporter />
      </main>
      
      <footer className="app-footer">
        <p>Built with React + TypeScript • Figma API Integration</p>
      </footer>
    </div>
  );
}

export default App
