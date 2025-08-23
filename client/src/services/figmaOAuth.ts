import { FIGMA_CONFIG, setStoredState, getStoredState, clearStoredState } from '../config/figma';

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface OAuthError {
  error: string;
  error_description?: string;
}

export class FigmaOAuthService {
  private static instance: FigmaOAuthService;
  
  private constructor() {}
  
  static getInstance(): FigmaOAuthService {
    if (!FigmaOAuthService.instance) {
      FigmaOAuthService.instance = new FigmaOAuthService();
    }
    return FigmaOAuthService.instance;
  }

  /**
   * Initiate OAuth flow by redirecting user to Figma
   */
  initiateAuth(): void {
    const state = this.generateRandomState();
    setStoredState(state);
    
    const authUrl = this.generateAuthUrl(state);
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback and exchange authorization code for access token
   */
  async handleCallback(code: string, state: string): Promise<OAuthTokenResponse> {
    // Verify state parameter for CSRF protection
    const storedState = getStoredState();
    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter. Possible CSRF attack.');
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeCodeForToken(code);
      
      // Store the access token
      localStorage.setItem('figma_access_token', tokenResponse.access_token);
      
      // Clear the stored state
      clearStoredState();
      
      return tokenResponse;
    } catch (error) {
      clearStoredState();
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    // Note: In a production app, this should be done server-side
    // For now, we'll use a proxy or handle it client-side
    
    const response = await fetch('/api/figma/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: FIGMA_CONFIG.OAUTH.CLIENT_ID,
        client_secret: FIGMA_CONFIG.OAUTH.CLIENT_SECRET,
        code,
        redirect_uri: FIGMA_CONFIG.OAUTH.REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorData: OAuthError = await response.json();
      throw new Error(errorData.error_description || errorData.error || 'Failed to exchange code for token');
    }

    return response.json();
  }

  /**
   * Generate OAuth authorization URL
   */
  private generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: FIGMA_CONFIG.OAUTH.CLIENT_ID,
      redirect_uri: FIGMA_CONFIG.OAUTH.REDIRECT_URI,
      scope: FIGMA_CONFIG.OAUTH.SCOPE,
      state,
      response_type: 'code',
    });
    
    return `${FIGMA_CONFIG.OAUTH.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('figma_access_token');
    return !!token;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('figma_access_token');
  }

  /**
   * Logout user by clearing tokens
   */
  logout(): void {
    localStorage.removeItem('figma_access_token');
    localStorage.removeItem('figma_refresh_token');
    clearStoredState();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<OAuthTokenResponse> {
    const refreshToken = localStorage.getItem('figma_refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/figma/oauth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: FIGMA_CONFIG.OAUTH.CLIENT_ID,
        client_secret: FIGMA_CONFIG.OAUTH.CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData: OAuthError = await response.json();
      throw new Error(errorData.error_description || errorData.error || 'Failed to refresh token');
    }

    const tokenResponse = await response.json();
    
    // Update stored tokens
    localStorage.setItem('figma_access_token', tokenResponse.access_token);
    if (tokenResponse.refresh_token) {
      localStorage.setItem('figma_refresh_token', tokenResponse.refresh_token);
    }

    return tokenResponse;
  }
}

export default FigmaOAuthService;
