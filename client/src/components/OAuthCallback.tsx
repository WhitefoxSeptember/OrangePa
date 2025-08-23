import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FigmaOAuthService from '../services/figmaOAuth';
import './OAuthCallback.css';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setErrorMessage(error);
          return;
        }

        if (!code || !state) {
          setStatus('error');
          setErrorMessage('Missing authorization code or state parameter');
          return;
        }

        const oauthService = FigmaOAuthService.getInstance();
        await oauthService.handleCallback(code, state);
        
        setStatus('success');
        
        // Redirect to main app after successful authentication
        setTimeout(() => {
          navigate('/');
        }, 2000);
        
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="oauth-callback">
        <div className="callback-content">
          <div className="loading-spinner"></div>
          <h2>Connecting to Figma...</h2>
          <p>Please wait while we complete your authentication.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="oauth-callback">
        <div className="callback-content error">
          <div className="error-icon">❌</div>
          <h2>Authentication Failed</h2>
          <p className="error-message">{errorMessage}</p>
          <button 
            onClick={() => navigate('/')} 
            className="retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="oauth-callback">
      <div className="callback-content success">
        <div className="success-icon">✅</div>
        <h2>Successfully Connected!</h2>
        <p>You have been successfully authenticated with Figma.</p>
        <p>Redirecting you to the main application...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
