/**
 * Error handling utilities
 * Provides consistent error handling and formatting across the application
 */

import { AxiosError } from 'axios';
import { ApiErrorResponse, TypedAxiosError } from '../../shared/types/common/errors';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: ApiErrorResponse | string | unknown;
}

/**
 * Extracts error message from various error formats
 * Handles Error, TypedAxiosError, string, and unknown types
 * @param error - Error object (AxiosError, TypedAxiosError, Error, or unknown)
 * @returns Formatted error message
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  const axiosError = error as TypedAxiosError;
  if (axiosError.response) {
    const errorData = axiosError.response.data;
    if (typeof errorData === 'string') {
      return errorData;
    }
    if (errorData && typeof errorData === 'object' && 'message' in errorData) {
      return (errorData as ApiErrorResponse).message || (errorData as ApiErrorResponse).error || axiosError.message || 'An error occurred';
    }
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Alias for extractErrorMessage for backward compatibility
 * @param error - Error object
 * @returns Error message string
 */
export const getErrorMessage = extractErrorMessage;

/**
 * Formats Axios error into a user-friendly message
 * @param error - AxiosError instance
 * @returns Formatted error message
 */
export function formatAxiosError(error: AxiosError): ApiError {
  const apiError: ApiError = {
    message: 'An error occurred',
    status: error.response?.status,
    code: error.code,
    details: error.response?.data,
  };

  if (error.response) {
    // Server responded with error status
    const errorData = error.response.data;

    if (typeof errorData === 'string') {
      apiError.message = errorData || error.message || 'An error occurred';
    } else if (errorData && typeof errorData === 'object') {
      const errorObj = errorData as ApiErrorResponse;
      apiError.message =
        errorObj.message || errorObj.error || error.message || 'An error occurred';
    }

    // Add status-specific messages
    switch (error.response.status) {
      case 400:
        apiError.message = apiError.message || 'Invalid request. Please check your input.';
        break;
      case 401:
        apiError.message = 'Unauthorized. Please log in again.';
        break;
      case 403:
        apiError.message =
          "Access Denied: You don't have permission to access this resource.";
        break;
      case 404:
        apiError.message = 'Resource not found.';
        break;
      case 500:
        apiError.message = `Server Error: ${apiError.message}. Please try again later.`;
        break;
    }
  } else if (error.request) {
    // Request was made but no response received
    if (error.code === 'ERR_NETWORK') {
      apiError.message = 'Network Error: Cannot connect to server. Please check your connection.';
    } else if (error.code === 'ECONNABORTED') {
      apiError.message = 'Request Timeout: The server took too long to respond.';
    } else {
      apiError.message = 'Connection Error: No response received from server.';
    }
  } else {
    // Error setting up request
    apiError.message = `Request Setup Error: ${error.message}`;
  }

  return apiError;
}

/**
 * Creates a custom error for reset password validation
 * Handles cases where backend returns 200 with error message
 * @param message - Error message
 * @param status - HTTP status code (default: 200)
 * @returns Error object compatible with Axios error structure
 */
export function createResetPasswordError(message: string, status: number = 200): AxiosError<ApiErrorResponse> {
  const error = new Error(message) as AxiosError<ApiErrorResponse>;
  // Create a minimal config object if error.config is undefined
  const config: AxiosError<ApiErrorResponse>['config'] = error.config || ({} as AxiosError<ApiErrorResponse>['config']);
  error.response = {
    data: {
      message,
      error: message,
    },
    status,
    statusText: 'OK',
    headers: {},
    config: config as NonNullable<AxiosError<ApiErrorResponse>['config']>,
  };
  return error;
}

/**
 * Checks if response indicates an error even with 200 status
 * Used for reset password endpoint that returns 200 with error messages
 * @param responseData - Response data from API
 * @returns true if response indicates an error
 */
export function isErrorResponse(responseData: ApiErrorResponse | string | unknown): boolean {
  if (!responseData) return false;

  const responseMessage =
    typeof responseData === 'string'
      ? responseData
      : (responseData as ApiErrorResponse).message || (responseData as ApiErrorResponse).error || '';

  const errorIndicators = [
    'not been changed',
    "isn't valid",
    "isn't correct",
    'invalid',
    'error',
    'failed',
    'wrong',
    'incorrect',
  ];

  const lowerResponse = (responseMessage || '').toLowerCase();
  return errorIndicators.some((indicator) => lowerResponse.includes(indicator));
}

/**
 * Extracts clean error message from response
 * @param responseData - Response data from API
 * @param defaultMessage - Default message if extraction fails
 * @returns Clean error message
 */
export function extractErrorFromResponse(
  responseData: ApiErrorResponse | string | unknown,
  defaultMessage: string = 'An error occurred'
): string {
  if (typeof responseData === 'string') {
    return responseData.split('|')[0].trim() || defaultMessage;
  }

  if (responseData && typeof responseData === 'object') {
    const errorObj = responseData as ApiErrorResponse;
    const message = errorObj.message || errorObj.error || '';
    return message.split('|')[0].trim() || defaultMessage;
  }

  return defaultMessage;
}

/**
 * Extracts error response data from TypedAxiosError
 * @param error - Error object
 * @returns Error response data or undefined
 */
export function getErrorResponseData(error: unknown): ApiErrorResponse | string | undefined {
  const axiosError = error as TypedAxiosError;
  return axiosError.response?.data;
}

/**
 * Gets HTTP status code from error
 * @param error - Error object
 * @returns Status code or undefined
 */
export function getErrorStatus(error: unknown): number | undefined {
  const axiosError = error as TypedAxiosError;
  return axiosError.response?.status;
}
