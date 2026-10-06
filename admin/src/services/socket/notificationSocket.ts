import type { AppDispatch } from '../../app/store';
import { baseApi } from '../../app/store/api';
import type { NotificationItem } from '../../types/notification';
import { getSocket, connectSocket } from './socket';

// In-memory cache of handled notification public_ids to prevent duplicates
// across socket re-deliveries, reconnects, or RTK Query invalidation cycles
const handledNotificationIds = new Set<string>();
const MAX_HANDLED_CACHE = 500;

/**
 * Check if a notification has already been handled in the current tab session
 */
export function isNotificationHandled(publicId: string): boolean {
  return handledNotificationIds.has(publicId);
}

/**
 * Mark a notification as handled and prune oldest entries if cache exceeds limit
 */
export function markNotificationHandled(publicId: string): void {
  handledNotificationIds.add(publicId);
  if (handledNotificationIds.size > MAX_HANDLED_CACHE) {
    const firstItem = handledNotificationIds.values().next().value;
    if (firstItem) {
      handledNotificationIds.delete(firstItem);
    }
  }
}

/**
 * Reset handled notifications cache (e.g. for testing or logout)
 */
export function clearHandledNotifications(): void {
  handledNotificationIds.clear();
}

/**
 * Update RTK Query cache in-place with instant zero-refresh UI updates
 */
export function syncNotificationToCache(dispatch: AppDispatch, notification: NotificationItem): void {
  // 1. Instantly increment unread counter badge in memory
  dispatch(
    baseApi.util.updateQueryData('getUnreadNotificationCount', undefined, (draft) => {
      return (draft ?? 0) + 1;
    })
  );

  // 2. Prepend new notification to the active NotificationBell dropdown list
  dispatch(
    baseApi.util.updateQueryData('getNotifications', { limit: 6, sort_order: 'desc' }, (draft) => {
      if (!draft?.data?.items) return;

      const exists = draft.data.items.some((item) => item.public_id === notification.public_id);
      if (!exists) {
        draft.data.items.unshift(notification);
        if (draft.data.items.length > 6) {
          draft.data.items.pop();
        }
        if (draft.data.pagination) {
          draft.data.pagination.total = (draft.data.pagination.total ?? 0) + 1;
        }
      }
    })
  );

  // 3. Invalidate tags so any active lists (e.g., Notification Center) refresh in background
  dispatch(
    baseApi.util.invalidateTags([
      { type: 'Notifications', id: 'LIST' },
      { type: 'Notifications', id: 'UNREAD_COUNT' },
    ])
  );
}

export interface SetupNotificationListenerOptions {
  dispatch: AppDispatch;
  showToast?: (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    title?: string,
    duration?: number
  ) => void;
  token?: string | null;
}

/**
 * Subscribe to real-time notification socket events
 *
 * @param options Listener configuration including dispatch and toast handler
 * @returns Teardown unsubscribe function
 */
export function setupNotificationListener(options: SetupNotificationListenerOptions): () => void {
  const { dispatch, showToast, token } = options;

  let socket = getSocket();
  if (!socket || !socket.connected) {
    socket = connectSocket(token || undefined);
  }

  if (!socket) {
    return () => {};
  }

  const handleNewNotification = (notification: NotificationItem) => {
    if (!notification || !notification.public_id) {
      return;
    }

    // Duplicate prevention: ignore if already processed in this tab
    if (isNotificationHandled(notification.public_id)) {
      return;
    }

    markNotificationHandled(notification.public_id);

    // 1. Trigger non-blocking user toast alert
    if (showToast) {
      const toastTitle = notification.title || 'New Notification';
      showToast('info', notification.message, toastTitle, 5000);
    }

    // 2. Synchronize RTK Query store cache
    syncNotificationToCache(dispatch, notification);
  };

  socket.on('notification:new', handleNewNotification);

  return () => {
    if (socket) {
      socket.off('notification:new', handleNewNotification);
    }
  };
}

export default {
  isNotificationHandled,
  markNotificationHandled,
  clearHandledNotifications,
  syncNotificationToCache,
  setupNotificationListener,
};
