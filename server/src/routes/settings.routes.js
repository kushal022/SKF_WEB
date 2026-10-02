const express = require('express');
const settingsController = require('../controllers/settings.controller');

const router = express.Router();

// GET /api/v1/settings/public
router.get('/public', settingsController.getPublicSettings);

module.exports = router;
