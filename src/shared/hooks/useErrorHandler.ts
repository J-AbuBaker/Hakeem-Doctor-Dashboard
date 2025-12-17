import { useCallback } from 'react';
import { extractErrorMessage } from '../../utils/error/handlers';

/**
 * Custom hook for consistent error handling
 * Provides a standardized way to extract and handle errors
 */
export function useErrorHandler() {
  const handleError = useCallback((error: unknown): string => {
    return extractErrorMessage(error);
  }, []);

  return {
    extractError: handleError,
  };
}
