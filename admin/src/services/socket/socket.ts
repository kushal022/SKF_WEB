import { io, Socket } from 'socket.io-client';
import { config } from '../../utils/config';
import { tokenStorage } from '../apiClient';

let socketInstance: Socket | null = null;

/**
 * Get the current Socket.IO client instance
 */
export function getSocket(): Socket | null {
  return socketInstance;
}

/**
 * Check whether the admin socket is actively connected
 */
export function isSocketConnected(): boolean {
  return Boolean(socketInstance?.connected);
}

/**
 * Establish authenticated Socket.IO connection for the administrator.
 * Strictly uses in-memory token from tokenStorage without exposing globals.
 *
 * @param explicitToken - Optional token override if available immediately
 * @returns Connected or connecting Socket instance
 */
export function connectSocket(explicitToken?: string): Socket | null {
  const token = explicitToken || tokenStorage.getToken();

  if (!token) {
    // Unauthenticated: cannot connect to protected admin socket
    return null;
  }

  // If already connected and active, return existing instance
  if (socketInstance?.connected) {
    return socketInstance;
  }

  // Clean up any stale or lingering instance
  if (socketInstance) {
    try {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    } catch {
      // Ignored
    }
    socketInstance = null;
  }

  // Create new socket connection
  socketInstance = io(config.socketUrl, {
    auth: (cb) => {
      // Dynamic auth lookup ensures fresh token on each reconnect
      const currentToken = tokenStorage.getToken() || token;
      cb({ token: currentToken });
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  });

  socketInstance.on('connect', () => {
    // Successfully connected
  });

  socketInstance.on('disconnect', (_reason) => {
    // Disconnected
  });

  socketInstance.on('connect_error', (error) => {
    console.warn('[Socket] Connection warning:', error.message);
  });

  return socketInstance;
}

/**
 * Safely tear down and disconnect the admin socket (e.g. on logout)
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    try {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    } catch {
      // Ignored
    }
    socketInstance = null;
  }
}

export default {
  getSocket,
  connectSocket,
  disconnectSocket,
  isSocketConnected,
};
