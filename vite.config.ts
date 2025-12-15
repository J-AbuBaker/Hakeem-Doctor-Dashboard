import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Get API base URL from environment variable with fallback
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8080'
  
  // Validate API base URL
  if (!env.VITE_API_BASE_URL) {
    console.warn('⚠️  VITE_API_BASE_URL is not set. Using default: http://localhost:8080')
  } else {
    console.log(`✅ Using API Base URL: ${apiBaseUrl}`)
  }

  return {
    plugins: [react()],
    server: {
      port: 3001,
      strictPort: false, // Automatically use next available port if 3001 is in use
      open: true,
      // Enable Hot Module Replacement (HMR)
      hmr: {
        overlay: true, // Show errors in browser overlay
      },
      // Watch for file changes
      watch: {
        usePolling: false, // Set to true if file changes aren't detected
        interval: 100, // Polling interval (ms)
      },
      // Proxy configuration to bypass CORS
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('❌ Proxy error:', err);
              console.error('   Make sure the backend server is running at:', apiBaseUrl);
            });
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('📤 Sending Request to the Target:', req.method, req.url, '→', apiBaseUrl);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('📥 Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    // Custom logger configuration
    customLogger: undefined, // Use default logger which shows in terminal
    logLevel: 'info', // Show info, warn, and error logs in terminal
  }
})
