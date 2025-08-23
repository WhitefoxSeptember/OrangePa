export const FIGMA_CONFIG = {
  // Base URL for Figma API
  API_BASE_URL: 'https://api.figma.com/v1',
  
  // OAuth Configuration
  OAUTH: {
    CLIENT_ID: 'UtNTZoTucMvR5vizcAk6bi',
    CLIENT_SECRET: 'Sxy3qfNHca6P9Y2FQHbnuTTuoVS63C',
    REDIRECT_URI: 'http://localhost:3001/auth/callback', // Points to OAuth server
    AUTH_URL: 'https://www.figma.com/oauth',
    SCOPE: 'files:read,comments:write', // Minimal required scopes
  },
  
  // Rate limiting (requests per minute)
  RATE_LIMIT: 60,
  
  // Default image format
  DEFAULT_IMAGE_FORMAT: 'png' as const,
  
  // Default image scale
  DEFAULT_IMAGE_SCALE: 1,
  
  // Cache duration for file data (in milliseconds)
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // Maximum file size to process (in bytes)
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
};

export const getFigmaAccessToken = (): string => {
  // In a real app, you'd get this from environment variables
  // For now, we'll use localStorage or prompt the user
  const token = localStorage.getItem('figma_access_token');
  
  if (!token) {
    throw new Error('Figma access token not found. Please connect your account first.');
  }
  
  return token;
};

export const setFigmaAccessToken = (token: string): void => {
  localStorage.setItem('figma_access_token', token);
};

export const clearFigmaAccessToken = (): void => {
  localStorage.removeItem('figma_access_token');
};

export const hasFigmaAccessToken = (): boolean => {
  return !!localStorage.getItem('figma_access_token');
};

// OAuth utility functions
export const generateOAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: FIGMA_CONFIG.OAUTH.CLIENT_ID,
    redirect_uri: FIGMA_CONFIG.OAUTH.REDIRECT_URI,
    scope: FIGMA_CONFIG.OAUTH.SCOPE,
    state: generateRandomState(), // CSRF protection
    response_type: 'code',
  });
  
  return `${FIGMA_CONFIG.OAUTH.AUTH_URL}?${params.toString()}`;
};

export const generateRandomState = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const getStoredState = (): string | null => {
  return localStorage.getItem('figma_oauth_state');
};

export const setStoredState = (state: string): void => {
  localStorage.setItem('figma_oauth_state', state);
};

export const clearStoredState = (): void => {
  localStorage.removeItem('figma_oauth_state');
};
