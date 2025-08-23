import type { FigmaFileResponse } from '../services/figmaApi';

/**
 * Core function to import and format Figma file data
 * Returns clean, organized JSON data structure
 */
export const importFigmaData = (fileData: FigmaFileResponse): any => {
  try {
    // Extract and format the data
    const formattedData = {
      // File metadata
      id: fileData.name.toLowerCase().replace(/\s+/g, '-'),
      name: fileData.name,
      version: fileData.version,
      lastModified: fileData.lastModified,
      thumbnailUrl: fileData.thumbnailUrl,
      
      // Pages with simplified structure
      pages: extractPages(fileData.document),
      
      // Components
      components: extractComponents(fileData.components || {}),
      
      // Styles
      styles: extractStyles(fileData.styles || {}),
      
      // Summary statistics
      summary: generateSummary(fileData)
    };
    
    return formattedData;
  } catch (error) {
    console.error('Error importing Figma file:', error);
    throw new Error(`Failed to import Figma file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extract pages with simplified node structure
 */
const extractPages = (document: any): any[] => {
  const pages: any[] = [];
  
  if (document.children) {
    document.children.forEach((node: any) => {
      if (node.type === 'PAGE') {
        const page = {
          id: node.id,
          name: node.name,
          type: 'PAGE',
          children: formatNodes(node.children || []),
          bounds: node.absoluteBoundingBox ? formatBounds(node.absoluteBoundingBox) : null,
          nodeCount: countNodes(node)
        };
        pages.push(page);
      }
    });
  }
  
  return pages;
};

/**
 * Format nodes with essential properties
 */
const formatNodes = (nodes: any[]): any[] => {
  return nodes.map(node => ({
    id: node.id,
    name: node.name,
    type: node.type,
    children: node.children ? formatNodes(node.children) : undefined,
    bounds: node.absoluteBoundingBox ? formatBounds(node.absoluteBoundingBox) : null,
    properties: {
      visible: node.visible !== false,
      locked: node.locked === true,
      opacity: node.opacity || 1,
      fills: formatFills(node.fills || []),
      strokes: formatStrokes(node.strokes || []),
      effects: formatEffects(node.effects || [])
    }
  }));
};

/**
 * Format fill properties
 */
const formatFills = (fills: any[]): any[] => {
  return fills.map(fill => ({
    type: fill.type || 'SOLID',
    color: fill.color ? formatColor(fill.color) : null,
    opacity: fill.opacity,
    visible: fill.visible !== false
  }));
};

/**
 * Format stroke properties
 */
const formatStrokes = (strokes: any[]): any[] => {
  return strokes.map(stroke => ({
    type: stroke.type || 'SOLID',
    color: stroke.color ? formatColor(stroke.color) : null,
    weight: stroke.strokeWeight || 1,
    visible: stroke.visible !== false
  }));
};

/**
 * Format effect properties
 */
const formatEffects = (effects: any[]): any[] => {
  return effects.map(effect => ({
    type: effect.type || 'DROP_SHADOW',
    visible: effect.visible !== false,
    radius: effect.radius,
    color: effect.color ? formatColor(effect.color) : null,
    offset: effect.offset
  }));
};

/**
 * Format color values
 */
const formatColor = (color: any): any => {
  return {
    r: color.r || 0,
    g: color.g || 0,
    b: color.b || 0,
    a: color.a !== undefined ? color.a : 1,
    hex: rgbToHex(color.r || 0, color.g || 0, color.b || 0)
  };
};

/**
 * Format bounds
 */
const formatBounds = (bounds: any): any => {
  return {
    x: Math.round(bounds.x || 0),
    y: Math.round(bounds.y || 0),
    width: Math.round(bounds.width || 0),
    height: Math.round(bounds.height || 0)
  };
};

/**
 * Extract components
 */
const extractComponents = (components: Record<string, any>): any[] => {
  return Object.values(components).map(component => ({
    id: component.id || component.key,
    name: component.name,
    key: component.key,
    type: component.type,
    description: component.description,
    bounds: component.absoluteBoundingBox ? formatBounds(component.absoluteBoundingBox) : null
  }));
};

/**
 * Extract styles
 */
const extractStyles = (styles: Record<string, any>): any[] => {
  return Object.values(styles).map(style => ({
    id: style.id || style.key,
    name: style.name,
    key: style.key,
    type: style.styleType,
    description: style.description
  }));
};

/**
 * Count total nodes in a tree
 */
const countNodes = (node: any): number => {
  let count = 1;
  if (node.children) {
    count += node.children.reduce((total: number, child: any) => total + countNodes(child), 0);
  }
  return count;
};

/**
 * Generate file summary
 */
const generateSummary = (fileData: FigmaFileResponse): any => {
  const pages = extractPages(fileData.document);
  const components = extractComponents(fileData.components || {});
  const styles = extractStyles(fileData.styles || {});
  
  // Count node types
  const nodeTypes: Record<string, number> = {};
  const colorPalette: string[] = [];
  
  pages.forEach(page => {
    countNodeTypesRecursive(page.children, nodeTypes, colorPalette);
  });
  
  return {
    totalNodes: pages.reduce((total, page) => total + page.nodeCount, 0),
    totalComponents: components.length,
    totalStyles: styles.length,
    totalPages: pages.length,
    nodeTypes,
    colorPalette: [...new Set(colorPalette)],
    lastModified: new Date(fileData.lastModified).toLocaleDateString()
  };
};

/**
 * Recursively count node types and collect colors
 */
const countNodeTypesRecursive = (nodes: any[], nodeTypes: Record<string, number>, colorPalette: string[]) => {
  nodes.forEach(node => {
    // Count node type
    nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    
    // Collect colors from fills
    if (node.properties && node.properties.fills) {
      node.properties.fills.forEach((fill: any) => {
        if (fill.color && fill.color.hex) {
          colorPalette.push(fill.color.hex);
        }
      });
    }
    
    // Recursively process children
    if (node.children) {
      countNodeTypesRecursive(node.children, nodeTypes, colorPalette);
    }
  });
};

/**
 * Convert RGB values to hex color
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
