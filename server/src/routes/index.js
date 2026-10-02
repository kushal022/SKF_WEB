const express = require('express');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { knex } = require('../db');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const settingsRoutes = require('./settings.routes');
const themeRoutes = require('./theme.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');

const router = express.Router();

/**
 * Health Check Endpoint
 * GET /api/v1/health
 *
 * Verifies API readiness and database connectivity.
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    let dbStatus = 'ok';
    try {
      await knex.raw('SELECT 1+1 AS result');
    } catch (dbErr) {
      dbStatus = 'disconnected';
    }

    const isHealthy = dbStatus === 'ok';
    const statusCode = isHealthy ? 200 : 503;

    return res.status(statusCode).json(
      ApiResponse.success(
        isHealthy ? 'API is healthy' : 'API service degraded',
        {
          status: isHealthy ? 'ok' : 'degraded',
          database: dbStatus,
        }
      )
    );
  })
);

// Mount Public Domain Routes
router.use('/settings', settingsRoutes);
router.use('/theme', themeRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);

// Mount Authentication & Session Routes (/api/v1/auth)
router.use('/auth', authRoutes);

// Mount Admin Routes (/api/v1/admin)
router.use('/admin', adminRoutes);

module.exports = router;
