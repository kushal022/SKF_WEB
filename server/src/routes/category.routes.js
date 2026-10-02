const express = require('express');
const categoryController = require('../controllers/category.controller');
const validate = require('../middleware/validate.middleware');
const { publicIdParamSchema } = require('../validators/theme.validator');

const router = express.Router();

// GET /api/v1/categories
router.get('/', categoryController.getPublicCategories);

// GET /api/v1/categories/:publicId
router.get('/:publicId', validate(publicIdParamSchema, 'params'), categoryController.getPublicCategoryByPublicId);

module.exports = router;
