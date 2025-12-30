import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  // Get API base URL from environment variable with fallback
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8080'

  // Validate API base URL
  if (!env.VITE_API_BASE_URL) {
    console.warn('VITE_API_BASE_URL is not set. Using default: http://localhost:8080')
  } else {
    console.log(`Using API Base URL: ${apiBaseUrl}`)
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, './src/shared'),
        '@features': path.resolve(__dirname, './src/features'),
        '@app': path.resolve(__dirname, './src/app'),
        '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      },
    },
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
            proxy.on('error', (err: Error & { code?: string }) => {
              console.error('Proxy error:', err.message || err);
              console.error('Error code:', err.code);
              console.error('Make sure the backend server is running at:', apiBaseUrl);

              // Provide helpful error messages based on error code
              if (err.code === 'ECONNREFUSED') {
                console.error('\nPossible solutions:');
                console.error('1. Check if backend server is running');
                console.error('2. Verify the server URL is correct:', apiBaseUrl);
                console.error('3. Check if port 8089 is accessible');
                console.error('4. Verify firewall/network settings');
                console.error('5. Try: curl', apiBaseUrl, 'to test connectivity');
              } else if (err.code === 'ECONNRESET') {
                console.error('\nConnection was reset. Possible causes:');
                console.error('1. Server closed the connection unexpectedly');
                console.error('2. Network instability');
                console.error('3. Server overloaded or restarting');
                console.error('4. Check server logs for errors');
              } else if (err.code === 'ETIMEDOUT') {
                console.error('\nConnection timeout. Possible causes:');
                console.error('1. Server is slow to respond');
                console.error('2. Network latency issues');
                console.error('3. Server might be overloaded');
              }
            });
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('Sending Request to the Target:', req.method, req.url, '->', apiBaseUrl);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
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
