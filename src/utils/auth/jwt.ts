/**
 * JWT Token utility functions
 * Handles token decoding, validation, and extraction of user information
 */

export interface TokenPayload {
  sub?: string; // username
  username?: string;
  role?: string;
  exp?: number; // expiration timestamp
  iat?: number; // issued at timestamp
  [key: string]: string | number | boolean | undefined;
}

/**
 * Decodes a JWT token and returns its payload
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.warn('Failed to decode token:', error);
    return null;
  }
}

/**
 * Extracts username from JWT token
 * @param token - JWT token string
 * @returns Username or null if not found
 */
export function getUsernameFromToken(token: string): string | null {
  const payload = decodeToken(token);
  if (!payload) return null;

  return payload.sub || payload.username || null;
}

/**
 * Extracts role from JWT token
 * @param token - JWT token string
 * @returns Role or null if not found
 */
export function getRoleFromToken(token: string): string | null {
  const payload = decodeToken(token);
  if (!payload) return null;

  return payload.role || null;
}

/**
 * Checks if token has expired
 * @param token - JWT token string
 * @returns true if token is expired or invalid
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() >= expirationTime;
}

/**
 * Gets token expiration date
 * @param token - JWT token string
 * @returns Expiration date or null if not found
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;

  return new Date(payload.exp * 1000);
}

/**
 * Validates if token has required role
 * @param token - JWT token string
 * @param requiredRole - Required role (case-insensitive)
 * @returns true if token has the required role
 */
export function hasRole(token: string, requiredRole: string): boolean {
  const role = getRoleFromToken(token);
  if (!role) return false;

  return role.toUpperCase() === requiredRole.toUpperCase();
}

/**
 * Gets token from localStorage
 * @returns Token string or null
 */
export function getStoredToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Stores token in localStorage
 * @param token - JWT token string
 */
export function storeToken(token: string): void {
  localStorage.setItem('token', token);
}

/**
 * Removes token from localStorage
 */
export function removeStoredToken(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpiration');
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
