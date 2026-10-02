const express = require('express');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { knex } = require('../db');
const authRoutes = require('./auth.routes');

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

// Mount Authentication & Session Routes (/api/v1/auth)
router.use('/auth', authRoutes);

module.exports = router;
