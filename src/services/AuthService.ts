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

class AuthService {
  async signup(data: SignUpUserDto): Promise<SignupResponse> {
    const response = await api.post<SignupResponse>('/auth/signup', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }

  async login(data: LoginUserDto): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Store expiresIn if needed for token expiration handling
      if (response.data.expiresIn) {
        const expirationTime = Date.now() + response.data.expiresIn * 1000;
        localStorage.setItem('tokenExpiration', expirationTime.toString());
      }
    }
    return response.data;
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await api.post('/auth/forgot-password', data);
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      const response = await api.post('/auth/reset-password', data);
      
      // PRIORITY 1: Check if the response contains an error message even with status 200
      if (response.data) {
        const responseData = response.data as any;
        const responseMessage = responseData.message || responseData.error || '';
        const responseText = typeof responseData === 'string' ? responseData : responseMessage;
        
        // Check for error indicators in the response message/body
        const errorIndicators = [
          'not been changed',
          'isn\'t valid',
          'isn\'t correct',
          'invalid',
          'error',
          'failed',
          'wrong',
          'incorrect'
        ];
        
        const lowerResponse = (responseText || '').toLowerCase();
        const hasError = errorIndicators.some(indicator => lowerResponse.includes(indicator));
        
        // If response indicates an error, throw an error even though status is 200
        if (hasError) {
          const cleanMessage = responseText.split('|')[0].trim() || 'Invalid reset code. Please check your code and try again.';
          
          // Create an error object that mimics axios error structure
          const error: any = new Error(cleanMessage);
          error.response = {
            data: {
              message: cleanMessage,
              error: cleanMessage
            },
            status: 200
          };
          throw error;
        }
      }
    } catch (err: any) {
      // PRIORITY 2: Handle HTTP error status codes (400, 404, 500, etc.)
      // If it's already an axios error with status code, re-throw it
      if (err.response) {
        // Handle 400 Bad Request specifically for invalid/expired code
        if (err.response.status === 400) {
          const errorMessage = err.response.data?.message || err.response.data?.error || 'Invalid verification code or expired code';
          const error: any = new Error(errorMessage);
          error.response = {
            data: {
              message: errorMessage,
              error: errorMessage
            },
            status: 400
          };
          throw error;
        }
        // For other status codes, re-throw as is
        throw err;
      }
      // If it's our custom error from status 200 check, re-throw it
      throw err;
    }
  }

  async getDoctors(): Promise<Doctor[]> {
    const response = await api.get<Doctor[]>('/auth/doctors');
    return response.data;
  }

  async getCurrentUser(username?: string): Promise<Doctor | null> {
    try {
      // If username is provided, use it directly
      if (username) {
        return await this.getUserByUsername(username);
      }

      // If no username provided, try to extract from token
      const token = this.getToken();
      if (token) {
        try {
          // Decode JWT token to get username (token format: header.payload.signature)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const tokenUsername = payload.sub; // JWT 'sub' field contains username
          if (tokenUsername) {
            return await this.getUserByUsername(tokenUsername);
          }
        } catch (error) {
          // If token decoding fails, return null
          return null;
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
      const response = await api.get<UserInfo>('/me/info');
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
      const token = this.getToken();
      if (token) {
        try {
          // Decode JWT token to get role
          const payload = JSON.parse(atob(token.split('.')[1]));
          const role = payload.role?.toUpperCase() || '';
          if (role === 'DOCTOR') {
            return true;
          }
        } catch (error) {
          // If token decoding fails, continue to fallback
        }
      }

      // Fallback: try to get user by username if provided
      if (username) {
        const user = await this.getUserByUsername(username);
        if (user) {
          const role = typeof user.role === 'string'
            ? user.role.toUpperCase()
            : (user.role as any)?.name?.toUpperCase() || '';
          return role === 'DOCTOR';
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();

