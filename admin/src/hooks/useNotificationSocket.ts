import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store';
import { useToast } from '../components/ui';
import {
  connectSocket,
  disconnectSocket,
  setupNotificationListener,
} from '../services/socket';

/**
 * Hook to manage the real-time Socket.IO notification lifecycle for the Admin portal.
 * Connects on admin login, subscribes to 'notification:new' events, updates RTK Query cache,
 * triggers in-app toasts, and cleanly disconnects on logout.
 */
export function useNotificationSocket(): void {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { user, accessToken } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Only connect if user is authenticated and has administrator authorization
    const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
    if (!isAdmin || !accessToken) {
      disconnectSocket();
      return;
    }

    // Connect socket using authenticated in-memory access token
    connectSocket(accessToken);

    // Register real-time notification listener
    const unsubscribe = setupNotificationListener({
      dispatch,
      showToast,
      token: accessToken,
    });

    return () => {
      unsubscribe();
    };
  }, [user, accessToken, dispatch, showToast]);
}

export default useNotificationSocket;
