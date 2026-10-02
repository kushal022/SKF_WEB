const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const reviewService = require('../services/review.service');

const getPublicReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getPublicReviews(req.query);
  return res.status(200).json(ApiResponse.success('Reviews retrieved successfully', result));
});

const createPublicReview = asyncHandler(async (req, res) => {
  const result = await reviewService.createPublicReview(req.body);
  return res
    .status(201)
    .json(ApiResponse.success('Review submitted successfully for moderation', result));
});

const getAdminReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getAdminReviews(req.query);
  return res.status(200).json(ApiResponse.success('Reviews retrieved successfully', result));
});

const getAdminReviewByPublicId = asyncHandler(async (req, res) => {
  const result = await reviewService.getAdminReviewByPublicId(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Review retrieved successfully', result));
});

const updateAdminReview = asyncHandler(async (req, res) => {
  const result = await reviewService.updateAdminReview(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('Review updated successfully', result));
});

const updateReviewStatus = asyncHandler(async (req, res) => {
  const result = await reviewService.updateReviewStatus(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('Review status updated successfully', result));
});

const setReviewFeatured = asyncHandler(async (req, res) => {
  const result = await reviewService.setReviewFeatured(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('Review featured state updated successfully', result));
});

const deleteAdminReview = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteAdminReview(req.params.publicId, req);
  return res.status(200).json(ApiResponse.success(result.message));
});

module.exports = {
  getPublicReviews,
  createPublicReview,
  getAdminReviews,
  getAdminReviewByPublicId,
  updateAdminReview,
  updateReviewStatus,
  setReviewFeatured,
  deleteAdminReview,
};
