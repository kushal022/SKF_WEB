const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const orderService = require('../services/order.service');

const getAdminOrders = asyncHandler(async (req, res) => {
  const result = await orderService.listOrders(req.query);
  return res.status(200).json(ApiResponse.success('Orders retrieved successfully', result));
});

const getAdminOrderByPublicId = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderByPublicId(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Order retrieved successfully', { order }));
});

const createAdminOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body, req);
  return res.status(201).json(ApiResponse.success('Order created successfully', { order }));
});

const updateAdminOrder = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrder(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('Order updated successfully', { order }));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('Order status updated successfully', { order }));
});

const addOrderItem = asyncHandler(async (req, res) => {
  const order = await orderService.addOrderItem(req.params.publicId, req.body, req);
  return res.status(201).json(ApiResponse.success('Order item added successfully', { order }));
});

const updateOrderItem = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderItem(
    req.params.publicId,
    req.params.itemPublicId,
    req.body,
    req
  );
  return res.status(200).json(ApiResponse.success('Order item updated successfully', { order }));
});

const deleteOrderItem = asyncHandler(async (req, res) => {
  const order = await orderService.deleteOrderItem(
    req.params.publicId,
    req.params.itemPublicId,
    req
  );
  return res.status(200).json(ApiResponse.success('Order item deleted successfully', { order }));
});

module.exports = {
  getAdminOrders,
  getAdminOrderByPublicId,
  createAdminOrder,
  updateAdminOrder,
  updateOrderStatus,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
};
