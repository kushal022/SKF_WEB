const express = require('express');
const validate = require('../middleware/validate.middleware');
const { quotationParamSchema } = require('../validators/quotation.validator');
const quotationController = require('../controllers/quotation.controller');

const router = express.Router();

/**
 * Public Customer Quotation Sharing Routes
 * These routes allow recipients to inspect and approve/reject shared quotations without admin authentication.
 */

// GET /api/v1/quotations/:publicId — Customer views quotation
router.get(
  '/:publicId',
  validate(quotationParamSchema, 'params'),
  quotationController.getPublicQuotationByPublicId
);

// POST /api/v1/quotations/:publicId/accept — Customer accepts quotation
router.post(
  '/:publicId/accept',
  validate(quotationParamSchema, 'params'),
  quotationController.acceptPublicQuotation
);

// POST /api/v1/quotations/:publicId/reject — Customer rejects quotation
router.post(
  '/:publicId/reject',
  validate(quotationParamSchema, 'params'),
  quotationController.rejectPublicQuotation
);

module.exports = router;
