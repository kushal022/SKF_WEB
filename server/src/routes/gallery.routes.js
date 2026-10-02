const express = require('express');
const validate = require('../middleware/validate.middleware');
const galleryController = require('../controllers/gallery.controller');
const { galleryParamSchema } = require('../validators/gallery.validator');

const router = express.Router();

/**
 * Public Galleries List (published only)
 * GET /api/v1/galleries
 */
router.get('/', galleryController.getPublicGalleries);

/**
 * Public Gallery Detail (published only)
 * GET /api/v1/galleries/:publicId
 */
router.get(
  '/:publicId',
  validate(galleryParamSchema, 'params'),
  galleryController.getPublicGalleryByPublicId
);

module.exports = router;
