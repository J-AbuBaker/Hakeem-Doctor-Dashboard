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

### Note:
- The `.env` file is only used for local development
- Render uses environment variables set in the dashboard, not the `.env` file
- After setting the environment variable in Render, you need to trigger a new deployment
