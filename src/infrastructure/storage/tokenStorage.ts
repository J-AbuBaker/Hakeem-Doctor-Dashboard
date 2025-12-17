/**
 * Token storage abstraction
 * Provides a centralized interface for token storage operations
 */

import { APP_CONFIG } from '../../shared/constants/appConfig';
import { isTokenExpired } from '../../shared/utils/auth/jwt';

/**
 * Gets token from storage
 * @returns Token string or null
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
}

/**
 * Stores token in storage
 * @param token - JWT token string
 */
export function storeToken(token: string): void {
  localStorage.setItem(APP_CONFIG.STORAGE_KEYS.TOKEN, token);
}

/**
 * Removes token from storage
 */
export function removeStoredToken(): void {
  localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
  localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.TOKEN_EXPIRATION);
}

/**
 * Checks if user is authenticated (has valid token)
 * @returns true if token exists and is not expired
 */
export function isAuthenticated(): boolean {
  const token = getStoredToken();
  if (!token) return false;

  return !isTokenExpired(token);
}

/**
 * Gets token expiration timestamp from storage
 * @returns Expiration timestamp or null
 */
export function getTokenExpiration(): number | null {
  const expiration = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN_EXPIRATION);
  return expiration ? parseInt(expiration, 10) : null;
}

/**
 * Stores token expiration timestamp
 * @param expirationTime - Expiration timestamp in milliseconds
 */
export function storeTokenExpiration(expirationTime: number): void {
  localStorage.setItem(APP_CONFIG.STORAGE_KEYS.TOKEN_EXPIRATION, expirationTime.toString());
}
