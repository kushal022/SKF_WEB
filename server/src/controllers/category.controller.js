const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const categoryService = require('../services/category.service');

/**
 * Public: List active categories
 * GET /api/v1/categories
 */
const getPublicCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.getPublicCategories(req.query);
  return res.status(200).json(
    ApiResponse.success('Categories fetched successfully', result)
  );
});

/**
 * Public: Get active category by publicId
 * GET /api/v1/categories/:publicId
 */
const getPublicCategoryByPublicId = asyncHandler(async (req, res) => {
  const category = await categoryService.getPublicCategoryByPublicId(req.params.publicId);
  return res.status(200).json(
    ApiResponse.success('Category fetched successfully', { category })
  );
});

/**
 * Admin: List categories
 * GET /api/v1/admin/categories
 */
const getAdminCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.getAdminCategories(req.query);
  return res.status(200).json(
    ApiResponse.success('Categories fetched successfully', result)
  );
});

/**
 * Admin: Get category by publicId
 * GET /api/v1/admin/categories/:publicId
 */
const getCategoryByPublicId = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryByPublicId(req.params.publicId);
  return res.status(200).json(
    ApiResponse.success('Category fetched successfully', { category })
  );
});

/**
 * Admin: Create category
 * POST /api/v1/admin/categories
 */
const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body, req);
  return res.status(201).json(
    ApiResponse.success('Category created successfully', { category })
  );
});

/**
 * Admin: Update category
 * PATCH /api/v1/admin/categories/:publicId
 */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.publicId, req.body, req);
  return res.status(200).json(
    ApiResponse.success('Category updated successfully', { category })
  );
});

/**
 * Admin: Delete category
 * DELETE /api/v1/admin/categories/:publicId
 */
const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.publicId, req);
  return res.status(200).json(
    ApiResponse.success('Category deleted successfully', {})
  );
});

module.exports = {
  getPublicCategories,
  getPublicCategoryByPublicId,
  getAdminCategories,
  getCategoryByPublicId,
  createCategory,
  updateCategory,
  deleteCategory,
};
