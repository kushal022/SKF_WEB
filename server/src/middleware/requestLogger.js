/**
 * Request Logger Middleware
 * Logs HTTP method, path, status code, and response time.
 * Redacts and omits sensitive credentials, tokens, and payloads.
 */
const requestLogger = (req, res, next) => {
  const startTime = process.hrtime();

  res.on('finish', () => {
    // Suppress logs during tests to keep stdout readable
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    const method = req.method;

    // Use pathname only to prevent logging sensitive query parameters
    let path = req.originalUrl || req.url;
    try {
      const parsedUrl = new URL(path, 'http://localhost');
      path = parsedUrl.pathname;
    } catch (_) {
      // Fallback to raw url if parsing fails
    }

    const statusCode = res.statusCode;
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] ${method} ${path} ${statusCode} - ${durationMs}ms`);
  });

  next();
};

module.exports = requestLogger;
