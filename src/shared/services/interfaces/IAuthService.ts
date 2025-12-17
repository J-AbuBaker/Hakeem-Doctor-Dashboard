import {
  SignUpUserDto,
  LoginUserDto,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  LoginResponse,
  SignupResponse,
  Doctor,
  UserInfo,
} from '../../../types';

/**
 * Authentication service interface
 * Defines the contract for authentication-related operations
 */
export interface IAuthService {
  /**
   * Register a new user
   */
  signup(data: SignUpUserDto): Promise<SignupResponse>;

  /**
   * Authenticate a user and get access token
   */
  login(data: LoginUserDto): Promise<LoginResponse>;

  /**
   * Request password reset
   */
  forgotPassword(data: ForgotPasswordRequest): Promise<void>;

  /**
   * Reset password with verification code
   */
  resetPassword(data: ResetPasswordRequest): Promise<void>;

  /**
   * Get list of all doctors
   */
  getDoctors(): Promise<Doctor[]>;

  /**
   * Get current authenticated user
   * @param username - Optional username to fetch specific user
   */
  getCurrentUser(username?: string): Promise<Doctor | null>;

  /**
   * Get user by username
   */
  getUserByUsername(username: string): Promise<Doctor | null>;

  /**
   * Get current user information from /me/info endpoint
   */
  getUserInfo(): Promise<UserInfo | null>;

  /**
   * Verify if current user has DOCTOR role
   * @param username - Optional username to check
   */
  verifyDoctorRole(username?: string): Promise<boolean>;

  /**
   * Logout current user
   */
  logout(): void;

  /**
   * Get stored authentication token
   */
  getToken(): string | null;

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean;
}
