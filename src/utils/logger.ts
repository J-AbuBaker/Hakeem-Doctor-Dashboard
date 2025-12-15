/**
 * Logger utility that logs to console, terminal, and saves to file
 */

import { LogData, RequestConfig, ResponseHeaders, NetworkErrorDetails } from '../types/logger';

class Logger {
  private enabled: boolean = true;
  private logToServer: boolean = false; // Set to true if you want to send logs to server
  private logHistory: LogData[] = [];
  private maxLogHistory: number = 1000; // Maximum number of logs to keep in memory
  private autoSaveInterval: number | null = null;

  /**
   * Log request to console, terminal, and save to file
   */
  logRequest(method: string, url: string, config: RequestConfig, body?: unknown) {
    if (!this.enabled) return;

    const logData: LogData = {
      level: 'info',
      message: `📤 ${method.toUpperCase()} ${url}`,
      type: 'request',
      method,
      url,
      timestamp: new Date().toISOString(),
      data: {
        baseURL: config.baseURL,
        url: config.url,
        method: config.method,
        headers: config.headers,
        params: config.params,
        body,
      },
    };

    // Save to history
    this.addToHistory(logData);

    // Log to browser console
    console.group(logData.message);
    console.log('Request Config:', logData.data);
    if (body) {
      console.log('Request Body:', body);
    }
    console.groupEnd();

    // Log to terminal
    this.logToTerminal(logData);
  }

  /**
   * Log successful response
   */
  logResponse(method: string, url: string, status: number, statusText: string, data: unknown, headers: ResponseHeaders) {
    if (!this.enabled) return;

    const logData: LogData = {
      level: 'info',
      message: `✅ ${method.toUpperCase()} ${url}`,
      type: 'response',
      method,
      url,
      status,
      timestamp: new Date().toISOString(),
      data: {
        status,
        statusText,
        data,
        headers,
      },
    };

    // Save to history
    this.addToHistory(logData);

    // Log to browser console
    console.group(logData.message);
    console.log('Status:', status, statusText);
    console.log('Response Data:', data);
    console.log('Headers:', headers);
    console.groupEnd();

    // Log to terminal
    this.logToTerminal(logData);
  }

  /**
   * Log error response
   */
  logError(method: string, url: string, status: number, statusText: string, errorData: unknown, headers: ResponseHeaders) {
    if (!this.enabled) return;

    // Handle plain text error responses
    let formattedErrorData = errorData;
    if (typeof errorData === 'string' && errorData.trim()) {
      formattedErrorData = errorData;
    } else if (errorData && typeof errorData === 'object') {
      formattedErrorData = errorData;
    } else {
      formattedErrorData = errorData || 'No error details provided';
    }

    const logData: LogData = {
      level: 'error',
      message: `❌ ${method.toUpperCase()} ${url}`,
      type: 'error',
      method,
      url,
      status,
      timestamp: new Date().toISOString(),
      data: {
        status,
        statusText,
        errorData: formattedErrorData,
        headers,
      },
    };

    // Save to history
    this.addToHistory(logData);

    // Log to browser console
    console.group(logData.message);
    console.error('Status:', status, statusText);
    console.error('Error Data:', errorData);
    console.error('Headers:', headers);
    console.groupEnd();

    // Log to terminal
    this.logToTerminal(logData);
  }

  /**
   * Log network error (no response received)
   */
  logNetworkError(method: string, url: string, request: unknown, errorDetails?: NetworkErrorDetails) {
    if (!this.enabled) return;

    const apiBaseUrl = import.meta.env.DEV 
      ? '/api' 
      : import.meta.env.VITE_API_BASE_URL || '';

    const logData: LogData = {
      level: 'error',
      message: `⚠️ ${method.toUpperCase()} ${url} - No response received`,
      type: 'error',
      method,
      url,
      timestamp: new Date().toISOString(),
      data: {
        request,
        errorDetails: errorDetails || 'Possible causes: Server is down, CORS issue, Network connectivity problem, or Firewall blocking',
        troubleshooting: [
          apiBaseUrl ? `1. Check if the server is running at: ${apiBaseUrl}` : '1. Check if the server is running (configure VITE_API_BASE_URL in .env)',
          '2. Verify CORS is enabled on the server',
          '3. Check network connectivity',
          '4. Check browser console for CORS errors',
          apiBaseUrl ? `5. Try accessing the API directly in browser: ${apiBaseUrl}/auth/signup` : '5. Try accessing the API directly in browser (configure VITE_API_BASE_URL in .env)'
        ]
      },
    };

    // Save to history
    this.addToHistory(logData);

    // Log to browser console
    console.group(logData.message);
    console.error('No response received:', request);
    console.groupEnd();

    // Log to terminal
    this.logToTerminal(logData);
  }

