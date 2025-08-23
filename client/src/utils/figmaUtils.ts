/**
 * Utility functions for working with Figma URLs and file keys
 */

/**
 * Extract file key from a Figma URL
 * @param url - Figma URL (e.g., "https://www.figma.com/file/abc123/Design-System")
 * @returns File key or null if invalid
 */
export const extractFileKeyFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    
    // Handle different Figma URL formats
    if (urlObj.hostname === 'www.figma.com' || urlObj.hostname === 'figma.com') {
      const pathParts = urlObj.pathname.split('/');
      
      // Format: /file/{key}/{title}
      if (pathParts[1] === 'file' && pathParts[2]) {
        return pathParts[2];
      }
      
      // Format: /proto/{key}/{title}
      if (pathParts[1] === 'proto' && pathParts[2]) {
        return pathParts[2];
      }
      
      // Format: /design/{key}/{title}
      if (pathParts[1] === 'design' && pathParts[2]) {
        return pathParts[2];
      }
    }
    
    return null;
  } catch {
    return null;
  }
};

/**
 * Generate a Figma file URL from a file key
 * @param fileKey - Figma file key
 * @param title - Optional title for the URL
 * @returns Figma file URL
 */
export const generateFigmaFileUrl = (fileKey: string, title?: string): string => {
  const baseUrl = 'https://www.figma.com/file';
  const urlTitle = title ? `/${encodeURIComponent(title)}` : '';
  return `${baseUrl}/${fileKey}${urlTitle}`;
};

/**
 * Validate if a string is a valid Figma file key
 * @param fileKey - String to validate
 * @returns True if valid file key format
 */
export const isValidFileKey = (fileKey: string): boolean => {
  // Figma file keys are typically 22-25 character alphanumeric strings
  const fileKeyRegex = /^[a-zA-Z0-9]{22,25}$/;
  return fileKeyRegex.test(fileKey);
};

/**
 * Parse Figma node ID from various formats
 * @param nodeId - Node ID string
 * @returns Normalized node ID
 */
export const normalizeNodeId = (nodeId: string): string => {
  // Remove any URL encoding or extra characters
  return nodeId.replace(/[^a-zA-Z0-9:_-]/g, '');
};

/**
 * Generate a shareable link for a specific node in a Figma file
 * @param fileKey - Figma file key
 * @param nodeId - Node ID to link to
 * @returns Figma node link
 */
export const generateNodeLink = (fileKey: string, nodeId: string): string => {
  return `https://www.figma.com/file/${fileKey}?node-id=${encodeURIComponent(nodeId)}`;
};

/**
 * Extract team and project IDs from Figma URLs
 * @param url - Figma URL
 * @returns Object with team and project IDs
 */
export const extractTeamAndProjectFromUrl = (url: string): { teamId?: string; projectId?: string } => {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname === 'www.figma.com' || urlObj.hostname === 'figma.com') {
      const pathParts = urlObj.pathname.split('/');
      
      // Format: /team/{teamId}/project/{projectId}
      if (pathParts[1] === 'team' && pathParts[3] === 'project') {
        return {
          teamId: pathParts[2],
          projectId: pathParts[4]
        };
      }
    }
    
    return {};
  } catch {
    return {};
  }
};

/**
 * Format file size in human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file type icon based on Figma node type
 * @param nodeType - Figma node type
 * @returns Icon class name or emoji
 */
export const getNodeTypeIcon = (nodeType: string): string => {
  const iconMap: Record<string, string> = {
    'FRAME': '🖼️',
    'GROUP': '📦',
    'VECTOR': '🔷',
    'BOOLEAN_OPERATION': '⚡',
    'STAR': '⭐',
    'LINE': '➖',
    'ELLIPSE': '⭕',
    'REGULAR_POLYGON': '🔶',
    'RECTANGLE': '⬜',
    'TEXT': '📝',
    'SLICE': '✂️',
    'COMPONENT': '🧩',
    'INSTANCE': '🔄',
    'COMPONENT_SET': '📚',
    'DOCUMENT': '📄',
    'CANVAS': '🎨',
    'PAGE': '📃',
  };
  
  return iconMap[nodeType] || '❓';
};
