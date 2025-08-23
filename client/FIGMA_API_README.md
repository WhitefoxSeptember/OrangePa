# Figma API Connector

A comprehensive React-based connector for the Figma API that allows you to interact with Figma files, projects, and teams programmatically.

## Features

- 🔐 **Authentication**: Secure connection using Figma access tokens
- 📁 **File Management**: Browse and view Figma files
- 🏗️ **Project Navigation**: Navigate through teams and projects
- 💬 **Comment System**: Add comments to Figma files
- 🖼️ **Image Export**: Export node images in various formats
- 📊 **File Structure**: View document hierarchy and node properties
- 🎨 **Modern UI**: Clean, responsive interface built with React

## Getting Started

### 1. Prerequisites

- Node.js 16+ and npm/yarn
- A Figma account
- Figma access token

### 2. Installation

The Figma API connector is already included in this project. No additional installation is required.

### 3. Getting Your Figma Access Token

1. Go to your [Figma account settings](https://www.figma.com/settings)
2. Navigate to **Personal access tokens**
3. Click **Create new token**
4. Give it a name and copy the generated token
5. **Important**: Store this token securely - it won't be shown again

### 4. Usage

#### Basic Connection

```tsx
import useFigma from './hooks/useFigma';

function MyComponent() {
  const { connect, isConnected, user } = useFigma({
    accessToken: 'your_token_here',
    autoConnect: false
  });

  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect to Figma</button>
      ) : (
        <p>Connected as: {user?.handle}</p>
      )}
    </div>
  );
}
```

#### Using the Full Component

```tsx
import FigmaConnector from './components/FigmaConnector';

function App() {
  return (
    <div className="App">
      <FigmaConnector />
    </div>
  );
}
```

## API Reference

### FigmaApiService

The core service class that handles all Figma API interactions.

```tsx
import FigmaApiService from './services/figmaApi';

const figmaService = new FigmaApiService('your_access_token');

// Get a file
const file = await figmaService.getFile('file_key');

// Get image URLs
const images = await figmaService.getImageUrls('file_key', ['node_id'], 'png', 2);

// Add a comment
await figmaService.addComment('file_key', 'Great design!', { x: 100, y: 200 });
```

### useFigma Hook

A React hook that provides state management and easy access to Figma API functionality.

```tsx
const {
  // Connection state
  isConnected,
  isLoading,
  error,
  
  // Data
  user,
  teams,
  projects,
  files,
  
  // Actions
  connect,
  disconnect,
  getFile,
  addComment,
} = useFigma({ accessToken: 'token', autoConnect: false });
```

## Available Operations

### File Operations
- `getFile(fileKey)`: Retrieve file data and structure
- `getFileNodes(fileKey, nodeIds)`: Get specific nodes from a file
- `getImageUrls(fileKey, nodeIds, format, scale)`: Export nodes as images

### Project Management
- `getTeams()`: List user's teams
- `getTeamProjects(teamId)`: List projects in a team
- `getProjectFiles(projectId)`: List files in a project

### Collaboration
- `getComments(fileKey)`: Retrieve file comments
- `addComment(fileKey, message, position, nodeId)`: Add new comments

### User Information
- `getUser()`: Get current user details

## File Structure

```
src/
├── services/
│   └── figmaApi.ts          # Core API service
├── hooks/
│   └── useFigma.ts          # React hook for Figma API
├── components/
│   ├── FigmaConnector.tsx   # Main UI component
│   └── FigmaConnector.css   # Component styles
└── config/
    └── figma.ts             # Configuration and utilities
```

## Error Handling

The connector includes comprehensive error handling:

- Network errors
- Authentication failures
- Rate limiting
- Invalid file keys
- Permission issues

Errors are displayed in the UI and can be handled programmatically:

```tsx
const { error, connect } = useFigma({ accessToken: 'token' });

if (error) {
  console.error('Figma connection error:', error);
}
```

## Rate Limiting

The Figma API has rate limits:
- **Personal tokens**: 60 requests per minute
- **Team tokens**: 120 requests per minute

The connector automatically handles rate limiting and provides user feedback.

## Security Considerations

- **Never commit access tokens** to version control
- Use environment variables in production
- Implement token rotation for production apps
- Consider using OAuth for user-facing applications

## Troubleshooting

### Common Issues

1. **"Invalid access token"**
   - Verify your token is correct
   - Check if the token has expired
   - Ensure you have the necessary permissions

2. **"Rate limit exceeded"**
   - Wait for the rate limit window to reset
   - Implement request caching
   - Use batch operations when possible

3. **"File not found"**
   - Verify the file key is correct
   - Check if you have access to the file
   - Ensure the file hasn't been deleted

### Debug Mode

Enable debug logging by setting the log level:

```tsx
// In your browser console
localStorage.setItem('figma_debug', 'true');
```

## Examples

### Exporting Design Assets

```tsx
const { getImageUrls } = useFigma({ accessToken: 'token' });

const exportAssets = async (fileKey: string, nodeIds: string[]) => {
  try {
    const images = await getImageUrls(fileKey, nodeIds, 'png', 2);
    
    // Download images
    Object.entries(images.images).forEach(([nodeId, url]) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `asset_${nodeId}.png`;
      link.click();
    });
  } catch (error) {
    console.error('Export failed:', error);
  }
};
```

### Building a Design System Viewer

```tsx
const { getFile } = useFigma({ accessToken: 'token' });

const viewDesignSystem = async (fileKey: string) => {
  const file = await getFile(fileKey);
  
  // Extract components
  const components = Object.values(file.components);
  
  // Display component library
  return components.map(component => (
    <div key={component.key}>
      <h3>{component.name}</h3>
      <img src={component.imageUrl} alt={component.name} />
    </div>
  ));
};
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section
- Review Figma's [API documentation](https://www.figma.com/developers/api)
- Open an issue in the project repository

## Changelog

### v1.0.0
- Initial release
- Core API service
- React hooks
- UI components
- File browsing and viewing
- Comment system
