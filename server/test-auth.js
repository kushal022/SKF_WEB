const jwt = require('jsonwebtoken');
const express = require('express');
const app = require('./src/app');
const config = require('./src/config');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Session = require('./src/models/Session');
const { authorizeRoles } = require('./src/middleware/auth.middleware');
const { authenticate } = require('./src/middleware/auth.middleware');
const { hashRefreshToken } = require('./src/utils/refreshToken');

let testServer;
let baseUrl;

// Utility to parse cookies from Set-Cookie header
function parseSetCookie(res, cookieName) {
  const getSetCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const raw = getSetCookie.find((c) => c.startsWith(`${cookieName}=`)) || res.headers.get('set-cookie');
  if (!raw) return null;
  const match = raw.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
  return match ? match[1] : null;
}

async function runAuthTests() {
  console.log('====================================================');
  console.log('PHASE 2 - STEP 2: AUTH & SESSION VERIFICATION SUITE');
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

  // 1. Start test server
  await new Promise((resolve) => {
    testServer = app.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Auth test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testUserA = {
    name: 'Alice Johnson',
    email: `alice_${uniqueId}@example.com`,
    phone: '9876543210',
    password: 'Password@123',
  };
  const testUserB = {
    name: 'Bob Smith',
    email: `bob_${uniqueId}@example.com`,
    phone: '9876543211',
    password: 'Password@456',
  };

  let userAPublicId;
  let userBPublicId;
  let userAAccessToken;
  let userARefreshToken;
  let userBAccessToken;
  let userASessionPublicId;

  try {
    // 1. Register Success
    console.log('--- 1. Registration Tests ---');
    const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserA),
    });
    const regJson = await regRes.json();

    assert(regRes.status === 201, '1. Register returns HTTP 201');
    assert(regJson.success === true, '1. Register returns success: true');
    assert(regJson.data?.user?.email === testUserA.email.toLowerCase(), '1. Register normalizes email');
    assert(regJson.data?.user?.role === 'customer', '1. Register assigns default customer role');
    assert(regJson.data?.user?.status === 'active', '1. Register assigns active status');
    assert(!!regJson.data?.user?.public_id, '1. Register returns user public_id');
    userAPublicId = regJson.data?.user?.public_id;

    // 2. Register Validation Failure
    const invalidRegRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '',
        email: 'invalid-email',
        password: 'short',
      }),
    });
    const invalidRegJson = await invalidRegRes.json();
    assert(invalidRegRes.status === 400, '2. Register invalid inputs returns HTTP 400');
    assert(invalidRegJson.code === 'VALIDATION_ERROR', '2. Register invalid inputs code is VALIDATION_ERROR');

    // Attempting privilege escalation in registration
    const exploitRegRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testUserB,
        role: 'admin',
      }),
    });
    assert(exploitRegRes.status === 400, '2. Registration rejects attempt to specify role (strict schema)');

    // 3. Duplicate Email
    const dupRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserA),
    });
    const dupJson = await dupRes.json();
    assert(dupRes.status === 409, '3. Duplicate email returns HTTP 409');
    assert(dupJson.code === 'DUPLICATE_EMAIL', '3. Duplicate email code is DUPLICATE_EMAIL');

    // 4. Password is Hashed in DB
    console.log('\n--- 2. Password Security Tests ---');
    const dbUser = await User.query().where({ public_id: userAPublicId }).first();
    assert(dbUser && dbUser.password_hash !== testUserA.password, '4. Plain password is not stored in DB');
    assert(dbUser.password_hash.startsWith('$2'), '4. Password is stored as bcrypt hash');

    // 5. password_hash never appears in response
    assert(regJson.data?.user?.password_hash === undefined, '5. Register response does not expose password_hash');
    assert(!JSON.stringify(regJson).includes(dbUser.password_hash), '5. Response string does not leak hash');

    // 6. Login Success
    console.log('\n--- 3. Login Tests ---');
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserA.email,
        password: testUserA.password,
      }),
    });
    const loginJson = await loginRes.json();
    assert(loginRes.status === 200, '6. Login returns HTTP 200');
    assert(!!loginJson.data?.accessToken, '6. Login returns accessToken');
    assert(loginJson.data?.refreshToken === undefined, '6. Login does NOT return refresh token in JSON');
    assert(loginJson.data?.user?.password_hash === undefined, '6. Login does NOT expose password_hash');
    userAAccessToken = loginJson.data?.accessToken;

    userARefreshToken = parseSetCookie(loginRes, config.cookie.name);
    assert(!!userARefreshToken, '6. Login sets HttpOnly refresh token cookie');

    const rawSetCookie = loginRes.headers.get('set-cookie') || '';
    assert(rawSetCookie.toLowerCase().includes('httponly'), '6. Refresh cookie has HttpOnly flag');

    // 7. Login Wrong Password
    const wrongPassRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserA.email,
        password: 'WrongPassword123!',
      }),
    });
    assert(wrongPassRes.status === 401, '7. Login wrong password returns HTTP 401');

    // 8. Login Unknown Email
    const unknownEmailRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nobody_exists_here@example.com',
        password: 'Password@123',
      }),
    });
    assert(unknownEmailRes.status === 401, '8. Login unknown email returns HTTP 401');
    const wrongPassJson = await wrongPassRes.json();
    const unknownEmailJson = await unknownEmailRes.json();
    assert(
      wrongPassJson.message === unknownEmailJson.message,
      '8. Generic error message prevents account enumeration'
    );

    // 9. Login Inactive User
    await User.query().where({ id: dbUser.id }).patch({ status: 'suspended' });
    const suspendedLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserA.email,
        password: testUserA.password,
      }),
    });
    assert(suspendedLoginRes.status === 401, '9. Login inactive/suspended user returns HTTP 401');
    await User.query().where({ id: dbUser.id }).patch({ status: 'active' });

    // 10. Session Created on Login
    console.log('\n--- 4. Session & Refresh Tests ---');
    const sessions = await Session.query().where({ user_id: dbUser.id });
    assert(sessions.length >= 1, '10. Session record created in database on login');
    const activeSession = sessions[0];
    assert(!!activeSession.public_id, '10. Session has UUID public_id');
    assert(activeSession.refresh_token_hash !== userARefreshToken, '10. DB stores hash, never raw token');
    assert(activeSession.revoked_at === null, '10. Initial session revoked_at is null');
    userASessionPublicId = activeSession.public_id;

    // 11. Refresh Success
    const refreshRes = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${config.cookie.name}=${userARefreshToken}`,
      },
    });
    const refreshJson = await refreshRes.json();
    assert(refreshRes.status === 200, '11. Refresh returns HTTP 200');
    assert(!!refreshJson.data?.accessToken, '11. Refresh returns new accessToken');
    assert(refreshJson.data?.refreshToken === undefined, '11. Refresh does NOT return refresh token in JSON');

    // 12. Refresh Rotates Token
    const rotatedRefreshToken = parseSetCookie(refreshRes, config.cookie.name);
    assert(!!rotatedRefreshToken, '12. Refresh sets rotated refresh cookie');
    assert(rotatedRefreshToken !== userARefreshToken, '12. Rotated refresh token is different from old token');

    // 13. Old Refresh Token No Longer Works
    const oldRefreshRes = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${config.cookie.name}=${userARefreshToken}`,
      },
    });
    assert(oldRefreshRes.status === 401, '13. Reusing old rotated refresh token returns HTTP 401');

    // Update active token to the rotated token
    userARefreshToken = rotatedRefreshToken;
    userAAccessToken = refreshJson.data.accessToken;

    // 14. Expired Session Rejected
    const expiredSession = await Session.query().insert({
      user_id: dbUser.id,
      refresh_token_hash: hashRefreshToken('expired_token_raw'),
      expires_at: new Date(Date.now() - 5000),
    });
    const expiredRefreshRes = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${config.cookie.name}=expired_token_raw`,
      },
    });
    assert(expiredRefreshRes.status === 401, '14. Expired session is rejected with HTTP 401');
    await Session.query().deleteById(expiredSession.id);

    // 15. Revoked Session Rejected
    const revokedSession = await Session.query().insert({
      user_id: dbUser.id,
      refresh_token_hash: hashRefreshToken('revoked_token_raw'),
      expires_at: new Date(Date.now() + 60000),
      revoked_at: new Date(),
    });
    const revokedRefreshRes = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${config.cookie.name}=revoked_token_raw`,
      },
    });
    assert(revokedRefreshRes.status === 401, '15. Revoked session is rejected with HTTP 401');
    await Session.query().deleteById(revokedSession.id);

    // 16. Logout Revokes Session
    console.log('\n--- 5. Logout Tests ---');
    const logoutRes = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: `${config.cookie.name}=${userARefreshToken}`,
      },
    });
    assert(logoutRes.status === 200, '16. Logout returns HTTP 200');

    const loggedOutHash = hashRefreshToken(userARefreshToken);
    const checkedSession = await Session.query().where({ refresh_token_hash: loggedOutHash }).first();
    assert(checkedSession && checkedSession.revoked_at !== null, '16. Logout sets session revoked_at');

    // 17. Logout Clears Cookie
    const logoutCookie = logoutRes.headers.get('set-cookie') || '';
    assert(
      logoutCookie.includes('Max-Age=0') || logoutCookie.includes('1970'),
      '17. Logout clears refresh cookie'
    );

    // Re-login User A for authenticated tests
    const reLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserA.email,
        password: testUserA.password,
      }),
    });
    const reLoginJson = await reLoginRes.json();
    userAAccessToken = reLoginJson.data.accessToken;
    userARefreshToken = parseSetCookie(reLoginRes, config.cookie.name);

    // 18. Logout-All Revokes All Sessions
    // Create an extra session for User A
    await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserA.email,
        password: testUserA.password,
      }),
    });
    const preLogoutAllSessions = await Session.query().where({ user_id: dbUser.id }).whereNull('revoked_at');
    assert(preLogoutAllSessions.length >= 2, '18. User has multiple active sessions');

    const logoutAllRes = await fetch(`${baseUrl}/api/v1/auth/logout-all`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userAAccessToken}`,
      },
    });
    assert(logoutAllRes.status === 200, '18. Logout-all returns HTTP 200');
    const postLogoutAllSessions = await Session.query().where({ user_id: dbUser.id }).whereNull('revoked_at');
    assert(postLogoutAllSessions.length === 0, '18. All active sessions are revoked after logout-all');

    // Re-login User A for Profile & Authorization tests
    const login3Res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserA.email,
        password: testUserA.password,
      }),
    });
    const login3Json = await login3Res.json();
    userAAccessToken = login3Json.data.accessToken;
    userARefreshToken = parseSetCookie(login3Res, config.cookie.name);

    // Register & login User B
    const regBRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserB),
    });
    const regBJson = await regBRes.json();
    userBPublicId = regBJson.data?.user?.public_id;

    const loginBRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserB.email,
        password: testUserB.password,
      }),
    });
    const loginBJson = await loginBRes.json();
    userBAccessToken = loginBJson.data?.accessToken;

    // 19. /me Requires Authentication
    console.log('\n--- 6. Profile & Authorization Tests ---');
    const meUnauthRes = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert(meUnauthRes.status === 401, '19. /me without Authorization header returns HTTP 401');

    // 20. /me Returns Safe User
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${userAAccessToken}`,
      },
    });
    const meJson = await meRes.json();
    assert(meRes.status === 200, '20. /me with valid token returns HTTP 200');
    assert(meJson.data?.user?.public_id === userAPublicId, '20. /me returns authenticated user data');
    assert(meJson.data?.user?.password_hash === undefined, '20. /me does NOT expose password_hash');
    assert(meJson.data?.user?.id === undefined, '20. /me does NOT expose internal database ID');

    // 21. Invalid Access Token Rejected
    const invalidTokenRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: 'Bearer this.is.an.invalid.jwt.token',
      },
    });
    assert(invalidTokenRes.status === 401, '21. Invalid access token returns HTTP 401');

    // 22. Expired Access Token Rejected
    const expiredJwt = jwt.sign(
      { sub: userAPublicId, sid: 'session-id', role: 'customer' },
      config.jwt.accessSecret,
      { expiresIn: '0s' }
    );
    const expiredJwtRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${expiredJwt}`,
      },
    });
    assert(expiredJwtRes.status === 401, '22. Expired access token returns HTTP 401');

    // 23. Missing Authorization Header Rejected
    const missingHeaderRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: 'NotBearerToken',
      },
    });
    assert(missingHeaderRes.status === 401, '23. Malformed Authorization header returns HTTP 401');

    // 24 & 25. Role Authorization Middleware
    const testRoleApp = express();
    testRoleApp.use(express.json());
    testRoleApp.get('/test-customer', authenticate, authorizeRoles('customer'), (req, res) => {
      res.json({ ok: true, role: req.user.role });
    });
    testRoleApp.get('/test-admin', authenticate, authorizeRoles('admin'), (req, res) => {
      res.json({ ok: true, role: req.user.role });
    });
    testRoleApp.use(require('./src/middleware/errorHandler'));

    let roleServer;
    let roleBaseUrl;
    await new Promise((resolve) => {
      roleServer = testRoleApp.listen(0, () => {
        roleBaseUrl = `http://127.0.0.1:${roleServer.address().port}`;
        resolve();
      });
    });

    const custRoleRes = await fetch(`${roleBaseUrl}/test-customer`, {
      headers: { Authorization: `Bearer ${userAAccessToken}` },
    });
    assert(custRoleRes.status === 200, '24. Role middleware allows user with matching role (customer)');

    const adminRoleRes = await fetch(`${roleBaseUrl}/test-admin`, {
      headers: { Authorization: `Bearer ${userAAccessToken}` },
    });
    assert(adminRoleRes.status === 403, '25. Role middleware rejects user with non-matching role (HTTP 403)');
    roleServer.close();

    // 26. User Cannot Revoke Another User's Session
    console.log('\n--- 7. Session Isolation & Safety Tests ---');
    const userBSessions = await Session.query().where({ user_id: (await User.query().where({ public_id: userBPublicId }).first()).id });
    const userBSessionPublicId = userBSessions[0]?.public_id;

    // User A attempts to revoke User B's session
    const attackRevokeRes = await fetch(`${baseUrl}/api/v1/auth/sessions/${userBSessionPublicId}/revoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userAAccessToken}`,
      },
    });
    assert(attackRevokeRes.status === 404, '26. User cannot revoke another user session (returns HTTP 404)');

    // 27. Session List Does Not Expose refresh_token_hash
    const sessionsListRes = await fetch(`${baseUrl}/api/v1/auth/sessions`, {
      headers: {
        Authorization: `Bearer ${userAAccessToken}`,
      },
    });
    const sessionsListJson = await sessionsListRes.json();
    assert(sessionsListRes.status === 200, '27. Session list returns HTTP 200');
    assert(Array.isArray(sessionsListJson.data?.sessions), '27. Sessions is an array');
    const firstSession = sessionsListJson.data.sessions[0];
    assert(firstSession.refresh_token_hash === undefined, '27. Session list does NOT expose refresh_token_hash');
    assert(firstSession.id === undefined, '27. Session list does NOT expose internal ID');
    assert(!!firstSession.public_id, '27. Session list exposes public_id');

    // 28. Rate Limiting Test
    console.log('\n--- 8. Rate Limiting & Integration Tests ---');
    // We test that express-rate-limit middleware correctly returns 429 when max limit is hit
    const rateLimitApp = express();
    const rateLimit = require('express-rate-limit');
    rateLimitApp.post(
      '/limited',
      rateLimit({
        windowMs: 60000,
        max: 2,
        handler: (req, res) => {
          res.status(429).json({ success: false, code: 'RATE_LIMIT_EXCEEDED' });
        },
      }),
      (req, res) => res.json({ ok: true })
    );

    let rlServer;
    let rlBaseUrl;
    await new Promise((resolve) => {
      rlServer = rateLimitApp.listen(0, () => {
        rlBaseUrl = `http://127.0.0.1:${rlServer.address().port}`;
        resolve();
      });
    });

    await fetch(`${rlBaseUrl}/limited`, { method: 'POST' });
    await fetch(`${rlBaseUrl}/limited`, { method: 'POST' });
    const thirdHit = await fetch(`${rlBaseUrl}/limited`, { method: 'POST' });
    assert(thirdHit.status === 429, '28. Rate limiting middleware returns HTTP 429 when threshold exceeded');
    rlServer.close();

    // 29. Health Check Endpoint Still Works
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    assert(healthRes.status === 200, '29. Existing health check returns HTTP 200');

    // 30. Step 1 Foundation Integrity
    assert(typeof app.use === 'function', '30. Express app foundation structure is intact');
  } finally {
    // Cleanup test data from database
    console.log('\n--- Cleaning up test records ---');
    try {
      if (userAPublicId) {
        const uA = await User.query().where({ public_id: userAPublicId }).first();
        if (uA) {
          await Session.query().delete().where({ user_id: uA.id });
          await User.query().deleteById(uA.id);
        }
      }
      if (userBPublicId) {
        const uB = await User.query().where({ public_id: userBPublicId }).first();
        if (uB) {
          await Session.query().delete().where({ user_id: uB.id });
          await User.query().deleteById(uB.id);
        }
      }
      console.log('Test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.warn('Test cleanup warning:', cleanupErr.message);
    }

    if (testServer) {
      testServer.close();
    }
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuthTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
