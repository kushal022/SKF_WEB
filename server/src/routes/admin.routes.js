const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// Enforce authentication and administrative role authorization across all admin routes
router.use(authenticate, authorizeRoles('admin'));

/**
 * Current Admin Profile
 * GET /api/v1/admin/me
 */
router.get('/me', adminController.getMe);

/**
 * System-wide Summary Metrics
 * GET /api/v1/admin/dashboard/summary
 */
router.get('/dashboard/summary', adminController.getDashboardSummary);

module.exports = router;
