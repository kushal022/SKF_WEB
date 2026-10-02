const express = require('express');
const validate = require('../middleware/validate.middleware');
const enquiryController = require('../controllers/enquiry.controller');
const { createEnquirySchema } = require('../validators/enquiry.validator');

const router = express.Router();

/**
 * Public Enquiry Submission
 * POST /api/v1/enquiries
 */
router.post('/', validate(createEnquirySchema), enquiryController.createEnquiry);

module.exports = router;
