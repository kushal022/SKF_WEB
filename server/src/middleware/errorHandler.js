const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const {
  ValidationError: ObjectionValidationError,
  NotFoundError: ObjectionNotFoundError,
  DBError: ObjectionDBError,
  UniqueViolationError,
  NotNullViolationError,
  ForeignKeyViolationError,
  CheckViolationError,
  DataError: ObjectionDataError,
} = require('objection');

/**
 * Global Error Handling Middleware
 * Catches all errors from routes, middleware, and async controllers.
 * Sanitizes errors in production to prevent leaking sensitive internal details.
 */
const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let details = err.details || undefined;
  let stack = isProduction ? undefined : err.stack;

  // 1. ApiError (custom operational errors)
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode || 'API_ERROR';
    details = err.details;
  }

  // 2. Body Parser / express.json SyntaxError (malformed JSON)
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body';
    errorCode = 'INVALID_JSON_BODY';
    details = undefined;
  }

  // 3. Zod Validation Errors
  else if (err.name === 'ZodError' || Array.isArray(err.issues)) {
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
    const issues = err.issues || err.errors || [];
    details = issues.map((issue) => ({
      field: Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path || ''),
      message: issue.message,
    }));
  }

  // 4. Objection.js Validation Errors
  else if (err instanceof ObjectionValidationError || err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
    details = err.data || err.details;
  }

  // 5. Objection.js Not Found Errors
  else if (err instanceof ObjectionNotFoundError || err.name === 'NotFoundError') {
    statusCode = 404;
    message = err.message || 'Resource not found';
    errorCode = 'RESOURCE_NOT_FOUND';
    details = undefined;
  }

  // 6. Objection.js Unique Violation Error (duplicate record)
  else if (err instanceof UniqueViolationError || err.name === 'UniqueViolationError') {
    statusCode = 409;
    message = 'A record with this unique identifier already exists';
    errorCode = 'DUPLICATE_ENTRY';
    details = isProduction
      ? undefined
      : { columns: err.columns, table: err.table, constraint: err.constraint };
  }

  // 7. Objection.js Not Null Violation Error
  else if (err instanceof NotNullViolationError || err.name === 'NotNullViolationError') {
    statusCode = 400;
    message = isProduction
      ? 'A required field is missing'
      : `Missing required field: ${err.column} on ${err.table}`;
    errorCode = 'NOT_NULL_VIOLATION';
    details = isProduction ? undefined : { column: err.column, table: err.table };
  }

  // 8. Objection.js Foreign Key Violation Error
  else if (err instanceof ForeignKeyViolationError || err.name === 'ForeignKeyViolationError') {
    statusCode = 409;
    message = 'Referenced related record does not exist or constraint violation';
    errorCode = 'FOREIGN_KEY_VIOLATION';
    details = isProduction ? undefined : { table: err.table, constraint: err.constraint };
  }

  // 9. Objection.js Check / Data Errors
  else if (
    err instanceof CheckViolationError ||
    err.name === 'CheckViolationError' ||
    err instanceof ObjectionDataError ||
    err.name === 'DataError'
  ) {
    statusCode = 400;
    message = 'Invalid data submitted for database operation';
    errorCode = 'INVALID_DATA';
    details = isProduction ? undefined : err.message;
  }

  // 10. Native Database / Knex / MySQL Driver Errors
  else if (err.code && typeof err.code === 'string') {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        statusCode = 409;
        message = 'A duplicate entry already exists';
        errorCode = 'DUPLICATE_ENTRY';
        details = undefined;
        break;
      case 'ER_NO_REFERENCED_ROW':
      case 'ER_NO_REFERENCED_ROW_2':
        statusCode = 409;
        message = 'Referenced entity does not exist';
        errorCode = 'FOREIGN_KEY_VIOLATION';
        details = undefined;
        break;
      case 'ER_ROW_IS_REFERENCED':
      case 'ER_ROW_IS_REFERENCED_2':
        statusCode = 409;
        message = 'Cannot delete or update entity because it is referenced by other records';
        errorCode = 'REFERENCE_IN_USE';
        details = undefined;
        break;
      case 'ECONNREFUSED':
      case 'ETIMEDOUT':
      case 'PROTOCOL_CONNECTION_LOST':
        statusCode = 503;
        message = 'Database service is currently unavailable';
        errorCode = 'DATABASE_UNAVAILABLE';
        details = undefined;
        break;
      default:
        if (err instanceof ObjectionDBError || err.sql || err.sqlState) {
          statusCode = 500;
          message = isProduction ? 'Internal database error' : err.message;
          errorCode = 'DATABASE_ERROR';
          details = undefined;
        }
        break;
    }
  }

  // 11. CORS Block Error
  else if (err.message && err.message.toLowerCase().includes('cors')) {
    statusCode = 403;
    message = isProduction ? 'Cross-Origin Request Blocked' : err.message;
    errorCode = 'CORS_FORBIDDEN';
    details = undefined;
  }

  // 12. Generic / Unknown Server Errors (HTTP 500)
  else if (statusCode >= 500) {
    message = isProduction ? 'Internal server error' : (err.message || 'Internal server error');
    errorCode = errorCode || 'INTERNAL_SERVER_ERROR';
    details = undefined;
  }

  // Log internal errors to console for developer visibility
  if (!isProduction && statusCode >= 500) {
    console.error(`[Server Error] ${req.method} ${req.originalUrl || req.url}:`, err);
  }

  // Sanitize for production: never expose stack traces, SQL, or internal details
  if (isProduction) {
    stack = undefined;
  }

  res.status(statusCode).json(ApiResponse.error(message, errorCode, details, stack));
};

module.exports = errorHandler;
