const ApiResponse = require('../utils/apiResponse');

/**
 * 404 Not Found Middleware
 * Handles unknown routes with standard API response format.
 */
const notFound = (req, res, next) => {
  res.status(404).json(ApiResponse.error('Route not found'));
};

module.exports = notFound;
