const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generates a short-lived JWT access token for an authenticated user session.
 *
 * @param {object} user - User object with public_id and role
 * @param {object} session - Session object with public_id
 * @returns {string} Signed JWT token
 */
const generateAccessToken = (user, session) => {
  const payload = {
    sub: user.public_id,
    sid: session.public_id,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn || '15m',
  });
};

/**
 * Verifies and decodes a JWT access token.
 *
 * @param {string} token - Bearer JWT token string
 * @returns {object} Decoded JWT payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
};
