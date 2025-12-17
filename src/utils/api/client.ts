import axios, { AxiosInstance, AxiosError } from 'axios';
import logger from '../../infrastructure/logging/logger';
import { formatAxiosError } from '../../shared/utils/error/handlers';
import { APP_CONFIG } from '../../shared/constants/appConfig';
import { getStoredToken } from '../../infrastructure/storage';

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
    console.error('❌ VITE_API_BASE_URL is not set in production environment!');
    console.error('   Please set VITE_API_BASE_URL in your .env file or build environment.');
    throw new Error('VITE_API_BASE_URL environment variable is required in production');
  }

  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Log API base URL in development for debugging
if (import.meta.env.DEV) {
  console.log('🔧 Development mode: Using proxy /api →', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
} else {
  console.log('🚀 Production mode: Using API URL →', API_BASE_URL);
}

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
    console.error('Request Setup Error:', error);
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
      } else if (error.message.includes('CORS')) {
        error.message = `CORS Error: The server at ${API_BASE_URL} is blocking the request. 
        
The server needs to allow requests from: ${window.location.origin}
Please contact the server administrator to configure CORS.`;
      } else {
        error.message = `Connection Error: ${error.message || `No response received from server at ${API_BASE_URL}. The server might be down or unreachable.`}`;
      }
    } else {
      console.error('Request Error:', error.message);
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
