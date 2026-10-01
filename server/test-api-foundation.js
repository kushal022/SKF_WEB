const http = require('http');
const express = require('express');
const { z } = require('zod');
const { ValidationError: ObjectionValidationError } = require('objection');

const config = require('./src/config');
const app = require('./src/app');
const { knex } = require('./src/db');
const { testConnection } = require('./src/db/test-connection');
const ApiResponse = require('./src/utils/apiResponse');
const ApiError = require('./src/utils/ApiError');
const asyncHandler = require('./src/utils/asyncHandler');
const errorHandler = require('./src/middleware/errorHandler');

// Models for regression testing
const {
  User,
  Session,
  Product,
  Enquiry,
  Quotation,
  Order,
  Payment,
  Notification,
  AuditLog,
} = require('./src/models');

let testServer;
let baseUrl;

async function runTests() {
  console.log('====================================================');
  console.log('PHASE 2 - STEP 1: API FOUNDATION VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, errorDetails = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${errorDetails ? `(${errorDetails})` : ''}`);
      failed++;
    }
  }

  // 1. Database connection
  console.log('--- 1. Database Connection ---');
  const dbConnected = await testConnection();
  assert(dbConnected, 'Database connects successfully via testConnection()');

  // 2. Start HTTP server on dynamic port
  console.log('\n--- 2. Server Startup ---');
  await new Promise((resolve) => {
    testServer = app.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });
  assert(!!testServer && !!testServer.address().port, 'Server starts successfully');

  // 3. GET /api/v1/health
  console.log('\n--- 3. Health Endpoint ---');
  const healthRes = await fetch(`${baseUrl}/api/v1/health`);
  const healthJson = await healthRes.json();
  assert(healthRes.status === 200, 'GET /api/v1/health returns HTTP 200');
  assert(healthJson.success === true, 'Health check returns success: true');
  assert(healthJson.message === 'API is healthy', 'Health check message is "API is healthy"');
  assert(healthJson.data?.status === 'ok', 'Health check data.status is "ok"');
  assert(healthJson.data?.database === 'ok', 'Health check verifies database connectivity as "ok"');

  // 4. Unknown route 404
  console.log('\n--- 4. 404 Not Found Handling ---');
  const notFoundRes = await fetch(`${baseUrl}/api/v1/unknown-endpoint-xyz`);
  const notFoundJson = await notFoundRes.json();
  assert(notFoundRes.status === 404, 'Unknown API route returns HTTP 404');
  assert(notFoundJson.success === false, '404 returns success: false');
  assert(notFoundJson.message === 'Route not found', '404 message is "Route not found"');

  // 5. Standard ApiResponse formats
  console.log('\n--- 5. Standard API Response Structure ---');
  const successFormat = ApiResponse.success('Custom success', { id: 123 });
  assert(
    successFormat.success === true &&
      successFormat.message === 'Custom success' &&
      successFormat.data.id === 123,
    'ApiResponse.success formats correctly'
  );

  const listMetaFormat = ApiResponse.success(
    'Products fetched successfully',
    [],
    { page: 1, limit: 20, total: 100, totalPages: 5 }
  );
  assert(
    listMetaFormat.meta && listMetaFormat.meta.totalPages === 5,
    'ApiResponse.success supports meta pagination'
  );

  const errorFormat = ApiResponse.error('Sample error', 'ERR_CODE', { field: 'email' });
  assert(
    errorFormat.success === false &&
      errorFormat.message === 'Sample error' &&
      errorFormat.code === 'ERR_CODE' &&
      errorFormat.details.field === 'email',
    'ApiResponse.error formats correctly'
  );

  // 6. Test ApiError, AsyncHandler, and Error Handler in an Express route
  console.log('\n--- 6. ApiError, AsyncHandler & Global Error Handler ---');
  const testSubApp = express();
  testSubApp.use(express.json());

  testSubApp.get(
    '/test-api-error',
    asyncHandler(async (req, res) => {
      throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND', { productId: '999' });
    })
  );

  testSubApp.get(
    '/test-async-error',
    asyncHandler(async (req, res) => {
      throw new Error('Async unexpected crash');
    })
  );

  testSubApp.post(
    '/test-zod-error',
    asyncHandler(async (req, res) => {
      const schema = z.object({
        email: z.string().email(),
      });
      schema.parse(req.body);
      res.json({ ok: true });
    })
  );

  testSubApp.get(
    '/test-objection-error',
    asyncHandler(async (req, res) => {
      throw new ObjectionValidationError({
        type: 'ModelValidation',
        data: { name: [{ message: 'is required', keyword: 'required' }] },
      });
    })
  );

  testSubApp.use(errorHandler);

  let subServer;
  let subBaseUrl;
  await new Promise((resolve) => {
    subServer = testSubApp.listen(0, () => {
      subBaseUrl = `http://127.0.0.1:${subServer.address().port}`;
      resolve();
    });
  });

  // Test ApiError
  const apiErrRes = await fetch(`${subBaseUrl}/test-api-error`);
  const apiErrJson = await apiErrRes.json();
  assert(apiErrRes.status === 404, 'ApiError returns correct status code 404');
  assert(apiErrJson.success === false, 'ApiError returns success: false');
  assert(apiErrJson.message === 'Product not found', 'ApiError returns correct message');
  assert(apiErrJson.code === 'PRODUCT_NOT_FOUND', 'ApiError returns correct errorCode');
  assert(apiErrJson.details?.productId === '999', 'ApiError returns details payload');

  // Test Async Handler catching standard Error
  const asyncErrRes = await fetch(`${subBaseUrl}/test-async-error`);
  const asyncErrJson = await asyncErrRes.json();
  assert(asyncErrRes.status === 500, 'Async error caught and returns HTTP 500');
  assert(asyncErrJson.success === false, 'Async error returns success: false');
  assert(asyncErrJson.code === 'INTERNAL_SERVER_ERROR', 'Async error has INTERNAL_SERVER_ERROR code');

  // Test Zod error handling
  const zodErrRes = await fetch(`${subBaseUrl}/test-zod-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email' }),
  });
  const zodErrJson = await zodErrRes.json();
  assert(zodErrRes.status === 400, 'Zod validation error returns HTTP 400');
  assert(zodErrJson.code === 'VALIDATION_ERROR', 'Zod error code is VALIDATION_ERROR');
  assert(Array.isArray(zodErrJson.details) && zodErrJson.details[0].field === 'email', 'Zod error details parsed cleanly');

  // Test Objection validation error handling
  const objErrRes = await fetch(`${subBaseUrl}/test-objection-error`);
  const objErrJson = await objErrRes.json();
  assert(objErrRes.status === 400, 'Objection.js validation error returns HTTP 400');
  assert(objErrJson.code === 'VALIDATION_ERROR', 'Objection error code is VALIDATION_ERROR');
  assert(objErrJson.details?.name !== undefined, 'Objection error details parsed');

  // 7. Malformed JSON handling
  console.log('\n--- 7. Malformed JSON Body Handling ---');
  const malformedRes = await fetch(`${subBaseUrl}/test-zod-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"unclosed_json: true',
  });
  const malformedJson = await malformedRes.json();
  assert(malformedRes.status === 400, 'Malformed JSON returns HTTP 400');
  assert(malformedJson.success === false, 'Malformed JSON returns success: false');
  assert(malformedJson.code === 'INVALID_JSON_BODY', 'Malformed JSON returns INVALID_JSON_BODY code');

  // 8. CORS Headers
  console.log('\n--- 8. CORS Configuration ---');
  const corsRes = await fetch(`${baseUrl}/api/v1/health`, {
    headers: { Origin: 'http://localhost:3000' },
  });
  const allowOriginHeader = corsRes.headers.get('access-control-allow-origin');
  assert(
    allowOriginHeader === 'http://localhost:3000' || allowOriginHeader === '*',
    `CORS headers set appropriately for allowed origin (Got: ${allowOriginHeader})`
  );

  // 9. Production sanitization check (stack traces hidden)
  console.log('\n--- 9. Production Error Sanitization ---');
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  let reqMock = { method: 'GET', url: '/error' };
  let capturedStatus = 0;
  let capturedJson = null;
  let resMock = {
    status(s) {
      capturedStatus = s;
      return this;
    },
    json(j) {
      capturedJson = j;
      return this;
    },
  };

  const sensitiveError = new Error('Database password failed at D:\\secret\\file.js:123');
  sensitiveError.sql = 'SELECT * FROM users WHERE password="secret"';
  errorHandler(sensitiveError, reqMock, resMock, () => {});

  assert(capturedStatus === 500, 'Production 500 error returns HTTP 500');
  assert(capturedJson.stack === undefined, 'Production error hides stack trace completely');
  assert(!JSON.stringify(capturedJson).includes('D:\\secret'), 'Production error does not expose filesystem paths');
  assert(!JSON.stringify(capturedJson).includes('SELECT * FROM'), 'Production error does not expose SQL queries');

  process.env.NODE_ENV = originalEnv;

  // 10. Database and Models Regression Check
  console.log('\n--- 10. Models Regression Check ---');
  try {
    const user = await User.query().first();
    assert(true, 'User model queries database without error');
  } catch (err) {
    assert(false, 'User model query failed', err.message);
  }

  try {
    const session = await Session.query().first();
    assert(true, 'Session model queries database without error');
  } catch (err) {
    assert(false, 'Session model query failed', err.message);
  }

  try {
    const product = await Product.query().first();
    assert(true, 'Product model queries database without error');
  } catch (err) {
    assert(false, 'Product model query failed', err.message);
  }

  try {
    const enquiry = await Enquiry.query().first();
    assert(true, 'Enquiry model queries database without error');
  } catch (err) {
    assert(false, 'Enquiry model query failed', err.message);
  }

  try {
    const quotation = await Quotation.query().first();
    assert(true, 'Quotation model queries database without error');
  } catch (err) {
    assert(false, 'Quotation model query failed', err.message);
  }

  try {
    const order = await Order.query().first();
    assert(true, 'Order model queries database without error');
  } catch (err) {
    assert(false, 'Order model query failed', err.message);
  }

  try {
    const payment = await Payment.query().first();
    assert(true, 'Payment model queries database without error');
  } catch (err) {
    assert(false, 'Payment model query failed', err.message);
  }

  try {
    const notification = await Notification.query().first();
    assert(true, 'Notification model queries database without error');
  } catch (err) {
    assert(false, 'Notification model query failed', err.message);
  }

  try {
    const auditLog = await AuditLog.query().first();
    assert(true, 'AuditLog model queries database without error');
  } catch (err) {
    assert(false, 'AuditLog model query failed', err.message);
  }

  // 11. Graceful Shutdown Check
  console.log('\n--- 11. Graceful Shutdown Check ---');
  const { gracefulShutdown } = require('./src/index');
  // Call gracefulShutdown with exitProcess=false so test process doesn't terminate
  await gracefulShutdown('TEST_SIGNAL', false);
  assert(true, 'Graceful shutdown routine executes cleanly');

  // Close test subservers
  if (testServer) testServer.close();
  if (subServer) subServer.close();

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
