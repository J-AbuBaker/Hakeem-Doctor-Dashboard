/**
 * Logger-related types
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Log data structure
 */
export interface LogData {
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  method?: string;
  url?: string;
  status?: number;
}

/**
 * Request config type for logger
 */
export type RequestConfig = AxiosRequestConfig;

/**
 * Response headers type
 */
export type ResponseHeaders = AxiosResponse['headers'];

/**
 * Error details for network errors
 */
export interface NetworkErrorDetails {
  code?: string;
  message?: string;
  baseURL?: string;
  fullURL?: string;
}

/**
 * Window interface extension for apiLogger
 */
declare global {
  interface Window {
    apiLogger?: {
      saveLogs: () => void;
      saveLogsAsJSON: () => void;
      saveLogsAsText: () => void;
      getLogsAsJSON: () => string;
      getLogsFromStorage: () => string | null;
      loadLogs: () => LogData[] | null;
      getLogsAsText: () => string;
      clearLogs: () => void;
      getLogCount: () => number;
      getLogs: () => string;
      enableAutoSave: (minutes?: number) => void;
      disableAutoSave: () => void;
      setEnabled: (enabled: boolean) => void;
    };
  }
}
