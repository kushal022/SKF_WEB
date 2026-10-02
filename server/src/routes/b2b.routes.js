const express = require('express');
const validate = require('../middleware/validate.middleware');
const b2bController = require('../controllers/b2b.controller');
const { applyB2BSchema } = require('../validators/b2b.validator');

const router = express.Router();

/**
 * Public B2B Application Submission
 * POST /api/v1/b2b/apply
 */
router.post('/apply', validate(applyB2BSchema), b2bController.applyB2B);

module.exports = router;
