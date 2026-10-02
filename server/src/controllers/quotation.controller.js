const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const quotationService = require('../services/quotation.service');

const getAdminQuotations = asyncHandler(async (req, res) => {
  const result = await quotationService.listQuotations(req.query);
  return res.status(200).json(ApiResponse.success('Quotations retrieved successfully', result));
});

const getAdminQuotationByPublicId = asyncHandler(async (req, res) => {
  const quotation = await quotationService.getQuotationByPublicId(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Quotation retrieved successfully', { quotation }));
});

const createAdminQuotation = asyncHandler(async (req, res) => {
  const quotation = await quotationService.createQuotation(req.body, req);
  return res.status(201).json(ApiResponse.success('Quotation created successfully', { quotation }));
});

const updateAdminQuotation = asyncHandler(async (req, res) => {
  const quotation = await quotationService.updateQuotation(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('Quotation updated successfully', { quotation }));
});

const updateQuotationStatus = asyncHandler(async (req, res) => {
  const quotation = await quotationService.updateQuotationStatus(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('Quotation status updated successfully', { quotation }));
});

const deleteAdminQuotation = asyncHandler(async (req, res) => {
  const result = await quotationService.deleteQuotation(req.params.publicId, req);
  return res.status(200).json(ApiResponse.success(result.message));
});

const addQuotationItem = asyncHandler(async (req, res) => {
  const quotation = await quotationService.addQuotationItem(req.params.publicId, req.body, req);
  return res.status(201).json(ApiResponse.success('Quotation item added successfully', { quotation }));
});

const updateQuotationItem = asyncHandler(async (req, res) => {
  const quotation = await quotationService.updateQuotationItem(
    req.params.publicId,
    req.params.itemPublicId,
    req.body,
    req
  );
  return res.status(200).json(ApiResponse.success('Quotation item updated successfully', { quotation }));
});

const deleteQuotationItem = asyncHandler(async (req, res) => {
  const quotation = await quotationService.deleteQuotationItem(
    req.params.publicId,
    req.params.itemPublicId,
    req
  );
  return res.status(200).json(ApiResponse.success('Quotation item deleted successfully', { quotation }));
});

module.exports = {
  getAdminQuotations,
  getAdminQuotationByPublicId,
  createAdminQuotation,
  updateAdminQuotation,
  updateQuotationStatus,
  deleteAdminQuotation,
  addQuotationItem,
  updateQuotationItem,
  deleteQuotationItem,
};
