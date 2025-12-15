/**
 * Error-related types
 */

import { AxiosError } from 'axios';

/**
 * Standard error response from API
 */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Extended AxiosError with proper typing
 */
export interface TypedAxiosError extends Omit<AxiosError<ApiErrorResponse>, 'response'> {
  response?: {
    data: ApiErrorResponse | string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config?: AxiosError['config'];
  };
}

/**
 * Error object that can be thrown or caught
 */
export type AppError = Error | TypedAxiosError | string;

/**
 * Location state type for React Router
 */
export interface LocationState {
  email?: string;
  [key: string]: unknown;
}

/**
 * Role object that can be a string or object with name property
 */
export interface RoleObject {
  id?: number;
  name?: string;
  role?: string;
}

export type RoleType = string | RoleObject;

