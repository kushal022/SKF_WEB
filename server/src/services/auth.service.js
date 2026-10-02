const ApiError = require('../utils/ApiError');
const { hashPassword, comparePassword } = require('../utils/password');
const {
  generateRawRefreshToken,
  hashRefreshToken,
  parseDurationToMs,
} = require('../utils/refreshToken');
const { generateAccessToken } = require('../utils/jwt');
const config = require('../config');
const User = require('../models/User');
const Session = require('../models/Session');

/**
 * Extracts and formats safe user details for API responses.
 *
 * @param {object} user - User model instance
 * @returns {object} Sanitized user profile
 */
const sanitizeUser = (user) => ({
  public_id: user.public_id,
  name: user.name,
  email: user.email,
  phone: user.phone || null,
  role: user.role,
  status: user.status,
});

/**
 * Extracts clean device information summary from User-Agent string.
 *
 * @param {string} userAgent - Raw User-Agent header
 * @returns {string} Truncated device/client information
 */
const extractDeviceInfo = (userAgent) => {
  if (!userAgent || typeof userAgent !== 'string') {
    return 'Unknown Device';
  }
  // Trim and truncate to fit the column limit (255 chars)
  return userAgent.trim().slice(0, 255);
};

/**
 * Registers a new public user with customer role.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} [params.phone]
 * @param {string} params.password
 * @returns {Promise<object>} Sanitized created user
 */
