const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const customRequestService = require('../services/customRequest.service');

const createCustomRequest = asyncHandler(async (req, res) => {
  const result = await customRequestService.createPublicCustomRequest(req.body);
  return res
    .status(201)
    .json(ApiResponse.success('Custom furniture request submitted successfully', result));
});

const getAdminCustomRequests = asyncHandler(async (req, res) => {
  const result = await customRequestService.getAdminCustomRequests(req.query);
  return res.status(200).json(ApiResponse.success('Custom requests retrieved successfully', result));
});

const getAdminCustomRequestByPublicId = asyncHandler(async (req, res) => {
  const result = await customRequestService.getAdminCustomRequestByPublicId(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Custom request retrieved successfully', result));
});

const updateAdminCustomRequest = asyncHandler(async (req, res) => {
  const result = await customRequestService.updateAdminCustomRequest(
    req.params.publicId,
    req.body,
    req
  );
  return res.status(200).json(ApiResponse.success('Custom request updated successfully', result));
});

const updateCustomRequestStatus = asyncHandler(async (req, res) => {
  const result = await customRequestService.updateCustomRequestStatus(
    req.params.publicId,
    req.body,
    req
  );
  return res.status(200).json(ApiResponse.success('Custom request status updated successfully', result));
});

const getCustomRequestImages = asyncHandler(async (req, res) => {
  const result = await customRequestService.getCustomRequestImages(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Custom request images retrieved successfully', result));
});

const addCustomRequestImage = asyncHandler(async (req, res) => {
  const result = await customRequestService.addCustomRequestImage(
    req.params.publicId,
    req.body,
    req
  );
  return res.status(201).json(ApiResponse.success('Custom request image added successfully', result));
});

const updateCustomRequestImage = asyncHandler(async (req, res) => {
  const result = await customRequestService.updateCustomRequestImage(
    req.params.publicId,
    req.params.imagePublicId,
    req.body,
    req
  );
  return res.status(200).json(ApiResponse.success('Custom request image updated successfully', result));
});

const deleteCustomRequestImage = asyncHandler(async (req, res) => {
  const result = await customRequestService.deleteCustomRequestImage(
    req.params.publicId,
    req.params.imagePublicId,
    req
  );
  return res.status(200).json(ApiResponse.success(result.message));
});

module.exports = {
  createCustomRequest,
  getAdminCustomRequests,
  getAdminCustomRequestByPublicId,
  updateAdminCustomRequest,
  updateCustomRequestStatus,
  getCustomRequestImages,
  addCustomRequestImage,
  updateCustomRequestImage,
  deleteCustomRequestImage,
};
