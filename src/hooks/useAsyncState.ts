import { useState, useCallback, useRef } from 'react';

export interface LoadingState {
  [key: string]: boolean;
}

export interface UseAsyncStateOptions<T> {
  initialState?: T;
  onError?: (error: unknown) => void;
  onSuccess?: (data: T) => void;
}

export interface UseAsyncStateReturn<T> {
  data: T;
  loading: boolean;
  loadingState: LoadingState;
  error: string | null;
  setData: (data: T) => void;
  setLoading: (key: string, value: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Custom hook for managing async state with loading and error handling
 * Provides a consistent pattern for async operations across contexts
 */
export function useAsyncState<T>(
  initialState: T,
  options?: UseAsyncStateOptions<T>
): UseAsyncStateReturn<T> {
  const [data, setData] = useState<T>(initialState);
  const [loadingState, setLoadingState] = useState<LoadingState>({});
  const [error, setError] = useState<string | null>(null);
  const previousDataRef = useRef<T>(initialState);

  const setLoading = useCallback((key: string, value: boolean) => {
    setLoadingState(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setData(initialState);
    setLoadingState({});
    setError(null);
    previousDataRef.current = initialState;
  }, [initialState]);

  const handleSetData = useCallback((newData: T) => {
    previousDataRef.current = data;
    setData(newData);
    if (options?.onSuccess) {
      options.onSuccess(newData);
    }
  }, [data, options]);

  const handleSetError = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
    if (errorMessage && options?.onError) {
      options.onError(errorMessage);
    }
  }, [options]);

  const isLoading = Object.values(loadingState).some(value => value === true);

  return {
    data,
    loading: isLoading,
    loadingState,
    error,
    setData: handleSetData,
    setLoading,
    setError: handleSetError,
    reset,
  };
}
