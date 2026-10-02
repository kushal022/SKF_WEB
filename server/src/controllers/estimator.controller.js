const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const estimatorService = require('../services/estimator.service');

const getPublicEstimatorRules = asyncHandler(async (req, res) => {
  const result = await estimatorService.getPublicEstimatorRules();
  return res
    .status(200)
    .json(ApiResponse.success('Active estimator rules retrieved successfully', result));
});

const calculateEstimate = asyncHandler(async (req, res) => {
  const result = await estimatorService.calculateEstimate(req.body);
  return res
    .status(200)
    .json(ApiResponse.success('Price estimate calculated successfully', result));
});

const getAdminEstimatorRules = asyncHandler(async (req, res) => {
  const result = await estimatorService.getAdminEstimatorRules(req.query);
  return res
    .status(200)
    .json(ApiResponse.success('Estimator rules retrieved successfully', result));
});

const getAdminEstimatorRuleByPublicId = asyncHandler(async (req, res) => {
  const result = await estimatorService.getAdminEstimatorRuleByPublicId(req.params.publicId);
  return res
    .status(200)
    .json(ApiResponse.success('Estimator rule retrieved successfully', result));
});

const createAdminEstimatorRule = asyncHandler(async (req, res) => {
  const result = await estimatorService.createAdminEstimatorRule(req.body, req);
  return res
    .status(201)
    .json(ApiResponse.success('Estimator rule created successfully', result));
});

const updateAdminEstimatorRule = asyncHandler(async (req, res) => {
  const result = await estimatorService.updateAdminEstimatorRule(
    req.params.publicId,
    req.body,
    req
  );
  return res
    .status(200)
    .json(ApiResponse.success('Estimator rule updated successfully', result));
});

const deleteAdminEstimatorRule = asyncHandler(async (req, res) => {
  const result = await estimatorService.deleteAdminEstimatorRule(req.params.publicId, req);
  return res.status(200).json(ApiResponse.success(result.message));
});

module.exports = {
  getPublicEstimatorRules,
  calculateEstimate,
  getAdminEstimatorRules,
  getAdminEstimatorRuleByPublicId,
  createAdminEstimatorRule,
  updateAdminEstimatorRule,
  deleteAdminEstimatorRule,
};
