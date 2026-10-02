const express = require('express');
const validate = require('../middleware/validate.middleware');
const customRequestController = require('../controllers/customRequest.controller');
const { createCustomRequestSchema } = require('../validators/customRequest.validator');

const router = express.Router();

/**
 * Public Custom Furniture Request Submission
 * POST /api/v1/custom-requests
 */
router.post(
  '/',
  validate(createCustomRequestSchema),
  customRequestController.createCustomRequest
);

module.exports = router;
