const express = require('express');
const validate = require('../middleware/validate.middleware');
const reviewController = require('../controllers/review.controller');
const { createReviewSchema } = require('../validators/review.validator');

const router = express.Router();

/**
 * Public Approved Reviews List
 * GET /api/v1/reviews
 */
router.get('/', reviewController.getPublicReviews);

/**
 * Public Review Submission (starts as pending)
 * POST /api/v1/reviews
 */
router.post('/', validate(createReviewSchema), reviewController.createPublicReview);

module.exports = router;
