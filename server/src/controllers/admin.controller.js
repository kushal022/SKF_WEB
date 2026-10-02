const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');

/**
 * Get profile of currently authenticated admin
 * GET /api/v1/admin/me
 */
const getMe = asyncHandler(async (req, res) => {
  const admin = await adminService.getAdminProfile(req.user.id);

  return res.status(200).json(
    ApiResponse.success('Admin profile fetched successfully', {
      user: admin,
    })
  );
});

/**
 * Get system-wide dashboard summary metrics
 * GET /api/v1/admin/dashboard/summary
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await adminService.getDashboardSummary();

  return res.status(200).json(
    ApiResponse.success('Admin dashboard summary fetched successfully', summary)
  );
});

module.exports = {
  getMe,
  getDashboardSummary,
};