  /**
   * Log to terminal - uses console methods that appear in terminal
   * In Vite dev mode, console.info/error/warn appear in both browser and terminal
   */
  private logToTerminal(logData: LogData) {
    const timestamp = new Date(logData.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [API ${logData.type.toUpperCase()}]`;

    // Format for terminal output - use a format that's clear in terminal
    const terminalMessage = `${prefix} ${logData.message}`;

    // Create a formatted output string for terminal
    const formattedOutput = {
      time: timestamp,
      type: logData.type.toUpperCase(),
      method: logData.method,
      url: logData.url,
      status: logData.status,
      data: logData.data,
    };

    switch (logData.level) {
      case 'error':
        // console.error appears in terminal (red text)
        console.error('\n' + '='.repeat(80));
        console.error(terminalMessage);
        console.error('Details:', formattedOutput);
        console.error('='.repeat(80) + '\n');
        break;
      case 'warn':
        // console.warn appears in terminal (yellow text)
        console.warn('\n' + '-'.repeat(80));
        console.warn(terminalMessage);
        console.warn('Details:', formattedOutput);
        console.warn('-'.repeat(80) + '\n');
        break;
      default:
        // console.info appears in terminal (blue text)
        console.info('\n' + '-'.repeat(80));
        console.info(terminalMessage);
        console.info('Details:', formattedOutput);
        console.info('-'.repeat(80) + '\n');
    }

    // If logToServer is enabled, send to backend endpoint
    if (this.logToServer) {
      this.sendToServer();
    }
  }

  /**
   * Send log to server endpoint (optional)
   */
  private async sendToServer() {
    try {
      // You can create a backend endpoint to receive logs
      // For now, this is disabled by default
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(_logData),
      // });
    } catch (error) {
      // Silently fail - don't break the app if logging fails
    }
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Enable or disable server logging
   */
  setServerLogging(enabled: boolean) {
    this.logToServer = enabled;
  }

  /**
   * Add log to history and save to local storage
   */
  private addToHistory(logData: LogData) {
    this.logHistory.push(logData);

    // Keep only the last maxLogHistory logs
    if (this.logHistory.length > this.maxLogHistory) {
      this.logHistory.shift();
    }

    // Auto-save to IndexedDB/localStorage
    this.saveToLocalStorage();

    // Auto-save to file on errors
    if (logData.level === 'error') {
      this.autoSaveOnError();
    }
  }

  /**
   * Save logs to browser's localStorage/IndexedDB
   */
  private saveToLocalStorage() {
    try {
      const jsonLogs = this.exportLogsAsJSON();
      localStorage.setItem('api_logs', jsonLogs);
      localStorage.setItem('api_logs_timestamp', new Date().toISOString());
    } catch (error) {
      // If localStorage is full, try to save only recent logs
      try {
        const recentLogs = this.logHistory.slice(-100); // Last 100 logs
        const exportData = {
          metadata: {
            generatedAt: new Date().toISOString(),
            totalLogs: recentLogs.length,
            note: 'Only recent 100 logs saved due to storage limit',
          },
          logs: recentLogs,
        };
        localStorage.setItem('api_logs', JSON.stringify(exportData, null, 2));
      } catch (e) {
        console.warn('Failed to save logs to localStorage:', e);
      }
    }
  }

  /**
   * Auto-save logs to file when error occurs
   */
  private autoSaveOnError() {
    // Debounce: only save once per 5 seconds to avoid too many downloads
    const lastSave = localStorage.getItem('last_error_log_save');
    const now = Date.now();
    if (lastSave && now - parseInt(lastSave) < 5000) {
      return; // Skip if saved recently
    }

    try {
      // Save to file automatically
      this.saveLogsAsJSON();
      localStorage.setItem('last_error_log_save', now.toString());
    } catch (error) {
      console.warn('Failed to auto-save logs on error:', error);
    }
  }

  /**
   * Format log entry for file output
   */
  private formatLogEntry(logData: LogData): string {
    const date = new Date(logData.timestamp);
    const timestamp = date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    let formatted = `\n${'='.repeat(100)}\n`;
    formatted += `[${timestamp}] [${logData.type.toUpperCase()}] ${logData.message}\n`;
    formatted += `${'-'.repeat(100)}\n`;

    if (logData.method) {
      formatted += `Method: ${logData.method}\n`;
    }
    if (logData.url) {
      formatted += `URL: ${logData.url}\n`;
    }
    if (logData.status) {
      formatted += `Status: ${logData.status}\n`;
    }

    formatted += `\nDetails:\n`;
    formatted += JSON.stringify(logData.data, null, 2);
    formatted += `\n${'='.repeat(100)}\n`;

    return formatted;
  }

  /**
   * Get all logs as formatted string
   */
  getFormattedLogs(): string {
    let formatted = `\n${'#'.repeat(100)}\n`;
    formatted += `API LOGS - Generated: ${new Date().toLocaleString()}\n`;
    formatted += `Total Logs: ${this.logHistory.length}\n`;
    formatted += `${'#'.repeat(100)}\n`;

    this.logHistory.forEach((log) => {
      formatted += this.formatLogEntry(log);
    });

    return formatted;
  }

  /**
   * Save logs to file as JSON (default method)
   */
  saveLogsToFile(filename?: string) {
    this.saveLogsAsJSON(filename);
  }

  /**
   * Save logs to file as formatted text
   */
  saveLogsAsText(filename?: string) {
    const formattedLogs = this.getFormattedLogs();
    const blob = new Blob([formattedLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generate filename with timestamp if not provided
    const defaultFilename = `api-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    link.download = filename || defaultFilename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear log history
   */
  clearLogs() {
    this.logHistory = [];
  }

  /**
   * Get log count
   */
  getLogCount(): number {
    return this.logHistory.length;
  }

  /**
   * Enable auto-save logs to JSON file at intervals
   */
  enableAutoSave(intervalMinutes: number = 30) {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = window.setInterval(() => {
      if (this.logHistory.length > 0) {
        this.saveLogsAsJSON(); // Auto-save as JSON
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Disable auto-save
   */
  disableAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Export logs as JSON with metadata
   */
  exportLogsAsJSON(): string {
    const exportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedAtFormatted: new Date().toLocaleString(),
        totalLogs: this.logHistory.length,
        appName: 'Doctor Dashboard',
        version: '1.0.0',
      },
      logs: this.logHistory,
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Save logs as JSON file locally (downloads file)
   */
  saveLogsAsJSON(filename?: string) {
    const jsonLogs = this.exportLogsAsJSON();
    const blob = new Blob([jsonLogs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generate filename with timestamp if not provided
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `api-logs-${timestamp}.json`;
    link.download = filename || defaultFilename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also save to localStorage
    this.saveToLocalStorage();

    // Log the save action
    console.info(`✅ Logs saved to ${link.download} (${this.logHistory.length} entries)`);
    console.info(`💾 Logs also saved to browser localStorage`);
  }

  /**
   * Load logs from localStorage
   */
  loadLogsFromLocalStorage(): LogData[] | null {
    try {
      const savedLogs = localStorage.getItem('api_logs');
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        if (parsed.logs && Array.isArray(parsed.logs)) {
          this.logHistory = parsed.logs;
          return parsed.logs;
        }
      }
    } catch (error) {
      console.warn('Failed to load logs from localStorage:', error);
    }
    return null;
  }

  /**
   * Get logs from localStorage as JSON string
   */
  getLogsFromLocalStorage(): string | null {
    return localStorage.getItem('api_logs');
  }
}

const loggerInstance = new Logger();

// Load logs from localStorage on initialization
if (typeof window !== 'undefined') {
  // Try to load previous logs from localStorage
  loggerInstance.loadLogsFromLocalStorage();
}

// Expose logger to window for easy access from browser console
if (typeof window !== 'undefined') {
  window.apiLogger = {
    // Save logs as JSON (default) - downloads file
    saveLogs: () => loggerInstance.saveLogsAsJSON(),
    // Save logs as JSON (explicit) - downloads file
    saveLogsAsJSON: () => loggerInstance.saveLogsAsJSON(),
    // Save logs as formatted text - downloads file
    saveLogsAsText: () => loggerInstance.saveLogsAsText(),
    // Get logs as JSON string
    getLogsAsJSON: () => loggerInstance.exportLogsAsJSON(),
    // Get logs from localStorage
    getLogsFromStorage: () => loggerInstance.getLogsFromLocalStorage(),
    // Load logs from localStorage
    loadLogs: () => loggerInstance.loadLogsFromLocalStorage(),
    // Get logs as formatted text
    getLogsAsText: () => loggerInstance.getFormattedLogs(),
    // Utility methods
    clearLogs: () => {
      loggerInstance.clearLogs();
      localStorage.removeItem('api_logs');
      localStorage.removeItem('api_logs_timestamp');
    },
    getLogCount: () => loggerInstance.getLogCount(),
    getLogs: () => loggerInstance.getFormattedLogs(),
    enableAutoSave: (minutes: number = 30) => loggerInstance.enableAutoSave(minutes),
    disableAutoSave: () => loggerInstance.disableAutoSave(),
    setEnabled: (enabled: boolean) => loggerInstance.setEnabled(enabled),
  };
}

export default loggerInstance;
