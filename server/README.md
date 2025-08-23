# Figma OAuth Server

A simple Express server that handles Figma OAuth token exchange securely on the backend.

## Why This Server?

The Figma OAuth flow requires exchanging an authorization code for an access token. This exchange must happen server-side because it involves your client secret, which should never be exposed in client-side code.

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3001
NODE_ENV=development
```

### 3. Update Client Configuration

In your client app, update the OAuth redirect URI to point to this server:

```typescript
// In client/src/config/figma.ts
REDIRECT_URI: 'http://localhost:3001/auth/callback'
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on port 3001 by default.

## API Endpoints

### POST /api/figma/oauth/token
Exchanges authorization code for access token.

**Request Body:**
```json
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret", 
  "code": "authorization_code",
  "redirect_uri": "your_redirect_uri",
  "grant_type": "authorization_code"
}
```

**Response:**
```json
{
  "access_token": "figma_access_token",
  "refresh_token": "figma_refresh_token",
  "expires_in": 3600,
  "token_type": "bearer",
  "scope": "files:read,comments:write"
}
```

### POST /api/figma/oauth/refresh
Refreshes an expired access token.

**Request Body:**
```json
{
  "refresh_token": "your_refresh_token",
  "grant_type": "refresh_token"
}
```

### GET /health
Health check endpoint.

## Security Features

- **CORS enabled** for cross-origin requests
- **Client secret protection** - never exposed to client
- **Input validation** for all OAuth parameters
- **Error handling** with proper HTTP status codes
- **Logging** for debugging and monitoring

## Production Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Environment Variables**: Store sensitive data in environment variables
3. **Rate Limiting**: Consider adding rate limiting for OAuth endpoints
4. **Logging**: Implement proper logging and monitoring
5. **Error Handling**: Add more sophisticated error handling
6. **Validation**: Add request validation middleware

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure the client origin is allowed
2. **Invalid redirect URI**: Check that redirect URI matches Figma app settings
3. **Token exchange failures**: Verify client ID and secret are correct

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## Architecture

```
Client App → Figma OAuth → Authorization Code → OAuth Server → Access Token
     ↑                                                           ↓
     ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

The OAuth server acts as a secure intermediary between your client app and Figma's OAuth service.
