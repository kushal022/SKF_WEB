const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const ApiResponse = require('../utils/apiResponse');
const authController = require('../controllers/auth.controller');
const {
  registerSchema,
  loginSchema,
  revokeSessionParamSchema,
  validate,
} = require('../validators/auth.validator');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Rate limiter factory for auth endpoints
const createAuthLimiter = (max, windowMinutes = 15, message = 'Too many requests from this IP. Please try again later.') => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json(ApiResponse.error(message, 'RATE_LIMIT_EXCEEDED'));
    },
    // Skip rate limiting during test runs
    skip: () => process.env.NODE_ENV === 'test',
  });
};

const loginLimiter = createAuthLimiter(
  config.rateLimit.loginMax,
  15,
  'Too many login attempts. Please try again after 15 minutes.'
);

const registerLimiter = createAuthLimiter(
  config.rateLimit.registerMax,
  15,
  'Too many registration attempts. Please try again after 15 minutes.'
);

const refreshLimiter = createAuthLimiter(
  config.rateLimit.loginMax * 2,
  15,
  'Too many token refresh attempts. Please try again later.'
);

// Public Authentication Routes
router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);

// Authenticated User & Session Routes
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getMe);
router.get('/sessions', authenticate, authController.getSessions);
router.post(
  '/sessions/:publicId/revoke',
  authenticate,
  validate(revokeSessionParamSchema, 'params'),
  authController.revokeSession
);

module.exports = router;
