/**
 * Error utility functions for extracting error messages
 */

import { TypedAxiosError, ApiErrorResponse } from '../types/errors';

/**
 * Extracts error message from various error types
 * @param error - Error object (TypedAxiosError, Error, or unknown)
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
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
      return (errorData as ApiErrorResponse).message || (errorData as ApiErrorResponse).error || axiosError.message;
    }
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return 'An unexpected error occurred';
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

