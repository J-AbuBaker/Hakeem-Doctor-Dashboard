import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@app/providers';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-state full-screen">
        <Loader2 className="spinner-large" />
        <p style={{ marginTop: '1rem', fontSize: '1.125rem', color: 'var(--text-light)' }}>
          Loading your dashboard...
        </p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
          Please wait while we prepare your workspace
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
