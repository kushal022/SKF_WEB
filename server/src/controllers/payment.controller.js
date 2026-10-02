const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const paymentService = require('../services/payment.service');

const getAdminPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.listPayments(req.query);
  return res.status(200).json(ApiResponse.success('Payments retrieved successfully', result));
});

const getAdminPaymentByPublicId = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentByPublicId(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Payment retrieved successfully', { payment }));
});

const createAdminPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.createPayment(req.body, req);
  return res.status(201).json(ApiResponse.success('Payment created successfully', { payment }));
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
  const payment = await paymentService.updatePaymentStatus(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('Payment status updated successfully', { payment }));
});

const updateAdminPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.updatePayment(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('Payment updated successfully', { payment }));
});

module.exports = {
  getAdminPayments,
  getAdminPaymentByPublicId,
  createAdminPayment,
  updatePaymentStatus,
  updateAdminPayment,
};
