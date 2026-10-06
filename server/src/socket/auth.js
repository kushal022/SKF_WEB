const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Socket.IO Authentication Middleware
 *
 * Verifies JWT access token during connection handshake.
 * Strictly authorizes only active accounts with 'admin' or 'super_admin' role.
 * Rejects unauthenticated users, customers, barbers, or expired/invalid tokens.
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    // 1. Fallback to handshake authorization header (Bearer <token>)
    if (!token && socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (typeof authHeader === 'string') {
        token = authHeader.trim();
      }
    }

    // 2. Fallback to handshake query parameter if auth object omitted
    if (!token && socket.handshake.query?.token) {
      token = socket.handshake.query.token;
    }

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication error: Access token is required'));
    }

    // Clean Bearer prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.substring(7).trim();
    }

    // 3. Verify JWT signature & expiration
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Authentication error: Access token has expired'));
      }
      return next(new Error('Authentication error: Invalid access token'));
    }

    if (!payload || !payload.sub) {
      return next(new Error('Authentication error: Invalid token payload'));
    }

    // 4. Resolve user from database to verify active state
    const user = await User.query()
      .where({ public_id: payload.sub })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return next(new Error('Authentication error: User account not found'));
    }

    if (user.status !== 'active') {
      return next(new Error('Authentication error: User account is inactive'));
    }

    // 5. Strictly enforce admin or super_admin role
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return next(new Error('Authentication error: Forbidden. Only administrators can connect'));
    }

    // 6. Bind verified identity to socket instance
    socket.user = {
      id: user.id,
      public_id: user.public_id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    return next();
  } catch (error) {
    return next(new Error(`Authentication error: ${error.message}`));
  }
};

module.exports = {
  socketAuthMiddleware,
};
