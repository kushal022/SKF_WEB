const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const notificationService = require('../services/notification.service');

const getAdminNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(req.query, req.user);
  return res.status(200).json(ApiResponse.success('Notifications retrieved successfully', result));
});

const getAdminNotificationByPublicId = asyncHandler(async (req, res) => {
  const notification = await notificationService.getNotificationByPublicId(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Notification retrieved successfully', { notification }));
});

const createAdminNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification(req.body);
  return res.status(201).json(ApiResponse.success('Notification created successfully', { notification }));
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.publicId, req.user);
  return res.status(200).json(ApiResponse.success('Notification marked as read', { notification }));
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user);
  return res.status(200).json(ApiResponse.success(result.message, { updated_count: result.updated_count }));
});

const deleteAdminNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(req.params.publicId, req.user);
  return res.status(200).json(ApiResponse.success(result.message));
});

module.exports = {
  getAdminNotifications,
  getAdminNotificationByPublicId,
  createAdminNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAdminNotification,
};
