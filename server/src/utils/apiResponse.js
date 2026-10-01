/**
 * Standard API Response Utilities
 * Formats standardized JSON response envelopes across the application.
 */
class ApiResponse {
  /**
   * Generates a standardized success response object
   *
   * @param {string} [message='Request successful'] - Success message
   * @param {any} [data={}] - Response payload
   * @param {object} [meta] - Optional pagination or metadata
   * @returns {object} Formatted success response
   */
  static success(message = 'Request successful', data = {}, meta = undefined) {
    const response = {
      success: true,
      message,
      data,
    };

    if (meta !== undefined) {
      response.meta = meta;
    }

    return response;
  }

  /**
   * Generates a standardized error response object
   *
   * @param {string} [message='An error occurred'] - Error message
   * @param {string} [code] - Application machine-readable error code
   * @param {any} [details] - Detailed error information
   * @param {string} [stack] - Stack trace (never exposed in production)
   * @returns {object} Formatted error response
   */
  static error(message = 'An error occurred', code = undefined, details = undefined, stack = undefined) {
    const response = {
      success: false,
      message,
    };

    if (code !== undefined) {
      response.code = code;
    }

    if (details !== undefined) {
      response.details = details;
    }

    if (stack !== undefined && process.env.NODE_ENV !== 'production') {
      response.stack = stack;
    }

    return response;
  }
}

module.exports = ApiResponse;
