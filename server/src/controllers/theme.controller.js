const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const themeService = require('../services/theme.service');

/**
 * List themes (Admin)
 * GET /api/v1/admin/theme
 */
const getThemes = asyncHandler(async (req, res) => {
  const themes = await themeService.getThemes();
  return res.status(200).json(
    ApiResponse.success('Themes fetched successfully', { themes })
  );
});

/**
 * Get theme by publicId (Admin)
 * GET /api/v1/admin/theme/:publicId
 */
const getThemeByPublicId = asyncHandler(async (req, res) => {
  const theme = await themeService.getThemeByPublicId(req.params.publicId);
  return res.status(200).json(
    ApiResponse.success('Theme fetched successfully', { theme })
  );
});

/**
 * Create theme (Admin)
 * POST /api/v1/admin/theme
 */
const createTheme = asyncHandler(async (req, res) => {
  const theme = await themeService.createTheme(req.body, req);
  return res.status(201).json(
    ApiResponse.success('Theme created successfully', { theme })
  );
});

/**
 * Update theme (Admin)
 * PATCH /api/v1/admin/theme/:publicId
 */
const updateTheme = asyncHandler(async (req, res) => {
  const theme = await themeService.updateTheme(req.params.publicId, req.body, req);
  return res.status(200).json(
    ApiResponse.success('Theme updated successfully', { theme })
  );
});

/**
 * Publish theme (Admin)
 * POST /api/v1/admin/theme/:publicId/publish
 */
const publishTheme = asyncHandler(async (req, res) => {
  const theme = await themeService.publishTheme(req.params.publicId, req);
  return res.status(200).json(
    ApiResponse.success('Theme published successfully', { theme })
  );
});

/**
 * Get active theme for public frontend
 * GET /api/v1/theme/public
 */
const getPublicTheme = asyncHandler(async (req, res) => {
  const theme = await themeService.getPublicActiveTheme();
  return res.status(200).json(
    ApiResponse.success('Active theme fetched successfully', { theme })
  );
});

/**
 * List theme presets (Admin)
 * GET /api/v1/admin/theme-presets
 */
const getPresets = asyncHandler(async (req, res) => {
  const presets = await themeService.getThemePresets();
  return res.status(200).json(
    ApiResponse.success('Theme presets fetched successfully', { presets })
  );
});

/**
 * Get theme preset by publicId (Admin)
 * GET /api/v1/admin/theme-presets/:publicId
 */
const getPresetByPublicId = asyncHandler(async (req, res) => {
  const preset = await themeService.getThemePresetByPublicId(req.params.publicId);
  return res.status(200).json(
    ApiResponse.success('Theme preset fetched successfully', { preset })
  );
});

/**
 * Create theme preset (Admin)
 * POST /api/v1/admin/theme-presets
 */
const createPreset = asyncHandler(async (req, res) => {
  const preset = await themeService.createThemePreset(req.body, req);
  return res.status(201).json(
    ApiResponse.success('Theme preset created successfully', { preset })
  );
});

/**
 * Update theme preset (Admin)
 * PATCH /api/v1/admin/theme-presets/:publicId
 */
const updatePreset = asyncHandler(async (req, res) => {
  const preset = await themeService.updateThemePreset(req.params.publicId, req.body, req);
  return res.status(200).json(
    ApiResponse.success('Theme preset updated successfully', { preset })
  );
});

/**
 * Apply theme preset (Admin)
 * POST /api/v1/admin/theme-presets/:publicId/apply
 */
const applyPreset = asyncHandler(async (req, res) => {
  const theme = await themeService.applyThemePreset(req.params.publicId, req.body, req);
  return res.status(200).json(
    ApiResponse.success('Theme preset applied successfully', { theme })
  );
});

module.exports = {
  getThemes,
  getThemeByPublicId,
  createTheme,
  updateTheme,
  publishTheme,
  getPublicTheme,
  getPresets,
  getPresetByPublicId,
  createPreset,
  updatePreset,
  applyPreset,
};
