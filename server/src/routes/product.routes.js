const express = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate.middleware');
const { publicIdParamSchema } = require('../validators/theme.validator');

const router = express.Router();

// GET /api/v1/products
router.get('/', productController.getPublicProducts);

// GET /api/v1/products/:publicId
router.get('/:publicId', validate(publicIdParamSchema, 'params'), productController.getPublicProductByPublicId);

module.exports = router;
