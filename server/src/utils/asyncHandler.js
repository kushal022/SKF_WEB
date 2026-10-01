/**
 * Wraps an async Express route handler or middleware to catch rejected promises
 * and pass errors to Express's next() error handling pipeline.
 *
 * @param {Function} fn - Async controller function (req, res, next) => Promise<any>
 * @returns {Function} Express middleware handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
