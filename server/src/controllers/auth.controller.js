const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getRefreshCookieOptions, getClearCookieOptions } = require('../utils/refreshToken');
const config = require('../config');
const authService = require('../services/auth.service');

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  return res.status(201).json(ApiResponse.success('User registered successfully', { user }));
});

/**
 * Authenticate user and create new session
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { user, accessToken, rawRefreshToken } = await authService.loginUser({
    email: req.body.email,
    password: req.body.password,
    ipAddress: req.ip || req.headers['x-forwarded-for'],
    userAgent: req.get('user-agent'),
  });

  // Set HttpOnly refresh token cookie
  res.cookie(config.cookie.name, rawRefreshToken, getRefreshCookieOptions());

  return res.status(200).json(
    ApiResponse.success('Login successful', {
      accessToken,
      user,
    })
  );
});

/**
 * Rotate refresh token and issue new access token
 * POST /api/v1/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies ? req.cookies[config.cookie.name] : null;

  const { user, accessToken, rawRefreshToken } = await authService.refreshUserSession({
    rawRefreshToken: incomingToken,
    ipAddress: req.ip || req.headers['x-forwarded-for'],
    userAgent: req.get('user-agent'),
  });

  // Set rotated HttpOnly refresh token cookie
  res.cookie(config.cookie.name, rawRefreshToken, getRefreshCookieOptions());

  return res.status(200).json(
    ApiResponse.success('Session refreshed successfully', {
      accessToken,
      user,
    })
  );
});

/**
 * Log out from current session
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies ? req.cookies[config.cookie.name] : null;

  await authService.logoutUser(incomingToken);

  // Clear refresh token cookie
  res.clearCookie(config.cookie.name, getClearCookieOptions());

  return res.status(200).json(ApiResponse.success('Logged out successfully', {}));
});

/**
 * Log out from all active sessions
 * POST /api/v1/auth/logout-all
 */
const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAllUserSessions(req.user.id);

  // Clear current device cookie
  res.clearCookie(config.cookie.name, getClearCookieOptions());

  return res.status(200).json(ApiResponse.success('All sessions revoked successfully', {}));
});

/**
 * Get profile of currently authenticated user
 * GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = {
    public_id: req.user.public_id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role,
    status: req.user.status,
  };

  return res.status(200).json(ApiResponse.success('User profile fetched successfully', { user }));
});

/**
 * List active and past sessions for current user
 * GET /api/v1/auth/sessions
 */
const getSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getUserSessions(req.user.id, req.sessionId);

  return res.status(200).json(ApiResponse.success('Sessions retrieved successfully', { sessions }));
});

/**
 * Revoke a specific session
 * POST /api/v1/auth/sessions/:publicId/revoke
 */
const revokeSession = asyncHandler(async (req, res) => {
  const targetPublicId = req.params.publicId;

  await authService.revokeUserSession(req.user.id, targetPublicId);

  // If user revoked the current active session, clear the cookie
  if (req.sessionId && req.sessionId === targetPublicId) {
    res.clearCookie(config.cookie.name, getClearCookieOptions());
  }

  return res.status(200).json(ApiResponse.success('Session revoked successfully', {}));
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  getSessions,
  revokeSession,
};
