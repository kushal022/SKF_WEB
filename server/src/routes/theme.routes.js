const express = require('express');
const themeController = require('../controllers/theme.controller');

const router = express.Router();

// GET /api/v1/theme/public
router.get('/public', themeController.getPublicTheme);

module.exports = router;
