const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Validates JWT access token from Authorization: Bearer <token> header
 * and attaches verified, active user details to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      throw new ApiError(401, 'Authorization header is missing', 'UNAUTHORIZED');
    }

    const parts = authHeader.trim().split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      throw new ApiError(
        401,
        'Invalid authorization header format. Expected "Bearer <token>"',
        'MALFORMED_TOKEN'
      );
    }

    const token = parts[1];

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Access token has expired', 'TOKEN_EXPIRED');
      }
      throw new ApiError(401, 'Invalid access token', 'TOKEN_INVALID');
    }

    if (!payload || !payload.sub) {
      throw new ApiError(401, 'Invalid token payload', 'TOKEN_INVALID');
    }

    // Load user from database to ensure user still exists and is active
    const user = await User.query()
      .where({ public_id: payload.sub })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      throw new ApiError(401, 'User account no longer exists', 'USER_NOT_FOUND');
    }

    if (user.status !== 'active') {
      throw new ApiError(401, 'User account is not active', 'ACCOUNT_INACTIVE');
    }

    // Attach verified user and session ID to request
    req.user = {
      id: user.id,
      public_id: user.public_id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      status: user.status,
    };
    req.sessionId = payload.sid || null;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based Authorization Middleware
 * Verifies that the authenticated user possesses at least one of the permitted roles.
 *
 * @param {...string} allowedRoles - Permitted role strings (e.g. 'admin', 'customer')
 * @returns {Function} Express middleware handler
 */
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required', 'UNAUTHORIZED'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new ApiError(
        403,
        'You do not have permission to access this resource',
        'FORBIDDEN'
      )
    );
  }

  next();
};

module.exports = {
  authenticate,
  authorizeRoles,
};
