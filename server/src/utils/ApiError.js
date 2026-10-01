/**
 * Custom application error class for standard operational HTTP errors.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {string} [errorCode] - Application-specific machine-readable error code
   * @param {any} [details] - Detailed error info or validation errors
   */
  constructor(statusCode, message, errorCode = undefined, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode || 500;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', errorCode = 'BAD_REQUEST', details = undefined) {
    return new ApiError(400, message, errorCode, details);
  }

  static unauthorized(message = 'Unauthorized', errorCode = 'UNAUTHORIZED', details = undefined) {
    return new ApiError(401, message, errorCode, details);
  }

  static forbidden(message = 'Forbidden', errorCode = 'FORBIDDEN', details = undefined) {
    return new ApiError(403, message, errorCode, details);
  }

  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND', details = undefined) {
    return new ApiError(404, message, errorCode, details);
  }

  static conflict(message = 'Conflict', errorCode = 'CONFLICT', details = undefined) {
    return new ApiError(409, message, errorCode, details);
  }

  static unprocessableEntity(message = 'Unprocessable Entity', errorCode = 'UNPROCESSABLE_ENTITY', details = undefined) {
    return new ApiError(422, message, errorCode, details);
  }

  static internal(message = 'Internal Server Error', errorCode = 'INTERNAL_SERVER_ERROR', details = undefined) {
    return new ApiError(500, message, errorCode, details);
  }
}

module.exports = ApiError;
