const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Figma OAuth configuration
const FIGMA_OAUTH = {
  CLIENT_ID: 'UtNTZoTucMvR5vizcAk6bi',
  CLIENT_SECRET: 'Sxy3qfNHca6P9Y2FQHbnuTTuoVS63C',
  TOKEN_URL: 'https://www.figma.com/api/oauth/token',
};

// OAuth callback route (GET request from Figma)
app.get('/auth/callback', (req, res) => {
  console.log('🔐 OAuth callback received:', req.query);
  
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('❌ OAuth error:', error);
    return res.status(400).json({
      error: 'oauth_error',
      error_description: error
    });
  }
  
  if (!code || !state) {
    console.error('❌ Missing parameters:', { code: !!code, state: !!state });
    return res.status(400).json({
      error: 'missing_parameters',
      error_description: 'Missing code or state parameter'
    });
  }
  
  console.log('✅ OAuth callback parameters received successfully');
  
  // For now, just return the parameters so we can see them
  // In a real app, you'd exchange the code for a token here
  res.json({
    message: 'OAuth callback received successfully! 🎉',
    code: code.substring(0, 10) + '...', // Only show first 10 chars for security
    state: state.substring(0, 10) + '...',
    next_step: 'Exchange this code for an access token using POST /api/figma/oauth/token'
  });
});

// Routes
app.post('/api/figma/oauth/token', async (req, res) => {
  try {
    const { code, redirect_uri, grant_type } = req.body;

    if (!code || !redirect_uri || !grant_type) {
      return res.status(400).json({
        error: 'missing_parameters',
        error_description: 'Missing required parameters'
      });
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(FIGMA_OAUTH.TOKEN_URL, {
      client_id: FIGMA_OAUTH.CLIENT_ID,
      client_secret: FIGMA_OAUTH.CLIENT_SECRET,
      code,
      redirect_uri,
      grant_type,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    res.json(tokenResponse.data);
  } catch (error) {
    console.error('OAuth token exchange error:', error.response?.data || error.message);
    
    if (error.response?.data) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'internal_error',
        error_description: 'Internal server error'
      });
    }
  }
});

app.post('/api/figma/oauth/refresh', async (req, res) => {
  try {
    const { refresh_token, grant_type } = req.body;

    if (!refresh_token || !grant_type) {
      return res.status(400).json({
        error: 'missing_parameters',
        error_description: 'Missing required parameters'
      });
    }

    // Refresh access token
    const tokenResponse = await axios.post(FIGMA_OAUTH.TOKEN_URL, {
      client_id: FIGMA_OAUTH.CLIENT_ID,
      client_secret: FIGMA_OAUTH.CLIENT_SECRET,
      refresh_token,
      grant_type,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    res.json(tokenResponse.data);
  } catch (error) {
    console.error('OAuth token refresh error:', error.response?.data || error.message);
    
    if (error.response?.data) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'internal_error',
        error_description: 'Internal server error'
      });
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test route to verify server is working
app.get('/', (req, res) => {
  res.json({
    message: 'Figma OAuth Server is running! 🚀',
    endpoints: {
      health: '/health',
      oauth_callback: '/auth/callback',
      token_exchange: 'POST /api/figma/oauth/token',
      token_refresh: 'POST /api/figma/oauth/refresh'
    },
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Figma OAuth server running on port ${PORT}`);
  console.log(`📱 Client should connect to: http://localhost:${PORT}`);
  console.log(`🔐 OAuth endpoints available at:`);
  console.log(`   POST /api/figma/oauth/token`);
  console.log(`   POST /api/figma/oauth/refresh`);
});
