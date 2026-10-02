const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const settingsService = require('../services/settings.service');

/**
 * Get current website settings (Admin)
 * GET /api/v1/admin/settings
 */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getWebsiteSettings();
  return res.status(200).json(
    ApiResponse.success('Website settings fetched successfully', { settings })
  );
});

/**
 * Update website settings (Admin)
 * PATCH /api/v1/admin/settings
 */
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateWebsiteSettings(req.body, req);
  return res.status(200).json(
    ApiResponse.success('Website settings updated successfully', { settings })
  );
});

/**
 * Get public website settings (Public)
 * GET /api/v1/settings/public
 */
const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getPublicWebsiteSettings();
  return res.status(200).json(
    ApiResponse.success('Public website settings fetched successfully', { settings })
  );
});

module.exports = {
  getSettings,
  updateSettings,
  getPublicSettings,
};
