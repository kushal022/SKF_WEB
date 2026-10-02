const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// Controllers
const adminController = require('../controllers/admin.controller');
const settingsController = require('../controllers/settings.controller');
const themeController = require('../controllers/theme.controller');
const categoryController = require('../controllers/category.controller');
const productController = require('../controllers/product.controller');
const productMediaController = require('../controllers/productMedia.controller');

// Validators
const { updateSettingsSchema } = require('../validators/settings.validator');
const {
  createThemeSchema,
  updateThemeSchema,
  createThemePresetSchema,
  updateThemePresetSchema,
  applyThemePresetSchema,
  publicIdParamSchema,
} = require('../validators/theme.validator');
const {
  createCategorySchema,
  updateCategorySchema,
} = require('../validators/category.validator');
const {
  createProductSchema,
  updateProductSchema,
} = require('../validators/product.validator');
const {
  createImageSchema,
  updateImageSchema,
  reorderImagesSchema,
  createVideoSchema,
  updateVideoSchema,
  createSpecSchema,
  updateSpecSchema,
  productAndMediaParamSchema,
} = require('../validators/productMedia.validator');

const router = express.Router();

// Enforce authentication and administrative role authorization across all admin routes
router.use(authenticate, authorizeRoles('admin'));

// ==================== ADMIN CORE ====================
router.get('/me', adminController.getMe);
router.get('/dashboard/summary', adminController.getDashboardSummary);

// ==================== WEBSITE SETTINGS ====================
router.get('/settings', settingsController.getSettings);
router.patch('/settings', validate(updateSettingsSchema), settingsController.updateSettings);

// ==================== THEME SETTINGS ====================
router.get('/theme', themeController.getThemes);
router.get('/theme/:publicId', validate(publicIdParamSchema, 'params'), themeController.getThemeByPublicId);
router.post('/theme', validate(createThemeSchema), themeController.createTheme);
router.patch(
  '/theme/:publicId',
  validate(publicIdParamSchema, 'params'),
  validate(updateThemeSchema),
  themeController.updateTheme
);
router.post(
  '/theme/:publicId/publish',
  validate(publicIdParamSchema, 'params'),
  themeController.publishTheme
);

// ==================== THEME PRESETS ====================
router.get('/theme-presets', themeController.getPresets);
router.get(
  '/theme-presets/:publicId',
  validate(publicIdParamSchema, 'params'),
  themeController.getPresetByPublicId
);
router.post('/theme-presets', validate(createThemePresetSchema), themeController.createPreset);
router.patch(
  '/theme-presets/:publicId',
  validate(publicIdParamSchema, 'params'),
  validate(updateThemePresetSchema),
  themeController.updatePreset
);
router.post(
  '/theme-presets/:publicId/apply',
  validate(publicIdParamSchema, 'params'),
  validate(applyThemePresetSchema),
  themeController.applyPreset
);

// ==================== CATEGORIES ====================
router.get('/categories', categoryController.getAdminCategories);
router.get(
  '/categories/:publicId',
  validate(publicIdParamSchema, 'params'),
  categoryController.getCategoryByPublicId
);
router.post('/categories', validate(createCategorySchema), categoryController.createCategory);
router.patch(
  '/categories/:publicId',
  validate(publicIdParamSchema, 'params'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);
router.delete(
  '/categories/:publicId',
  validate(publicIdParamSchema, 'params'),
  categoryController.deleteCategory
);

// ==================== PRODUCTS ====================
router.get('/products', productController.getAdminProducts);
router.get(
  '/products/:publicId',
  validate(publicIdParamSchema, 'params'),
  productController.getAdminProductByPublicId
);
router.post('/products', validate(createProductSchema), productController.createProduct);
router.patch(
  '/products/:publicId',
  validate(publicIdParamSchema, 'params'),
  validate(updateProductSchema),
  productController.updateProduct
);
router.delete(
  '/products/:publicId',
  validate(publicIdParamSchema, 'params'),
  productController.deleteProduct
);
router.post(
  '/products/:publicId/publish',
  validate(publicIdParamSchema, 'params'),
  productController.publishProduct
);
router.post(
  '/products/:publicId/archive',
  validate(publicIdParamSchema, 'params'),
  productController.archiveProduct
);

// ==================== PRODUCT IMAGES ====================
router.get(
  '/products/:publicId/images',
  validate(publicIdParamSchema, 'params'),
  productMediaController.getProductImages
);
router.post(
  '/products/:publicId/images',
  validate(publicIdParamSchema, 'params'),
  validate(createImageSchema),
  productMediaController.addProductImage
);
router.patch(
  '/products/:publicId/images/reorder',
  validate(publicIdParamSchema, 'params'),
  validate(reorderImagesSchema),
  productMediaController.reorderProductImages
);
router.patch(
  '/products/:publicId/images/:imagePublicId',
  validate(productAndMediaParamSchema, 'params'),
  validate(updateImageSchema),
  productMediaController.updateProductImage
);
router.delete(
  '/products/:publicId/images/:imagePublicId',
  validate(productAndMediaParamSchema, 'params'),
  productMediaController.deleteProductImage
);
router.post(
  '/products/:publicId/images/:imagePublicId/primary',
  validate(productAndMediaParamSchema, 'params'),
  productMediaController.setPrimaryProductImage
);

// ==================== PRODUCT VIDEOS ====================
router.get(
  '/products/:publicId/videos',
  validate(publicIdParamSchema, 'params'),
  productMediaController.getProductVideos
);
router.post(
  '/products/:publicId/videos',
  validate(publicIdParamSchema, 'params'),
  validate(createVideoSchema),
  productMediaController.addProductVideo
);
router.patch(
  '/products/:publicId/videos/:videoPublicId',
  validate(productAndMediaParamSchema, 'params'),
  validate(updateVideoSchema),
  productMediaController.updateProductVideo
);
router.delete(
  '/products/:publicId/videos/:videoPublicId',
  validate(productAndMediaParamSchema, 'params'),
  productMediaController.deleteProductVideo
);

// ==================== PRODUCT SPECIFICATIONS ====================
router.get(
  '/products/:publicId/specs',
  validate(publicIdParamSchema, 'params'),
  productMediaController.getProductSpecs
);
router.post(
  '/products/:publicId/specs',
  validate(publicIdParamSchema, 'params'),
  validate(createSpecSchema),
  productMediaController.addProductSpec
);
router.patch(
  '/products/:publicId/specs/:specPublicId',
  validate(productAndMediaParamSchema, 'params'),
  validate(updateSpecSchema),
  productMediaController.updateProductSpec
);
router.delete(
  '/products/:publicId/specs/:specPublicId',
  validate(productAndMediaParamSchema, 'params'),
  productMediaController.deleteProductSpec
);

module.exports = router;
