export interface FigmaFile {
  key: string;
  name: string;
  thumbnailUrl: string;
  lastModified: string;
  version: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  fills?: any[];
  strokes?: any[];
  effects?: any[];
  constraints?: any;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FigmaFileResponse {
  document: FigmaNode;
  components: Record<string, any>;
  styles: Record<string, any>;
  name: string;
  lastModified: string;
  version: string;
  thumbnailUrl: string;
}

export interface FigmaProject {
  id: string;
  name: string;
}

export interface FigmaTeam {
  id: string;
  name: string;
}

export class FigmaApiService {
  private accessToken: string;
  private baseUrl = 'https://api.figma.com/v1';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a Figma file by its key
   */
  async getFile(fileKey: string): Promise<FigmaFileResponse> {
    return this.makeRequest<FigmaFileResponse>(`/files/${fileKey}`);
  }

  /**
   * Get file nodes by their IDs
   */
  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<any> {
    const nodeIdsParam = nodeIds.join(',');
    return this.makeRequest<any>(`/files/${fileKey}/nodes?ids=${nodeIdsParam}`);
  }

  /**
   * Get image URLs for nodes
   */
  async getImageUrls(fileKey: string, nodeIds: string[], format: 'jpg' | 'png' | 'svg' | 'pdf' = 'png', scale: number = 1): Promise<any> {
    const nodeIdsParam = nodeIds.join(',');
    return this.makeRequest<any>(`/files/${fileKey}/images?ids=${nodeIdsParam}&format=${format}&scale=${scale}`);
  }

  /**
   * Get user's teams
   */
  async getTeams(): Promise<{ teams: FigmaTeam[] }> {
    return this.makeRequest<{ teams: FigmaTeam[] }>('/teams');
  }

  /**
   * Get projects in a team
   */
  async getTeamProjects(teamId: string): Promise<{ projects: FigmaProject[] }> {
    return this.makeRequest<{ projects: FigmaProject[] }>(`/teams/${teamId}/projects`);
  }

  /**
   * Get project files
   */
  async getProjectFiles(projectId: string): Promise<{ files: FigmaFile[] }> {
    return this.makeRequest<{ files: FigmaFile[] }>(`/projects/${projectId}/files`);
  }

  /**
   * Get user info
   */
  async getUser(): Promise<any> {
    return this.makeRequest<any>('/me');
  }

  /**
   * Get comments on a file
   */
  async getComments(fileKey: string): Promise<any> {
    return this.makeRequest<any>(`/files/${fileKey}/comments`);
  }

  /**
   * Add a comment to a file
   */
  async addComment(fileKey: string, message: string, position: { x: number; y: number }, nodeId?: string): Promise<any> {
    const body = {
      message,
      position,
      ...(nodeId && { node_id: nodeId }),
    };

    const response = await fetch(`${this.baseUrl}/files/${fileKey}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to add comment: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export default FigmaApiService;
