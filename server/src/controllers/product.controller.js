const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/product.service');

/**
 * Public: List published products
 * GET /api/v1/products
 */
const getPublicProducts = asyncHandler(async (req, res) => {
  const result = await productService.getPublicProducts(req.query);
  return res.status(200).json(
    ApiResponse.success('Products fetched successfully', result)
  );
});

/**
 * Public: Get published product details by publicId
 * GET /api/v1/products/:publicId
 */
const getPublicProductByPublicId = asyncHandler(async (req, res) => {
  const product = await productService.getPublicProductByPublicId(req.params.publicId);
  return res.status(200).json(
    ApiResponse.success('Product fetched successfully', { product })
  );
});

/**
 * Admin: List products
 * GET /api/v1/admin/products
 */
const getAdminProducts = asyncHandler(async (req, res) => {
  const result = await productService.getAdminProducts(req.query);
  return res.status(200).json(
    ApiResponse.success('Products fetched successfully', result)
  );
});

/**
 * Admin: Get product details by publicId
 * GET /api/v1/admin/products/:publicId
 */
const getAdminProductByPublicId = asyncHandler(async (req, res) => {
  const product = await productService.getAdminProductByPublicId(req.params.publicId);
  return res.status(200).json(
    ApiResponse.success('Product fetched successfully', { product })
  );
});

/**
 * Admin: Create product
 * POST /api/v1/admin/products
 */
const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req);
  return res.status(201).json(
    ApiResponse.success('Product created successfully', { product })
  );
});

/**
 * Admin: Update product
 * PATCH /api/v1/admin/products/:publicId
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.publicId, req.body, req);
  return res.status(200).json(
    ApiResponse.success('Product updated successfully', { product })
  );
});

/**
 * Admin: Delete product
 * DELETE /api/v1/admin/products/:publicId
 */
const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.publicId, req);
  return res.status(200).json(
    ApiResponse.success('Product deleted successfully', {})
  );
});

/**
 * Admin: Publish product
 * POST /api/v1/admin/products/:publicId/publish
 */
const publishProduct = asyncHandler(async (req, res) => {
  const product = await productService.publishProduct(req.params.publicId, req);
  return res.status(200).json(
    ApiResponse.success('Product published successfully', { product })
  );
});

/**
 * Admin: Archive product
 * POST /api/v1/admin/products/:publicId/archive
 */
const archiveProduct = asyncHandler(async (req, res) => {
  const product = await productService.archiveProduct(req.params.publicId, req);
  return res.status(200).json(
    ApiResponse.success('Product archived successfully', { product })
  );
});

module.exports = {
  getPublicProducts,
  getPublicProductByPublicId,
  getAdminProducts,
  getAdminProductByPublicId,
  createProduct,
  updateProduct,
  deleteProduct,
  publishProduct,
  archiveProduct,
};
