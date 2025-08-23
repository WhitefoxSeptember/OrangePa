import { useState, useCallback, useEffect } from 'react';
import FigmaApiService, { 
  type FigmaFileResponse, 
  type FigmaFile, 
  type FigmaProject, 
  type FigmaTeam 
} from '../services/figmaApi';

interface UseFigmaOptions {
  accessToken: string;
  autoConnect?: boolean;
}

interface UseFigmaReturn {
  // Service instance
  figmaService: FigmaApiService | null;
  
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // User data
  user: any | null;
  teams: FigmaTeam[];
  projects: FigmaProject[];
  files: FigmaFile[];
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshUser: () => Promise<void>;
  refreshTeams: () => Promise<void>;
  refreshProjects: (teamId: string) => Promise<void>;
  refreshFiles: (projectId: string) => Promise<void>;
  
  // File operations
  getFile: (fileKey: string) => Promise<FigmaFileResponse | null>;
  getImageUrls: (fileKey: string, nodeIds: string[], format?: 'jpg' | 'png' | 'svg' | 'pdf', scale?: number) => Promise<any>;
  addComment: (fileKey: string, message: string, position: { x: number; y: number }, nodeId?: string) => Promise<any>;
}

export const useFigma = ({ accessToken, autoConnect = false }: UseFigmaOptions): UseFigmaReturn => {
  const [figmaService, setFigmaService] = useState<FigmaApiService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [user, setUser] = useState<any | null>(null);
  const [teams, setTeams] = useState<FigmaTeam[]>([]);
  const [projects, setProjects] = useState<FigmaProject[]>([]);
  const [files, setFiles] = useState<FigmaFile[]>([]);

  const connect = useCallback(async () => {
    if (!accessToken) {
      setError('Access token is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const service = new FigmaApiService(accessToken);
      
      // Test connection by getting user info
      const userData = await service.getUser();
      
      setFigmaService(service);
      setUser(userData);
      setIsConnected(true);
      
      // Auto-fetch teams
      await refreshTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Figma');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const disconnect = useCallback(() => {
    setFigmaService(null);
    setIsConnected(false);
    setUser(null);
    setTeams([]);
    setProjects([]);
    setFiles([]);
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!figmaService) return;
    
    try {
      const userData = await figmaService.getUser();
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    }
  }, [figmaService]);

  const refreshTeams = useCallback(async () => {
    if (!figmaService) return;
    
    try {
      const { teams: teamsData } = await figmaService.getTeams();
      setTeams(teamsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    }
  }, [figmaService]);

  const refreshProjects = useCallback(async (teamId: string) => {
    if (!figmaService) return;
    
    try {
      const { projects: projectsData } = await figmaService.getTeamProjects(teamId);
      setProjects(projectsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    }
  }, [figmaService]);

  const refreshFiles = useCallback(async (projectId: string) => {
    if (!figmaService) return;
    
    try {
      const { files: filesData } = await figmaService.getProjectFiles(projectId);
      setFiles(filesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    }
  }, [figmaService]);

  const getFile = useCallback(async (fileKey: string): Promise<FigmaFileResponse | null> => {
    if (!figmaService) return null;
    
    try {
      return await figmaService.getFile(fileKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch file');
      return null;
    }
  }, [figmaService]);

  const getImageUrls = useCallback(async (
    fileKey: string, 
    nodeIds: string[], 
    format: 'jpg' | 'png' | 'svg' | 'pdf' = 'png', 
    scale: number = 1
  ) => {
    if (!figmaService) return null;
    
    try {
      return await figmaService.getImageUrls(fileKey, nodeIds, format, scale);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch image URLs');
      return null;
    }
  }, [figmaService]);

  const addComment = useCallback(async (
    fileKey: string, 
    message: string, 
    position: { x: number; y: number }, 
    nodeId?: string
  ) => {
    if (!figmaService) return null;
    
    try {
      return await figmaService.addComment(fileKey, message, position, nodeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      return null;
    }
  }, [figmaService]);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && accessToken) {
      connect();
    }
  }, [autoConnect, accessToken, connect]);

  return {
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
    refreshUser,
    refreshTeams,
    refreshProjects,
    refreshFiles,
    getFile,
    getImageUrls,
    addComment,
  };
};

export default useFigma;