const registerUser = async ({ name, email, phone, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check for existing active or non-deleted account with this email
  const existingUser = await User.query()
    .where({ email: normalizedEmail })
    .whereNull('deleted_at')
    .first();

  if (existingUser) {
    throw new ApiError(409, 'An account with this email address already exists', 'DUPLICATE_EMAIL');
  }

  // 2. Hash plaintext password
  const password_hash = await hashPassword(password);

  // 3. Insert user record with default public role 'customer' and 'active' status
  const user = await User.query().insert({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : null,
    password_hash,
    role: 'customer',
    status: 'active',
  });

  return sanitizeUser(user);
};

/**
 * Authenticates user credentials and generates session tokens.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 * @returns {Promise<{ user: object, accessToken: string, rawRefreshToken: string }>}
 */
const loginUser = async ({ email, password, ipAddress, userAgent }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Find user by email
  const user = await User.query()
    .where({ email: normalizedEmail })
    .whereNull('deleted_at')
    .first();

  if (!user) {
    // Return generic error message to prevent account enumeration
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // 2. Check user account status
  if (user.status !== 'active') {
    throw new ApiError(
      401,
      'Your account is currently inactive or suspended. Please contact support.',
      'ACCOUNT_INACTIVE'
    );
  }

  // 3. Verify password hash
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // 4. Generate opaque refresh token and its hash
  const rawRefreshToken = generateRawRefreshToken();
  const refresh_token_hash = hashRefreshToken(rawRefreshToken);
  const refreshExpiresInMs = parseDurationToMs(config.jwt.refreshExpiresIn);
  const expires_at = new Date(Date.now() + refreshExpiresInMs);
  const deviceInfo = extractDeviceInfo(userAgent);

  // 5. Atomic session creation and last_login_at timestamp update
  const { session, accessToken } = await User.transaction(async (trx) => {
    const newSession = await Session.query(trx).insert({
      user_id: user.id,
      refresh_token_hash,
      device_info: deviceInfo,
      ip_address: ipAddress ? String(ipAddress).slice(0, 45) : null,
      user_agent: userAgent || null,
      expires_at,
    });

    await User.query(trx).patchAndFetchById(user.id, {
      last_login_at: new Date(),
    });

    const token = generateAccessToken(user, newSession);
    return { session: newSession, accessToken: token };
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    rawRefreshToken,
  };
};

/**
 * Rotates an existing refresh token and returns a fresh access token.
 *
 * @param {object} params
 * @param {string} params.rawRefreshToken - Incoming refresh token from HttpOnly cookie
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 * @returns {Promise<{ user: object, accessToken: string, rawRefreshToken: string }>}
 */
const refreshUserSession = async ({ rawRefreshToken, ipAddress, userAgent }) => {
  if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
    throw new ApiError(401, 'Refresh token is missing', 'REFRESH_TOKEN_REQUIRED');
  }

  // 1. Hash supplied token to lookup session
  const incomingHash = hashRefreshToken(rawRefreshToken);

  const session = await Session.query().where({ refresh_token_hash: incomingHash }).first();

  if (!session) {
    throw new ApiError(401, 'Invalid or unrecognized refresh session', 'INVALID_SESSION');
  }

  // 2. Check session revocation
  if (session.revoked_at) {
    throw new ApiError(401, 'Session has been revoked', 'SESSION_REVOKED');
  }

  // 3. Check session expiration
  if (new Date(session.expires_at) <= new Date()) {
    throw new ApiError(401, 'Session has expired', 'SESSION_EXPIRED');
  }

  // 4. Load user and verify account status
  const user = await User.query().findById(session.user_id).whereNull('deleted_at');

  if (!user || user.status !== 'active') {
    // Revoke invalid session immediately
    await session.$query().patch({ revoked_at: new Date() });
    throw new ApiError(401, 'User account is no longer active', 'ACCOUNT_INACTIVE');
  }

  // 5. Refresh token rotation: generate new random token
  const newRawRefreshToken = generateRawRefreshToken();
  const newHash = hashRefreshToken(newRawRefreshToken);
  const refreshExpiresInMs = parseDurationToMs(config.jwt.refreshExpiresIn);
  const newExpiresAt = new Date(Date.now() + refreshExpiresInMs);
  const deviceInfo = extractDeviceInfo(userAgent);

  // 6. Update session atomically
  await Session.transaction(async (trx) => {
    await Session.query(trx).patchAndFetchById(session.id, {
      refresh_token_hash: newHash,
      device_info: deviceInfo,
      ip_address: ipAddress ? String(ipAddress).slice(0, 45) : session.ip_address,
      user_agent: userAgent || session.user_agent,
      expires_at: newExpiresAt,
      updated_at: new Date(),
    });
  });

  // 7. Generate new JWT access token
  const accessToken = generateAccessToken(user, session);

  return {
    user: sanitizeUser(user),
    accessToken,
    rawRefreshToken: newRawRefreshToken,
  };
};

/**
 * Revokes the session associated with the supplied refresh token.
 *
 * @param {string} [rawRefreshToken] - Incoming refresh token from HttpOnly cookie
 * @returns {Promise<boolean>} True if handled
 */
const logoutUser = async (rawRefreshToken) => {
  if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
    return true; // Already signed out or no session token provided
  }

  try {
    const incomingHash = hashRefreshToken(rawRefreshToken);
    const session = await Session.query().where({ refresh_token_hash: incomingHash }).first();

    if (session && !session.revoked_at) {
      await session.$query().patch({
        revoked_at: new Date(),
        updated_at: new Date(),
      });
    }
  } catch (_) {
    // Silent catch: logout should be idempotent and always succeed from client's perspective
  }

  return true;
};

/**
 * Revokes all active sessions for a specific user.
 *
 * @param {number|string} userId - Internal user ID
 * @returns {Promise<number>} Number of revoked sessions
 */
const logoutAllUserSessions = async (userId) => {
  return Session.query()
    .where({ user_id: userId })
    .whereNull('revoked_at')
    .patch({
      revoked_at: new Date(),
      updated_at: new Date(),
    });
};

/**
 * Retrieves all session history for the authenticated user with safe metadata.
 *
 * @param {number|string} userId - Internal user ID
 * @param {string} [currentSessionPublicId] - Public ID of current session if known
 * @returns {Promise<Array<object>>} List of safe session records
 */
const getUserSessions = async (userId, currentSessionPublicId = null) => {
  const sessions = await Session.query()
    .where({ user_id: userId })
    .orderBy('created_at', 'desc');

  const now = new Date();

  return sessions.map((s) => ({
    public_id: s.public_id,
    device_info: s.device_info,
    ip_address: s.ip_address,
    user_agent: s.user_agent,
    expires_at: s.expires_at,
    revoked_at: s.revoked_at,
    created_at: s.created_at,
    is_active: !s.revoked_at && new Date(s.expires_at) > now,
    is_current: currentSessionPublicId ? s.public_id === currentSessionPublicId : false,
  }));
};

/**
 * Revokes a specific session belonging to the authenticated user.
 *
 * @param {number|string} userId - Internal user ID
 * @param {string} sessionPublicId - Public ID of the session to revoke
 * @returns {Promise<boolean>} True if revoked
 */
const revokeUserSession = async (userId, sessionPublicId) => {
  const session = await Session.query()
    .where({
      public_id: sessionPublicId,
      user_id: userId,
    })
    .first();

  if (!session) {
    throw new ApiError(404, 'Session not found or does not belong to you', 'SESSION_NOT_FOUND');
  }

  if (!session.revoked_at) {
    await session.$query().patch({
      revoked_at: new Date(),
      updated_at: new Date(),
    });
  }

  return true;
};

module.exports = {
  sanitizeUser,
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  logoutAllUserSessions,
  getUserSessions,
  revokeUserSession,
};
