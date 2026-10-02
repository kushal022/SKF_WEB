import React from 'react';
import { useAppSelector } from '../store';

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Architecture Foundation
 * Note: Full authentication lifecycle will be connected in Step 2.
 * Currently verifies store state access and protects route tree.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  void isAuthenticated;

  // In Step 1: Provide route boundary. When auth is enforced in Step 2,
  // this will redirect to /login if !isAuthenticated.
  return <>{children}</>;
}

export default ProtectedRoute;
