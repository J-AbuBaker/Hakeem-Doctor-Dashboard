import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService from '../services/AuthService';
import { Doctor, SignUpUserDto } from '../types';

interface AuthContextType {
  user: Doctor | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: SignUpUserDto) => Promise<void>;
  logout: () => void;
  updateUser: (user: Doctor) => void;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (AuthService.isAuthenticated()) {
        try {
          // Get current user info from token (username extracted from JWT)
          const user = await AuthService.getCurrentUser();
          if (user) {
            setUser(user);
          }
          // If getCurrentUser returns null, user info might be in JWT token
          // For now, we'll just mark as authenticated
          setIsLoading(false);
        } catch (error) {
          // If fetching user fails, still allow access if token exists
          // The API will handle authentication on protected routes
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await AuthService.login({ username, password });
    // API returns token, username, and expiresIn
    if (response.token) {
      // Verify user has DOCTOR role using /auth/signup endpoint
      const isDoctor = await AuthService.verifyDoctorRole(response.username);
      if (!isDoctor) {
        // User is not a doctor - logout and throw error
        AuthService.logout();
        throw new Error('You are not authorized. Only doctors can access this dashboard.');
      }

      // Fetch full user details using username from login response
      try {
        const user = await AuthService.getCurrentUser(response.username);
        if (user) {
          setUser(user);
        }
      } catch (error) {
        // If getCurrentUser fails, we still verified the role
        // User is authenticated via token
      }
    }
  };

  const signup = async (data: SignUpUserDto) => {
    const response = await AuthService.signup(data);
    // API returns token, username, and role from /auth/signup
    // Try to fetch full user details using username from signup response
    if (response.token) {
      try {
        const user = await AuthService.getCurrentUser(response.username);
        if (user) {
          setUser(user);
        }
      } catch (error) {
        // If getCurrentUser fails, user is still authenticated via token
        // The API will handle authentication on protected routes
      }
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser: Doctor) => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user || AuthService.isAuthenticated(),
    isLoading,
    login,
    signup,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

