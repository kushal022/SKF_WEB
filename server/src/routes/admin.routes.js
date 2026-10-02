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
const enquiryController = require('../controllers/enquiry.controller');
const customRequestController = require('../controllers/customRequest.controller');
const estimatorController = require('../controllers/estimator.controller');
const b2bController = require('../controllers/b2b.controller');
const galleryController = require('../controllers/gallery.controller');
const reviewController = require('../controllers/review.controller');

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
const {
  adminUpdateEnquirySchema,
  updateEnquiryStatusSchema,
  createEnquiryNoteSchema,
  updateEnquiryNoteSchema,
  createFollowUpSchema,
  updateFollowUpSchema,
  enquiryParamSchema,
  enquiryAndNoteParamSchema,
  enquiryAndFollowUpParamSchema,
} = require('../validators/enquiry.validator');
const {
  updateCustomRequestSchema,
  updateCustomRequestStatusSchema,
  createCustomRequestImageSchema,
  updateCustomRequestImageSchema,
  customRequestParamSchema,
  customRequestAndImageParamSchema,
} = require('../validators/customRequest.validator');
const {
  createEstimatorRuleSchema,
  updateEstimatorRuleSchema,
  estimatorParamSchema,
} = require('../validators/estimator.validator');
const {
  updateB2BAccountSchema,
  updateB2BAccountStatusSchema,
  createB2BDocumentSchema,
  updateB2BDocumentSchema,
  updateB2BDocumentStatusSchema,
  createB2BPricingRuleSchema,
  updateB2BPricingRuleSchema,
  b2bAccountParamSchema,
  b2bAccountAndDocParamSchema,
  b2bPricingRuleParamSchema,
} = require('../validators/b2b.validator');
const {
  createGallerySchema,
  updateGallerySchema,
  createGalleryImageSchema,
  updateGalleryImageSchema,
  galleryParamSchema,
  galleryAndImageParamSchema,
} = require('../validators/gallery.validator');
const {
  updateReviewSchema,
  updateReviewStatusSchema,
  setReviewFeaturedSchema,
  reviewParamSchema,
} = require('../validators/review.validator');

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

// ==================== ENQUIRIES ====================
router.get('/enquiries', enquiryController.getAdminEnquiries);
router.get(
  '/enquiries/:publicId',
  validate(enquiryParamSchema, 'params'),
  enquiryController.getAdminEnquiryByPublicId
);
router.patch(
  '/enquiries/:publicId',
  validate(enquiryParamSchema, 'params'),
  validate(adminUpdateEnquirySchema),
  enquiryController.updateAdminEnquiry
);
router.post(
  '/enquiries/:publicId/status',
  validate(enquiryParamSchema, 'params'),
  validate(updateEnquiryStatusSchema),
  enquiryController.updateEnquiryStatus
);

// Enquiry Notes
router.get(
  '/enquiries/:publicId/notes',
  validate(enquiryParamSchema, 'params'),
  enquiryController.getEnquiryNotes
);
router.post(
  '/enquiries/:publicId/notes',
  validate(enquiryParamSchema, 'params'),
  validate(createEnquiryNoteSchema),
  enquiryController.createEnquiryNote
);
router.patch(
  '/enquiries/:publicId/notes/:notePublicId',
  validate(enquiryAndNoteParamSchema, 'params'),
  validate(updateEnquiryNoteSchema),
  enquiryController.updateEnquiryNote
);
router.delete(
  '/enquiries/:publicId/notes/:notePublicId',
  validate(enquiryAndNoteParamSchema, 'params'),
  enquiryController.deleteEnquiryNote
);

