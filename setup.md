# 🚀 Figma OAuth Connector Setup Guide

This guide will help you set up the Figma OAuth connector with your provided credentials.

## 📋 Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Figma account
- Your Figma OAuth credentials (already provided)

## 🔧 Setup Steps

### 1. Install Client Dependencies

```bash
cd client
npm install
```

### 2. Install Server Dependencies

```bash
cd server
npm install
```

### 3. Configure Figma App Settings

1. Go to [Figma Developer Settings](https://www.figma.com/developers)
2. Find your app or create a new one
3. Set the **Redirect URI** to: `http://localhost:3001/auth/callback`
4. Save the changes

### 4. Start the OAuth Server

```bash
cd server
npm run dev
```

The server will start on port 3001. You should see:
```
🚀 Figma OAuth server running on port 3001
📱 Client should connect to: http://localhost:3001
🔐 OAuth endpoints available at:
   POST /api/figma/oauth/token
   POST /api/figma/oauth/refresh
```

### 5. Start the Client App

In a new terminal:

```bash
cd client
npm run dev
```

The client will start on port 5173.

### 6. Test the Connection

1. Open your browser to `http://localhost:5173`
2. Click "🔐 Connect with Figma"
3. You'll be redirected to Figma for authorization
4. After authorizing, you'll be redirected back to the app
5. You should now see your Figma teams, projects, and files!

## 🔐 OAuth Flow Explained

1. **User clicks "Connect with Figma"**
2. **App redirects to Figma** with your client ID and requested scopes
3. **User authorizes** the app on Figma
4. **Figma redirects back** with an authorization code
5. **OAuth server exchanges** the code for an access token
6. **Client receives** the access token and can make API calls

## 🛠️ Troubleshooting

### Common Issues

#### "Invalid redirect URI"
- Ensure the redirect URI in Figma matches exactly: `http://localhost:3001/auth/callback`
- Check for trailing slashes or typos

#### "CORS error"
- Make sure the OAuth server is running on port 3001
- Check that CORS is properly configured

#### "OAuth server not responding"
- Verify the server is running: `curl http://localhost:3001/health`
- Check server logs for errors

#### "Token exchange failed"
- Verify your client ID and secret are correct
- Check that the authorization code hasn't expired

### Debug Mode

Enable debug logging in the server:
```bash
cd server
NODE_ENV=development npm run dev
```

## 🔒 Security Notes

- **Never commit** your client secret to version control
- **Use HTTPS** in production
- **Validate** all OAuth parameters
- **Implement** proper error handling

## 📱 Production Deployment

For production:

1. **Update redirect URI** to your production domain
2. **Use HTTPS** for all endpoints
3. **Set environment variables** for sensitive data
4. **Add rate limiting** and monitoring
5. **Implement** proper logging

## 🎯 Next Steps

Once connected, you can:

- Browse your Figma teams and projects
- View file contents and structure
- Add comments to designs
- Export images and assets
- Build custom integrations

## 📚 Additional Resources

- [Figma API Documentation](https://www.figma.com/developers/api)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
- [Express.js Documentation](https://expressjs.com/)

## 🆘 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review server and client console logs
3. Verify Figma app settings
4. Check network requests in browser dev tools

---

**Happy coding! 🎉**
