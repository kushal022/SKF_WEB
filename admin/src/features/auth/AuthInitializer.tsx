import React, { useEffect, useRef } from 'react';
import { Loader2, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
  useRefreshMutation,
  useLazyGetMeQuery,
} from '../../app/store/api';
import {
  setCredentials,
  setInitializing,
  logout,
} from './authSlice';

export interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useAppDispatch();
  const { isInitializing, accessToken } = useAppSelector((state) => state.auth);
  const [triggerRefresh] = useRefreshMutation();
  const [triggerGetMe] = useLazyGetMeQuery();
  const initAttempted = useRef(false);

  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    async function initAuth() {
      try {
        if (accessToken) {
          // Access token already in memory: verify identity
          const meResult = await triggerGetMe().unwrap();
          if (meResult.data?.user) {
            // Verify admin role authorization
            if (meResult.data.user.role !== 'admin') {
              dispatch(logout());
            }
          }
          dispatch(setInitializing(false));
          return;
        }

        // Access token not in memory: attempt refresh via HttpOnly cookie
        const refreshResult = await triggerRefresh().unwrap();
        if (refreshResult.data?.accessToken && refreshResult.data.user) {
          // Verify user role
          if (refreshResult.data.user.role === 'admin') {
            dispatch(
              setCredentials({
                user: refreshResult.data.user,
                accessToken: refreshResult.data.accessToken,
              })
            );
          } else {
            dispatch(logout());
          }
        } else {
          dispatch(setInitializing(false));
        }
      } catch {
        // Refresh token missing, expired, or invalid - remain logged out
        dispatch(setInitializing(false));
      }
    }

    initAuth();
  }, [accessToken, dispatch, triggerGetMe, triggerRefresh]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--brand-primary)] text-white p-4 select-none">
        <div className="flex flex-col items-center max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/40 flex items-center justify-center text-[var(--brand-accent)] shadow-lg shadow-sky-950/50">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">SKF Admin Portal</h1>
            <p className="text-xs text-slate-400 mt-1">Stainless Steel Furniture Management</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium pt-4">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-accent)]" />
            <span>Checking session...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthInitializer;
