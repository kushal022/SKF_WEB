const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const enquiryService = require('../services/enquiry.service');

const createEnquiry = asyncHandler(async (req, res) => {
  const result = await enquiryService.createPublicEnquiry(req.body);
  return res
    .status(201)
    .json(ApiResponse.success('Enquiry submitted successfully', result));
});

const getAdminEnquiries = asyncHandler(async (req, res) => {
  const result = await enquiryService.getAdminEnquiries(req.query);
  return res.status(200).json(ApiResponse.success('Enquiries retrieved successfully', result));
});

const getAdminEnquiryByPublicId = asyncHandler(async (req, res) => {
  const result = await enquiryService.getAdminEnquiryByPublicId(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Enquiry retrieved successfully', result));
});

const updateAdminEnquiry = asyncHandler(async (req, res) => {
  const result = await enquiryService.updateAdminEnquiry(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('Enquiry updated successfully', result));
});

const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const result = await enquiryService.updateEnquiryStatus(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('Enquiry status updated successfully', result));
});

const getEnquiryNotes = asyncHandler(async (req, res) => {
  const result = await enquiryService.getEnquiryNotes(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Enquiry notes retrieved successfully', result));
});

const createEnquiryNote = asyncHandler(async (req, res) => {
  const result = await enquiryService.createEnquiryNote(req.params.publicId, req.body, req);
  return res.status(201).json(ApiResponse.success('Enquiry note created successfully', result));
});

const updateEnquiryNote = asyncHandler(async (req, res) => {
  const result = await enquiryService.updateEnquiryNote(
    req.params.publicId,
    req.params.notePublicId,
    req.body,
    req
  );
  return res.status(200).json(ApiResponse.success('Enquiry note updated successfully', result));
});

const deleteEnquiryNote = asyncHandler(async (req, res) => {
  const result = await enquiryService.deleteEnquiryNote(
    req.params.publicId,
    req.params.notePublicId,
    req
  );
  return res.status(200).json(ApiResponse.success(result.message));
});

const getEnquiryFollowUps = asyncHandler(async (req, res) => {
  const result = await enquiryService.getEnquiryFollowUps(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Enquiry follow-ups retrieved successfully', result));
});

const createEnquiryFollowUp = asyncHandler(async (req, res) => {
  const result = await enquiryService.createEnquiryFollowUp(req.params.publicId, req.body, req);
  return res.status(201).json(ApiResponse.success('Enquiry follow-up created successfully', result));
});

const updateEnquiryFollowUp = asyncHandler(async (req, res) => {
  const result = await enquiryService.updateEnquiryFollowUp(
    req.params.publicId,
    req.params.followUpPublicId,
    req.body,
    req
  );
  return res.status(200).json(ApiResponse.success('Enquiry follow-up updated successfully', result));
});

const deleteEnquiryFollowUp = asyncHandler(async (req, res) => {
  const result = await enquiryService.deleteEnquiryFollowUp(
    req.params.publicId,
    req.params.followUpPublicId,
    req
  );
  return res.status(200).json(ApiResponse.success(result.message));
});

module.exports = {
  createEnquiry,
  getAdminEnquiries,
  getAdminEnquiryByPublicId,
  updateAdminEnquiry,
  updateEnquiryStatus,
  getEnquiryNotes,
  createEnquiryNote,
  updateEnquiryNote,
  deleteEnquiryNote,
  getEnquiryFollowUps,
  createEnquiryFollowUp,
  updateEnquiryFollowUp,
  deleteEnquiryFollowUp,
};
