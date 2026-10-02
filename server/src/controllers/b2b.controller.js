const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const b2bService = require('../services/b2b.service');

const applyB2B = asyncHandler(async (req, res) => {
  const result = await b2bService.applyPublicB2B(req.body);
  return res.status(201).json(ApiResponse.success('B2B application submitted successfully', result));
});

const getAdminB2BAccounts = asyncHandler(async (req, res) => {
  const result = await b2bService.getAdminB2BAccounts(req.query);
  return res.status(200).json(ApiResponse.success('B2B accounts retrieved successfully', result));
});

const getAdminB2BAccountByPublicId = asyncHandler(async (req, res) => {
  const result = await b2bService.getAdminB2BAccountByPublicId(req.params.publicId);
  return res.status(200).json(ApiResponse.success('B2B account retrieved successfully', result));
});

const updateAdminB2BAccount = asyncHandler(async (req, res) => {
  const result = await b2bService.updateAdminB2BAccount(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('B2B account updated successfully', result));
});

const updateB2BAccountStatus = asyncHandler(async (req, res) => {
  const result = await b2bService.updateB2BAccountStatus(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('B2B account status updated successfully', result));
});

const getB2BDocuments = asyncHandler(async (req, res) => {
  const result = await b2bService.getB2BDocuments(req.params.publicId);
  return res.status(200).json(ApiResponse.success('B2B documents retrieved successfully', result));
});

const createB2BDocument = asyncHandler(async (req, res) => {
  const result = await b2bService.createB2BDocument(req.params.publicId, req.body, req);
  return res.status(201).json(ApiResponse.success('B2B document created successfully', result));
});

const updateB2BDocument = asyncHandler(async (req, res) => {
  const result = await b2bService.updateB2BDocument(
    req.params.publicId,
    req.params.documentPublicId,
    req.body,
    req
  );
  return res.status(200).json(ApiResponse.success('B2B document updated successfully', result));
});

const deleteB2BDocument = asyncHandler(async (req, res) => {
  const result = await b2bService.deleteB2BDocument(
    req.params.publicId,
    req.params.documentPublicId,
    req
  );
  return res.status(200).json(ApiResponse.success(result.message));
});

const updateB2BDocumentStatus = asyncHandler(async (req, res) => {
  const result = await b2bService.updateB2BDocumentStatus(
    req.params.publicId,
    req.params.documentPublicId,
    req.body,
    req
  );
  return res.status(200).json(ApiResponse.success('B2B document status updated successfully', result));
});

const getAdminPricingRules = asyncHandler(async (req, res) => {
  const result = await b2bService.getAdminPricingRules(req.query);
  return res.status(200).json(ApiResponse.success('B2B pricing rules retrieved successfully', result));
});

const getAdminPricingRuleByPublicId = asyncHandler(async (req, res) => {
  const result = await b2bService.getAdminPricingRuleByPublicId(req.params.publicId);
  return res.status(200).json(ApiResponse.success('B2B pricing rule retrieved successfully', result));
});

const createAdminPricingRule = asyncHandler(async (req, res) => {
  const result = await b2bService.createAdminPricingRule(req.body, req);
  return res.status(201).json(ApiResponse.success('B2B pricing rule created successfully', result));
});

const updateAdminPricingRule = asyncHandler(async (req, res) => {
  const result = await b2bService.updateAdminPricingRule(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('B2B pricing rule updated successfully', result));
});

const deleteAdminPricingRule = asyncHandler(async (req, res) => {
  const result = await b2bService.deleteAdminPricingRule(req.params.publicId, req);
  return res.status(200).json(ApiResponse.success(result.message));
});

module.exports = {
  applyB2B,
  getAdminB2BAccounts,
  getAdminB2BAccountByPublicId,
  updateAdminB2BAccount,
  updateB2BAccountStatus,
  getB2BDocuments,
  createB2BDocument,
  updateB2BDocument,
  deleteB2BDocument,
  updateB2BDocumentStatus,
  getAdminPricingRules,
  getAdminPricingRuleByPublicId,
  createAdminPricingRule,
  updateAdminPricingRule,
  deleteAdminPricingRule,
};
