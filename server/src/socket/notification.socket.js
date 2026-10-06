const { ADMIN_NOTIFICATIONS_ROOM, getUserRoom } = require('./rooms');

let ioInstance = null;

/**
 * Configure the active Socket.IO server instance
 * @param {import('socket.io').Server|null} io
 */
const setIo = (io) => {
  ioInstance = io;
};

/**
 * Retrieve the active Socket.IO instance
 * @returns {import('socket.io').Server|null}
 */
const getIo = () => {
  return ioInstance;
};

/**
 * Standardize notification payload structure for socket emission
 * @param {Object} notification
 * @returns {Object}
 */
const formatSocketNotification = (notification) => {
  if (!notification) return null;

  return {
    public_id: notification.public_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data || null,
    channel: notification.channel || 'in_app',
    is_read: Boolean(notification.is_read),
    read_at: notification.read_at || null,
    related_entity_type: notification.related_entity_type || null,
    user: notification.user
      ? {
          public_id: notification.user.public_id,
          name: notification.user.name,
          email: notification.user.email,
        }
      : null,
    created_at: notification.created_at,
    updated_at: notification.updated_at,
  };
};

/**
 * Centralized Socket.IO event emitter for new notifications.
 * Routes to either user-specific rooms or the common admin room.
 *
 * @param {Object} notification - Sanitized or DB notification record
 * @returns {boolean} Whether emission succeeded
 */
const emitNewNotification = (notification) => {
  if (!ioInstance) {
    // Failsafe: if socket server is offline or unmounted, do not disrupt DB operations
    return false;
  }

  try {
    const payload = formatSocketNotification(notification);
    if (!payload) return false;

    // Check if notification is targeted to a specific user
    const targetUserId = notification.user_id || notification.user?.id;
    const targetUserPublicId = notification.user?.public_id || notification.user_public_id;

    if (targetUserId || targetUserPublicId) {
      // User-specific notification: emit ONLY to the intended admin's room(s)
      if (targetUserId) {
        ioInstance.to(getUserRoom(targetUserId)).emit('notification:new', payload);
      }
      if (targetUserPublicId && targetUserPublicId !== targetUserId) {
        ioInstance.to(getUserRoom(targetUserPublicId)).emit('notification:new', payload);
      }
    } else {
      // Broadcast notification: emit to all authenticated admins
      ioInstance.to(ADMIN_NOTIFICATIONS_ROOM).emit('notification:new', payload);
    }

    return true;
  } catch (error) {
    console.error('[Socket] Failed to emit notification:new:', error.message);
    return false;
  }
};

/**
 * Explicit helper to broadcast a notification to all connected admins
 * @param {Object} notification
 * @returns {boolean}
 */
const emitToAllAdmins = (notification) => {
  if (!ioInstance) return false;

  try {
    const payload = formatSocketNotification(notification);
    if (!payload) return false;
    ioInstance.to(ADMIN_NOTIFICATIONS_ROOM).emit('notification:new', payload);
    return true;
  } catch (error) {
    console.error('[Socket] Failed to emitToAllAdmins:', error.message);
    return false;
  }
};

/**
 * Explicit helper to emit a notification to a specific admin user
 * @param {string|number} userIdentifier - User ID or public UUID
 * @param {Object} notification
 * @returns {boolean}
 */
const emitToUser = (userIdentifier, notification) => {
  if (!ioInstance || !userIdentifier) return false;

  try {
    const payload = formatSocketNotification(notification);
    if (!payload) return false;
    ioInstance.to(getUserRoom(userIdentifier)).emit('notification:new', payload);
    return true;
  } catch (error) {
    console.error(`[Socket] Failed to emitToUser (${userIdentifier}):`, error.message);
    return false;
  }
};

module.exports = {
  setIo,
  getIo,
  formatSocketNotification,
  emitNewNotification,
  emitToAllAdmins,
  emitToUser,
};
