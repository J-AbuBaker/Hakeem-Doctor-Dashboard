import axios, { AxiosInstance, AxiosError } from 'axios';
import logger from '../logging/logger';
import { formatAxiosError } from '@shared/utils/error/handlers';
import { APP_CONFIG } from '@shared/constants/appConfig';
import { getStoredToken } from '../storage/tokenStorage';

/**
 * API base URL configuration
 * Uses proxy in development, direct URL in production
 * Reads from environment variable VITE_API_BASE_URL
 */
const getApiBaseUrl = (): string => {
  if (import.meta.env.DEV) {
    // In development, use proxy
    return '/api';
  }

  // In production, use environment variable
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  if (!apiUrl) {
    throw new Error('VITE_API_BASE_URL environment variable is required in production');
  }

  // Check for Mixed Content issues (HTTP API with HTTPS page)
  if (typeof window !== 'undefined') {
    const isPageHttps = window.location.protocol === 'https:';
    const isApiHttp = apiUrl.trim().toLowerCase().startsWith('http://');
    
    if (isPageHttps && isApiHttp) {
      console.error(
        '🚨 MIXED CONTENT ERROR DETECTED:\n' +
        `\nThe page is loaded over HTTPS (${window.location.origin})` +
        `\nbut the API URL uses HTTP (${apiUrl})` +
        `\n\nBrowsers block HTTP requests from HTTPS pages for security.` +
        `\n\nTO FIX:` +
        `\n1. Set VITE_API_BASE_URL environment variable in Render to use HTTPS` +
        `\n2. Ensure your backend API supports HTTPS` +
        `\n3. Or configure your backend behind an HTTPS proxy` +
        `\n\nCurrent API URL: ${apiUrl}` +
        `\nPlease update it to use HTTPS in Render's environment variables.`
      );
      
      // Throw a more descriptive error
      throw new Error(
        'Mixed Content Error: The page is served over HTTPS but the API URL uses HTTP. ' +
        'Set VITE_API_BASE_URL in Render to use HTTPS (e.g., https://your-backend-url:8089/). ' +
        `Current API URL: ${apiUrl}`
      );
    }
  }

  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();


/**
 * Test server connectivity
 */
export async function testServerConnection(): Promise<boolean> {
  try {
    await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      mode: 'no-cors', // Try without CORS first
    });
    return true;
  } catch (error) {
    // Try with CORS
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'OPTIONS',
      });
      return response.status < 500;
    } catch (e) {
      return false;
    }
  }
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: APP_CONFIG.API_TIMEOUT,
});

/**
 * Request interceptor: Adds authentication token and logs requests
 */
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    logger.logRequest(
      config.method?.toUpperCase() || 'UNKNOWN',
      config.url || '',
      config,
      config.data
    );

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handles authentication errors and logs responses
 */
api.interceptors.response.use(
  (response) => {
    logger.logResponse(
      response.config.method?.toUpperCase() || 'UNKNOWN',
      response.config.url || '',
      response.status,
      response.statusText,
      response.data,
      response.headers
    );
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      logger.logError(
        error.config?.method?.toUpperCase() || 'UNKNOWN',
        error.config?.url || '',
        error.response.status,
        error.response.statusText,
        error.response.data,
        error.response.headers
      );
    } else if (error.request) {
      logger.logNetworkError(
        error.config?.method?.toUpperCase() || 'UNKNOWN',
        error.config?.url || '',
        error.request,
        {
          code: error.code,
          message: error.message,
          baseURL: API_BASE_URL,
          fullURL: `${API_BASE_URL}${error.config?.url || ''}`,
        }
      );

      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        error.message = `Network Error: Cannot connect to server at ${API_BASE_URL}. 
        
Possible causes:
• Server is down or not running
• Network connectivity issue
• Firewall blocking the connection
• CORS configuration issue on server
• Incorrect server URL

Please verify:
1. The server is running at ${API_BASE_URL}
2. Your network connection is working
3. The server allows requests from your origin
4. Check browser console (F12) for detailed error messages`;
      } else if (error.code === 'ECONNABORTED') {
        error.message = 'Request Timeout: The server took too long to respond. Please try again.';
      } else if (error.code === 'ERR_SSL_PROTOCOL_ERROR' || error.message.includes('SSL') || error.message.includes('SSL_PROTOCOL')) {
        error.message = `SSL Protocol Error: The API server at ${API_BASE_URL} is not properly configured for HTTPS.

Possible causes:
• The backend server doesn't support HTTPS
• The SSL certificate is invalid or missing
• The server is configured for HTTP but accessed via HTTPS

Solutions:
1. Ensure your backend API is properly configured with HTTPS and a valid SSL certificate
2. Use a reverse proxy (Nginx, Cloudflare) with SSL in front of your backend
3. Deploy your backend on Render to get automatic HTTPS support
4. Verify the API URL in Render's environment variables is correct

Current API URL: ${API_BASE_URL}
Please check the backend server configuration.`;
      } else if (error.message.includes('CORS')) {
        error.message = `CORS Error: The server at ${API_BASE_URL} is blocking the request. 
        
The server needs to allow requests from: ${window.location.origin}
Please contact the server administrator to configure CORS.`;
      } else {
        error.message = `Connection Error: ${error.message || `No response received from server at ${API_BASE_URL}. The server might be down or unreachable.`}`;
      }
    } else {
      error.message = `Request Setup Error: ${error.message}`;
    }

    // Format error using utility function
    const formattedError = formatAxiosError(error);
    error.message = formattedError.message;

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      error.message = `Access Denied (403): You don't have permission to access this resource. Required role: DOCTOR. Please contact your administrator if you believe this is an error.`;
    }
    return Promise.reject(error);
  }
);

export default api;