// Enquiry Follow-Ups
router.get(
  '/enquiries/:publicId/follow-ups',
  validate(enquiryParamSchema, 'params'),
  enquiryController.getEnquiryFollowUps
);
router.post(
  '/enquiries/:publicId/follow-ups',
  validate(enquiryParamSchema, 'params'),
  validate(createFollowUpSchema),
  enquiryController.createEnquiryFollowUp
);
router.patch(
  '/enquiries/:publicId/follow-ups/:followUpPublicId',
  validate(enquiryAndFollowUpParamSchema, 'params'),
  validate(updateFollowUpSchema),
  enquiryController.updateEnquiryFollowUp
);
router.delete(
  '/enquiries/:publicId/follow-ups/:followUpPublicId',
  validate(enquiryAndFollowUpParamSchema, 'params'),
  enquiryController.deleteEnquiryFollowUp
);

// ==================== CUSTOM REQUESTS ====================
router.get('/custom-requests', customRequestController.getAdminCustomRequests);
router.get(
  '/custom-requests/:publicId',
  validate(customRequestParamSchema, 'params'),
  customRequestController.getAdminCustomRequestByPublicId
);
router.patch(
  '/custom-requests/:publicId',
  validate(customRequestParamSchema, 'params'),
  validate(updateCustomRequestSchema),
  customRequestController.updateAdminCustomRequest
);
router.post(
  '/custom-requests/:publicId/status',
  validate(customRequestParamSchema, 'params'),
  validate(updateCustomRequestStatusSchema),
  customRequestController.updateCustomRequestStatus
);

// Custom Request Images
router.get(
  '/custom-requests/:publicId/images',
  validate(customRequestParamSchema, 'params'),
  customRequestController.getCustomRequestImages
);
router.post(
  '/custom-requests/:publicId/images',
  validate(customRequestParamSchema, 'params'),
  validate(createCustomRequestImageSchema),
  customRequestController.addCustomRequestImage
);
router.patch(
  '/custom-requests/:publicId/images/:imagePublicId',
  validate(customRequestAndImageParamSchema, 'params'),
  validate(updateCustomRequestImageSchema),
  customRequestController.updateCustomRequestImage
);
router.delete(
  '/custom-requests/:publicId/images/:imagePublicId',
  validate(customRequestAndImageParamSchema, 'params'),
  customRequestController.deleteCustomRequestImage
);

// ==================== ESTIMATOR RULES ====================
router.get('/estimator-rules', estimatorController.getAdminEstimatorRules);
router.get(
  '/estimator-rules/:publicId',
  validate(estimatorParamSchema, 'params'),
  estimatorController.getAdminEstimatorRuleByPublicId
);
router.post(
  '/estimator-rules',
  validate(createEstimatorRuleSchema),
  estimatorController.createAdminEstimatorRule
);
router.patch(
  '/estimator-rules/:publicId',
  validate(estimatorParamSchema, 'params'),
  validate(updateEstimatorRuleSchema),
  estimatorController.updateAdminEstimatorRule
);
router.delete(
  '/estimator-rules/:publicId',
  validate(estimatorParamSchema, 'params'),
  estimatorController.deleteAdminEstimatorRule
);

// ==================== B2B / TRADE PORTAL ====================
// B2B Accounts
router.get('/b2b/accounts', b2bController.getAdminB2BAccounts);
router.get(
  '/b2b/accounts/:publicId',
  validate(b2bAccountParamSchema, 'params'),
  b2bController.getAdminB2BAccountByPublicId
);
router.patch(
  '/b2b/accounts/:publicId',
  validate(b2bAccountParamSchema, 'params'),
  validate(updateB2BAccountSchema),
  b2bController.updateAdminB2BAccount
);
router.post(
  '/b2b/accounts/:publicId/status',
  validate(b2bAccountParamSchema, 'params'),
  validate(updateB2BAccountStatusSchema),
  b2bController.updateB2BAccountStatus
);

