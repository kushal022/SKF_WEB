const express = require('express');
const validate = require('../middleware/validate.middleware');
const estimatorController = require('../controllers/estimator.controller');
const { calculateEstimatorSchema } = require('../validators/estimator.validator');

const router = express.Router();

/**
 * Public Estimator Rules
 * GET /api/v1/estimator/rules
 */
router.get('/rules', estimatorController.getPublicEstimatorRules);

/**
 * Public Estimator Calculation
 * POST /api/v1/estimator/calculate
 */
router.post(
  '/calculate',
  validate(calculateEstimatorSchema),
  estimatorController.calculateEstimate
);

module.exports = router;
