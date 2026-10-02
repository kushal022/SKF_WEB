const crypto = require('crypto');
const config = require('../config');

/**
 * Parses duration string (e.g. '15m', '7d', '24h') to milliseconds.
 *
 * @param {string|number} durationStr - Duration string
 * @returns {number} Duration in milliseconds
 */
const parseDurationToMs = (durationStr) => {
  if (typeof durationStr === 'number') {
    return durationStr;
  }
  if (!durationStr || typeof durationStr !== 'string') {
    return 7 * 24 * 60 * 60 * 1000; // default 7 days
  }
  const match = durationStr.trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 's':
      return val * 1000;
    case 'm':
      return val * 60 * 1000;
    case 'h':
      return val * 60 * 60 * 1000;
    case 'd':
      return val * 24 * 60 * 60 * 1000;
    default:
      return val;
  }
};

/**
 * Generates a cryptographically secure random opaque refresh token string.
 *
 * @returns {string} Raw opaque refresh token
 */
const generateRawRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Computes a deterministic SHA-256 hash of a raw refresh token for safe storage.
 *
 * @param {string} rawToken - Plaintext refresh token
 * @returns {string} Hex-encoded SHA-256 hash
 */
const hashRefreshToken = (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Refresh token is required for hashing');
  }
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/**
 * Centralized cookie options for setting the refresh token HttpOnly cookie.
 *
 * @returns {object} Express cookie options
 */
const getRefreshCookieOptions = () => {
  const expiresInMs = parseDurationToMs(config.jwt.refreshExpiresIn);
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain || undefined,
    path: `${config.apiPrefix}/auth`,
    maxAge: expiresInMs,
  };
};

/**
 * Centralized cookie options for clearing the refresh token cookie.
 *
 * @returns {object} Express clearCookie options
 */
const getClearCookieOptions = () => {
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain || undefined,
    path: `${config.apiPrefix}/auth`,
  };
};

module.exports = {
  parseDurationToMs,
  generateRawRefreshToken,
  hashRefreshToken,
  getRefreshCookieOptions,
  getClearCookieOptions,
};
