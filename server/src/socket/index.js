const { Server } = require('socket.io');
const config = require('../config');
const { socketAuthMiddleware } = require('./auth');
const { joinAdminRooms, ADMIN_NOTIFICATIONS_ROOM, getUserRoom } = require('./rooms');
const notificationSocket = require('./notification.socket');

let ioInstance = null;

/**
 * Initialize Socket.IO with HTTP Server
 *
 * @param {import('http').Server} httpServer
 * @param {Object} [options={}]
 * @returns {import('socket.io').Server}
 */
function initSocketServer(httpServer, options = {}) {
  const allowedOrigins =
    config.socket?.corsOrigins ||
    config.cors?.allowedOrigins || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
    ];

  const isWildcard = allowedOrigins.includes('*');

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow non-browser clients or test runners without origin header
        if (!origin) {
          return callback(null, true);
        }

        if (isWildcard) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Allow official domains and subdomains
        if (origin === 'https://admin.skffurniture.com' || origin.endsWith('.skffurniture.com')) {
          return callback(null, true);
        }

        return callback(new Error(`CORS origin ${origin} is not allowed by Socket.IO`));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 25000,
    ...options,
  });

  // 1. Authenticate connection handshake via JWT
  io.use(socketAuthMiddleware);

  // 2. Handle connection lifecycle
  io.on('connection', (socket) => {
    // Join permitted admin rooms
    joinAdminRooms(socket);

    socket.on('disconnect', () => {
      // Clean disconnect
    });

    socket.on('error', (err) => {
      console.error(`[Socket] Client error (${socket.user?.email || socket.id}):`, err.message);
    });
  });

  notificationSocket.setIo(io);
  ioInstance = io;
  return io;
}

/**
 * Get active Socket.IO server instance
 * @returns {import('socket.io').Server|null}
 */
function getIo() {
  return ioInstance;
}

/**
 * Gracefully close Socket.IO server instance
 */
function closeSocketServer() {
  if (ioInstance) {
    try {
      ioInstance.close();
    } catch {
      // Ignored during shutdown
    }
    ioInstance = null;
    notificationSocket.setIo(null);
  }
}

module.exports = {
  initSocketServer,
  getIo,
  closeSocketServer,
  ADMIN_NOTIFICATIONS_ROOM,
  getUserRoom,
  joinAdminRooms,
  ...notificationSocket,
};
