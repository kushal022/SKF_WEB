import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';
import { LoadingState } from '../../components/ui';

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isInitializing, user } = useAppSelector((state) => state.auth);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-background)]">
        <LoadingState message="Verifying administrative session..." />
      </div>
    );
  }

  // Not authenticated or role is not admin: redirect to login with safe returnTo parameter
  if (!isAuthenticated || !user || user.role !== 'admin') {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