// B2B Documents
router.get(
  '/b2b/accounts/:publicId/documents',
  validate(b2bAccountParamSchema, 'params'),
  b2bController.getB2BDocuments
);
router.post(
  '/b2b/accounts/:publicId/documents',
  validate(b2bAccountParamSchema, 'params'),
  validate(createB2BDocumentSchema),
  b2bController.createB2BDocument
);
router.patch(
  '/b2b/accounts/:publicId/documents/:documentPublicId',
  validate(b2bAccountAndDocParamSchema, 'params'),
  validate(updateB2BDocumentSchema),
  b2bController.updateB2BDocument
);
router.delete(
  '/b2b/accounts/:publicId/documents/:documentPublicId',
  validate(b2bAccountAndDocParamSchema, 'params'),
  b2bController.deleteB2BDocument
);
router.post(
  '/b2b/accounts/:publicId/documents/:documentPublicId/status',
  validate(b2bAccountAndDocParamSchema, 'params'),
  validate(updateB2BDocumentStatusSchema),
  b2bController.updateB2BDocumentStatus
);

// B2B Pricing Rules
router.get('/b2b/pricing-rules', b2bController.getAdminPricingRules);
router.get(
  '/b2b/pricing-rules/:publicId',
  validate(b2bPricingRuleParamSchema, 'params'),
  b2bController.getAdminPricingRuleByPublicId
);
router.post(
  '/b2b/pricing-rules',
  validate(createB2BPricingRuleSchema),
  b2bController.createAdminPricingRule
);
router.patch(
  '/b2b/pricing-rules/:publicId',
  validate(b2bPricingRuleParamSchema, 'params'),
  validate(updateB2BPricingRuleSchema),
  b2bController.updateAdminPricingRule
);
router.delete(
  '/b2b/pricing-rules/:publicId',
  validate(b2bPricingRuleParamSchema, 'params'),
  b2bController.deleteAdminPricingRule
);

// ==================== GALLERIES ====================
router.get('/galleries', galleryController.getAdminGalleries);
router.get(
  '/galleries/:publicId',
  validate(galleryParamSchema, 'params'),
  galleryController.getAdminGalleryByPublicId
);
router.post(
  '/galleries',
  validate(createGallerySchema),
  galleryController.createAdminGallery
);
router.patch(
  '/galleries/:publicId',
  validate(galleryParamSchema, 'params'),
  validate(updateGallerySchema),
  galleryController.updateAdminGallery
);
router.delete(
  '/galleries/:publicId',
  validate(galleryParamSchema, 'params'),
  galleryController.deleteAdminGallery
);
router.post(
  '/galleries/:publicId/publish',
  validate(galleryParamSchema, 'params'),
  galleryController.publishAdminGallery
);
router.post(
  '/galleries/:publicId/archive',
  validate(galleryParamSchema, 'params'),
  galleryController.archiveAdminGallery
);

// Gallery Images
router.get(
  '/galleries/:publicId/images',
  validate(galleryParamSchema, 'params'),
  galleryController.getGalleryImages
);
router.post(
  '/galleries/:publicId/images',
  validate(galleryParamSchema, 'params'),
  validate(createGalleryImageSchema),
  galleryController.addGalleryImage
);
router.patch(
  '/galleries/:publicId/images/:imagePublicId',
  validate(galleryAndImageParamSchema, 'params'),
  validate(updateGalleryImageSchema),
  galleryController.updateGalleryImage
);
router.delete(
  '/galleries/:publicId/images/:imagePublicId',
  validate(galleryAndImageParamSchema, 'params'),
  galleryController.deleteGalleryImage
);

// ==================== REVIEWS ====================
router.get('/reviews', reviewController.getAdminReviews);
router.get(
  '/reviews/:publicId',
  validate(reviewParamSchema, 'params'),
  reviewController.getAdminReviewByPublicId
);
router.patch(
  '/reviews/:publicId',
  validate(reviewParamSchema, 'params'),
  validate(updateReviewSchema),
  reviewController.updateAdminReview
);
router.post(
  '/reviews/:publicId/status',
  validate(reviewParamSchema, 'params'),
  validate(updateReviewStatusSchema),
  reviewController.updateReviewStatus
);
router.post(
  '/reviews/:publicId/featured',
  validate(reviewParamSchema, 'params'),
  validate(setReviewFeaturedSchema),
  reviewController.setReviewFeatured
);
router.delete(
  '/reviews/:publicId',
  validate(reviewParamSchema, 'params'),
  reviewController.deleteAdminReview
);

module.exports = router;
