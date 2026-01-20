# Render Deployment Setup Guide

## Environment Variables Configuration

When deploying to Render, you need to set environment variables in the Render dashboard, not in the `.env` file (which is only used for local development).

### Critical: API Base URL Configuration

**Problem:** If your frontend is served over HTTPS (which Render does by default), your API must also use HTTPS to avoid "Mixed Content" errors.

**Solution:** Set the `VITE_API_BASE_URL` environment variable in Render's dashboard.

### Steps to Fix Mixed Content Error:

1. **Check if your backend API supports HTTPS:**
   - If your backend API at `34.228.254.219:8089` supports HTTPS, use: `https://34.228.254.219:8089/`
   - If not, you need to configure your backend to support HTTPS or use a reverse proxy

2. **Set Environment Variable in Render:**
   - Go to your Render dashboard
   - Navigate to your frontend service
   - Go to "Environment" tab
   - Add or update the environment variable:
     - **Key:** `VITE_API_BASE_URL`
     - **Value:** `https://your-backend-url:8089/` (use HTTPS, not HTTP)
   - Save and redeploy

3. **Alternative: Use a Backend Service on Render:**
   - Deploy your backend API as a separate service on Render
   - Render provides HTTPS automatically for services
   - Use the Render-provided HTTPS URL as your `VITE_API_BASE_URL`

### Current Issue:
Your `.env` file has:
```
VITE_API_BASE_URL=http://34.228.254.219:8089/
```

This HTTP URL causes Mixed Content errors when your frontend is served over HTTPS. You must change it to HTTPS in Render's environment variables.

### Common Error: ERR_SSL_PROTOCOL_ERROR

If you're seeing `ERR_SSL_PROTOCOL_ERROR` after changing to HTTPS, it means your backend API doesn't properly support HTTPS. This can happen if:

1. **The backend doesn't have an SSL certificate** - The backend needs a valid SSL/TLS certificate
2. **The backend isn't configured for HTTPS** - Even with HTTPS in the URL, the server must be set up to handle HTTPS connections
3. **Certificate is invalid or self-signed** - Browsers may reject self-signed certificates

**Solutions:**

#### Option 1: Configure Backend with HTTPS (Recommended)
- Obtain an SSL certificate (Let's Encrypt, Cloudflare, etc.)
- Configure your backend server to use HTTPS on port 8089
- Ensure the certificate is valid and trusted

#### Option 2: Use a Reverse Proxy (Quick Fix)
- Set up Nginx or another reverse proxy in front of your backend
- Configure the proxy with SSL certificate
- Point `VITE_API_BASE_URL` to the proxy's HTTPS URL

#### Option 3: Deploy Backend on Render (Best for Production)
- Deploy your backend API as a separate service on Render
- Render provides HTTPS automatically with valid certificates
- Use Render's HTTPS URL as your `VITE_API_BASE_URL`
- Example: `https://your-backend-service.onrender.com/`

#### Option 4: Use HTTP with a Development/Testing Environment
- **NOT RECOMMENDED for production**
- Only use if absolutely necessary for testing
- Consider security implications

### Note:
- The `.env` file is only used for local development
- Render uses environment variables set in the dashboard, not the `.env` file
- After setting the environment variable in Render, you need to trigger a new deployment
- Always test API connectivity after changing the environment variable
