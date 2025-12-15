import api from '../utils/api';
import {
  SignUpUserDto,
  LoginUserDto,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  LoginResponse,
  SignupResponse,
  Doctor,
  UserInfo,
} from '../types';
import {
  storeToken,
  removeStoredToken,
  getStoredToken,
  isAuthenticated as checkAuth,
  getUsernameFromToken,
  hasRole,
  getRoleFromToken,
} from '../utils/jwtUtils';
import {
  isErrorResponse,
  extractErrorFromResponse,
  createResetPasswordError,
} from '../utils/errorHandlers';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { APP_CONFIG } from '../constants/appConfig';

class AuthService {
  async signup(data: SignUpUserDto): Promise<SignupResponse> {
    const response = await api.post<SignupResponse>(API_ENDPOINTS.AUTH.SIGNUP, data);
    if (response.data.token) {
      storeToken(response.data.token);
    }
    return response.data;
  }

  async login(data: LoginUserDto): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
    if (response.data.token) {
      storeToken(response.data.token);
      // Store expiresIn if needed for token expiration handling
      if (response.data.expiresIn) {
        const expirationTime = Date.now() + response.data.expiresIn * 1000;
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.TOKEN_EXPIRATION, expirationTime.toString());
      }
    }
    return response.data;
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);

      // Check if the response contains an error message even with status 200
      if (response.data && isErrorResponse(response.data)) {
        const cleanMessage =
          extractErrorFromResponse(
            response.data,
            'Invalid reset code. Please check your code and try again.'
          ) || 'Invalid reset code. Please check your code and try again.';
        throw createResetPasswordError(cleanMessage, 200);
      }
    } catch (err: any) {
      // Handle HTTP error status codes (400, 404, 500, etc.)
      if (err.response) {
        // Handle 400 Bad Request specifically for invalid/expired code
        if (err.response.status === 400) {
          const errorMessage =
            err.response.data?.message ||
            err.response.data?.error ||
            'Invalid verification code or expired code';
          throw createResetPasswordError(errorMessage, 400);
        }
        // For other status codes, re-throw as is
        throw err;
      }
      // If it's our custom error from status 200 check, re-throw it
      throw err;
    }
  }

  async getDoctors(): Promise<Doctor[]> {
    const response = await api.get<Doctor[]>(API_ENDPOINTS.AUTH.DOCTORS);
    return response.data;
  }

  async getCurrentUser(username?: string): Promise<Doctor | null> {
    try {
      // If username is provided, use it directly
      if (username) {
        return await this.getUserByUsername(username);
      }

      // If no username provided, try to extract from token
      const token = getStoredToken();
      if (token) {
        const tokenUsername = getUsernameFromToken(token);
        if (tokenUsername) {
          return await this.getUserByUsername(tokenUsername);
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Gets user by username (fallback if /auth/signup doesn't return full user details)
   */
  async getUserByUsername(username: string): Promise<Doctor | null> {
    try {
      // Try to get user from doctors list by username
      const doctors = await this.getDoctors();
      const user = doctors.find((doc) => doc.username === username);
      return user || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Gets current user information from /me/info endpoint
   * Uses JWT token for authentication
   */
  async getUserInfo(): Promise<UserInfo | null> {
    try {
      const response = await api.get<UserInfo>(API_ENDPOINTS.USER.INFO);
      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  /**
   * Verifies if the current user has the DOCTOR role
   * Uses JWT token or username to get role info
   */
  async verifyDoctorRole(username?: string): Promise<boolean> {
    try {
      // First, try to get role from JWT token
      const token = getStoredToken();
      if (token && hasRole(token, APP_CONFIG.ROLES.DOCTOR)) {
        return true;
      }

      // Fallback: try to get user by username if provided
      if (username) {
        const user = await this.getUserByUsername(username);
        if (user) {
          const role =
            typeof user.role === 'string'
              ? user.role.toUpperCase()
              : (user.role as any)?.name?.toUpperCase() || '';
          return role === APP_CONFIG.ROLES.DOCTOR;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  logout(): void {
    removeStoredToken();
  }

  getToken(): string | null {
    return getStoredToken();
  }

  isAuthenticated(): boolean {
    return checkAuth();
  }
}

export default new AuthService();

