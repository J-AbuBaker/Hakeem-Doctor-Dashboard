import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { AuthService } from '../../features/auth';
import { Doctor, SignUpUserDto } from '../../types';
import { extractErrorMessage } from '../../shared/utils/error/handlers';

interface LoadingState {
  initializing: boolean;
  loggingIn: boolean;
  signingUp: boolean;
  updating: boolean;
}

interface AuthContextType {
  user: Doctor | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loadingState: LoadingState;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: SignUpUserDto) => Promise<void>;
  logout: () => void;
  updateUser: (user: Doctor) => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Doctor | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    initializing: true,
    loggingIn: false,
    signingUp: false,
    updating: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Store previous state for rollback
  const previousUserRef = useRef<Doctor | null>(null);

  // Initialize authentication state from token
  useEffect(() => {
    const initAuth = async () => {
      setLoadingState(prev => ({ ...prev, initializing: true }));
      setError(null);

      if (AuthService.isAuthenticated()) {
        try {
          // Get current user info from token (username extracted from JWT)
          // This ensures state matches API response
          const apiUser = await AuthService.getCurrentUser();
          if (apiUser) {
            // Update state with API response - source of truth
            setUser(apiUser);
          }
          // If getCurrentUser returns null, user info might be in JWT token
          // For now, we'll just mark as authenticated
        } catch (err: unknown) {
          // If fetching user fails, still allow access if token exists
          // The API will handle authentication on protected routes
          const errorMessage = extractErrorMessage(err);
          if (import.meta.env.DEV) {
            console.warn('Failed to fetch user during initialization:', errorMessage);
          }
          // Don't set error here as token might still be valid
        }
      }

      setLoadingState(prev => ({ ...prev, initializing: false }));
    };

    initAuth();
  }, []);

  // Login with proper state tracking and API response synchronization
  const login = useCallback(async (username: string, password: string) => {
    setLoadingState(prev => ({ ...prev, loggingIn: true }));
    setError(null);

    // Store previous state for rollback
    previousUserRef.current = user;

    try {
      // Call API to login - this is the source of truth
      const loginResponse = await AuthService.login({ username, password });

      // API returns token, username, and expiresIn
      if (!loginResponse.token) {
        throw new Error('Login failed: No token received from server');
      }

      // Verify user has DOCTOR role using /auth/signup endpoint
      const isDoctor = await AuthService.verifyDoctorRole(loginResponse.username);
      if (!isDoctor) {
        // User is not a doctor - logout and throw error
        AuthService.logout();
        throw new Error('You are not authorized. Only doctors can access this dashboard.');
      }

      // Fetch full user details using username from login response
      // This ensures state matches API response exactly
      const apiUser = await AuthService.getCurrentUser(loginResponse.username);
      if (apiUser) {
        // Update state with API response - source of truth
        setUser(apiUser);
      } else {
        // If getCurrentUser fails, we still verified the role
        // User is authenticated via token, but we don't have full user data
        // This is acceptable - token is the source of truth for authentication
      }
    } catch (err: unknown) {
      // Rollback to previous state on error
      setUser(previousUserRef.current);

      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw err; // Re-throw to allow UI to handle error
    } finally {
      setLoadingState(prev => ({ ...prev, loggingIn: false }));
    }
  }, [user]);

  // Signup with proper state tracking and API response synchronization
  const signup = useCallback(async (data: SignUpUserDto) => {
    setLoadingState(prev => ({ ...prev, signingUp: true }));
    setError(null);

    // Store previous state for rollback
    previousUserRef.current = user;

    try {
      // Call API to signup - this is the source of truth
      const signupResponse = await AuthService.signup(data);

      // API returns token, username, and role from /auth/signup
      if (!signupResponse.token) {
        throw new Error('Signup failed: No token received from server');
      }

      // Fetch full user details using username from signup response
      // This ensures state matches API response exactly
      const apiUser = await AuthService.getCurrentUser(signupResponse.username);
      if (apiUser) {
        // Update state with API response - source of truth
        setUser(apiUser);
      } else {
        // If getCurrentUser fails, user is still authenticated via token
        // The API will handle authentication on protected routes
      }
    } catch (err: unknown) {
      // Rollback to previous state on error
      setUser(previousUserRef.current);

      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      throw err; // Re-throw to allow UI to handle error
    } finally {
      setLoadingState(prev => ({ ...prev, signingUp: false }));
    }
  }, [user]);

  // Logout with proper state cleanup
  const logout = useCallback(() => {
    AuthService.logout();
    setUser(null);
    setError(null);
    previousUserRef.current = null;
  }, []);

  // Update user - optimistic update with API sync
  const updateUser = useCallback((updatedUser: Doctor) => {
    // Store previous state for rollback
    previousUserRef.current = user;

    // Optimistic update
    setUser(updatedUser);
  }, [user]);

  // Refresh user data from API - ensures state matches API
  const refreshUser = useCallback(async () => {
    if (!AuthService.isAuthenticated()) {
      return;
    }

    setLoadingState(prev => ({ ...prev, updating: true }));
    setError(null);

    // Store previous state for rollback
    previousUserRef.current = user;

    try {
      // Fetch user from API - source of truth
      const apiUser = await AuthService.getCurrentUser();
      if (apiUser) {
        // Update state with API response
        setUser(apiUser);
      }
    } catch (err: unknown) {
      // Rollback to previous state on error
      setUser(previousUserRef.current);

      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoadingState(prev => ({ ...prev, updating: false }));
    }
  }, [user]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed isLoading - true if any operation is loading
  const isLoading = loadingState.initializing || loadingState.loggingIn || loadingState.signingUp || loadingState.updating;

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user || AuthService.isAuthenticated(),
    isLoading,
    loadingState,
    error,
    login,
    signup,
    logout,
    updateUser,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
