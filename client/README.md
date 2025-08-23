# 🎨 Figma Connector - Simplified

A clean, simple React application that connects to Figma and provides formatted JSON data.

## ✨ **Features**

- 🔐 **OAuth 2.0 Authentication** - Secure connection to Figma
- 📁 **File Browsing** - Browse teams, projects, and files
- 🔧 **Core Function** - `importFigmaData()` converts raw API data to clean JSON
- 📥 **Data Export** - Download formatted data as JSON file
- 📋 **Console Logging** - View data in browser console

## 🚀 **Quick Start**

### 1. **Install Dependencies**
```bash
cd client
npm install
```

### 2. **Start the Client**
```bash
npm run dev
```

### 3. **Start the OAuth Server**
```bash
cd server
npm install
npm start
```

### 4. **Connect to Figma**
- Click "Connect with Figma" button
- Authorize the application
- Browse your files and import data

## 🔧 **Core Function: importFigmaData**

The main utility function that transforms raw Figma API data into clean, organized JSON:

```typescript
import { importFigmaData } from './utils/figmaDataUtils';

// Convert raw Figma API response to clean format
const formattedData = importFigmaData(rawFigmaData);
```

### **Returns Clean JSON Structure:**
```json
{
  "id": "file-name",
  "name": "File Name",
  "version": "123",
  "lastModified": "2024-01-01T00:00:00.000Z",
  "thumbnailUrl": "https://...",
  "pages": [...],
  "components": [...],
  "styles": [...],
  "summary": {
    "totalNodes": 150,
    "totalComponents": 25,
    "totalStyles": 10,
    "totalPages": 3,
    "nodeTypes": { "FRAME": 50, "TEXT": 30, ... },
    "colorPalette": ["#FF0000", "#00FF00", ...],
    "lastModified": "1/1/2024"
  }
}
```

## 📁 **File Structure**

```
src/
├── components/
│   ├── FigmaConnector.tsx    # Main connector component
│   ├── OAuthCallback.tsx     # OAuth redirect handler
│   └── FigmaConnector.css    # Component styles
├── services/
│   ├── figmaApi.ts           # Figma API service
│   └── figmaOAuth.ts         # OAuth authentication
├── hooks/
│   └── useFigma.ts           # Figma API hook
├── utils/
│   ├── figmaDataUtils.ts     # Core importFigmaData function
│   └── figmaUtils.ts         # Utility functions
└── config/
    └── figma.ts              # Configuration
```

## 🎯 **Usage Examples**

### **Basic File Import**
```typescript
const handleFileSelect = async (fileKey: string) => {
  const file = await getFile(fileKey);
  if (file) {
    const formatted = importFigmaData(file);
    console.log('Formatted data:', formatted);
  }
};
```

### **Export Data**
```typescript
// Download as JSON file
const dataStr = JSON.stringify(formattedData, null, 2);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = 'figma_data.json';
link.click();
```

## 🔐 **OAuth Configuration**

The app uses OAuth 2.0 for secure authentication. Configure your Figma app with:

- **Redirect URI**: `http://localhost:3001/auth/callback`
- **Scopes**: `files:read`

## 📊 **Data Format**

### **Pages**
- Hierarchical structure with nested nodes
- Bounds and positioning information
- Node counts and properties

### **Components**
- Reusable design elements
- Metadata and descriptions
- Bounds and sizing

### **Styles**
- Design tokens and variables
- Color, typography, and effect styles
- Remote/local status

### **Summary**
- File statistics and counts
- Node type analysis
- Color palette extraction

## 🎨 **UI Features**

- **File Browser** - Navigate teams, projects, and files
- **Data Display** - View formatted file information
- **Export Options** - Download JSON or log to console
- **JSON Preview** - Expandable data preview
- **Responsive Design** - Works on all screen sizes

## 🚀 **Next Steps**

1. **Customize the data format** in `figmaDataUtils.ts`
2. **Add more export formats** (CSV, XML, etc.)
3. **Implement data filtering** and search
4. **Add data visualization** charts and graphs
5. **Build custom analyzers** for specific design needs

## 📚 **Resources**

- [Figma API Documentation](https://www.figma.com/developers/api)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Simple, clean, and powerful Figma data extraction! 🎉**
