/**
 * Socket.IO Room Strategy for Admin Notifications
 *
 * Rooms:
 * - admin:notifications         -> Common broadcast channel for all authenticated admins
 * - admin:user:{userId}         -> User-specific notifications for targeted admin
 * - admin:user:{userPublicId}   -> User-specific notifications by public UUID
 */

const ADMIN_NOTIFICATIONS_ROOM = 'admin:notifications';

/**
 * Returns standard room identifier for a user ID or public ID
 * @param {string|number} identifier
 * @returns {string}
 */
const getUserRoom = (identifier) => {
  return `admin:user:${identifier}`;
};

/**
 * Joins an authenticated admin socket to all permitted admin rooms.
 * Client-driven arbitrary room joining is prohibited.
 *
 * @param {import('socket.io').Socket} socket
 */
const joinAdminRooms = (socket) => {
  if (!socket?.user) return;

  // 1. Join common broadcast room for all admins
  socket.join(ADMIN_NOTIFICATIONS_ROOM);

  // 2. Join user-specific room by numeric DB ID
  if (socket.user.id) {
    socket.join(getUserRoom(socket.user.id));
  }

  // 3. Join user-specific room by public UUID
  if (socket.user.public_id) {
    socket.join(getUserRoom(socket.user.public_id));
  }
};

module.exports = {
  ADMIN_NOTIFICATIONS_ROOM,
  getUserRoom,
  joinAdminRooms,
};
