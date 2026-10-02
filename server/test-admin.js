const express = require('express');
const app = require('./src/app');
const config = require('./src/config');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Session = require('./src/models/Session');
const AuditLog = require('./src/models/AuditLog');
const { hashPassword } = require('./src/utils/password');
const auditService = require('./src/services/audit.service');
const adminService = require('./src/services/admin.service');

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

async function runAdminTests() {
  console.log('====================================================');
  console.log('PHASE 2 - STEP 3: ADMIN FOUNDATION VERIFICATION SUITE');
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
      console.log(`Admin test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Admin123';
  const hashedPassword = await hashPassword(testPassword);

  // Define test accounts
  const customerEmail = `customer_${uniqueId}@example.com`;
  const adminEmail = `admin_${uniqueId}@example.com`;
  const suspendedAdminEmail = `suspended_admin_${uniqueId}@example.com`;
  const deletedAdminEmail = `deleted_admin_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let suspendedAdminUser;
  let deletedAdminUser;

  let customerToken;
  let adminToken;

  const testAuditLogIds = [];

  try {
    console.log('--- 1. Seed Controlled Test Accounts ---');

    // Create Customer account
    customerUser = await User.query().insert({
      name: 'Test Customer',
      email: customerEmail,
      phone: '9876500001',
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });
    assert(customerUser && customerUser.id, 'Customer user inserted in database');

    // Create Admin account
    adminUser = await User.query().insert({
      name: 'Test Administrator',
      email: adminEmail,
      phone: '9876500002',
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    });
    assert(adminUser && adminUser.id, 'Admin user inserted in database');

    // Create Suspended Admin account
    suspendedAdminUser = await User.query().insert({
      name: 'Suspended Admin',
      email: suspendedAdminEmail,
      phone: '9876500003',
      password_hash: hashedPassword,
      role: 'admin',
      status: 'suspended',
    });
    assert(suspendedAdminUser && suspendedAdminUser.id, 'Suspended admin user inserted');

    // Create Soft-deleted Admin account
    deletedAdminUser = await User.query().insert({
      name: 'Deleted Admin',
      email: deletedAdminEmail,
      phone: '9876500004',
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
      deleted_at: new Date(),
    });
    assert(deletedAdminUser && deletedAdminUser.id, 'Soft-deleted admin user inserted');

    // Obtain Customer Login Token
    const custLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerEmail, password: testPassword }),
    });
    const custLoginData = await custLoginRes.json();
    customerToken = custLoginData.data?.accessToken;
    assert(custLoginRes.status === 200 && customerToken, 'Customer successfully authenticated via login');

    // Obtain Admin Login Token
    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: testPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.accessToken;
    assert(adminLoginRes.status === 200 && adminToken, 'Admin successfully authenticated via login');

    // Verify Suspended Admin login fails
    const suspLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: suspendedAdminEmail, password: testPassword }),
    });
    assert(suspLoginRes.status === 401, 'Suspended admin login rejected with HTTP 401');

    // Verify Deleted Admin login fails
    const delLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: deletedAdminEmail, password: testPassword }),
    });
    assert(delLoginRes.status === 401, 'Soft-deleted admin login rejected with HTTP 401');

    // 2. Unauthenticated Admin Route Tests
    console.log('\n--- 2. Unauthenticated Access Control Tests ---');
    const noTokenMeRes = await fetch(`${baseUrl}/api/v1/admin/me`);
    assert(noTokenMeRes.status === 401, 'GET /admin/me without token returns HTTP 401');
    const noTokenMeData = await noTokenMeRes.json();
    assert(noTokenMeData.success === false, 'GET /admin/me without token returns success: false');

    const noTokenSummaryRes = await fetch(`${baseUrl}/api/v1/admin/dashboard/summary`);
    assert(noTokenSummaryRes.status === 401, 'GET /admin/dashboard/summary without token returns HTTP 401');

    const malformedTokenRes = await fetch(`${baseUrl}/api/v1/admin/me`, {
      headers: { Authorization: 'Bearer malformed.jwt.token' },
    });
    assert(malformedTokenRes.status === 401, 'GET /admin/me with malformed token returns HTTP 401');

    // 3. Customer Role Forbidden Tests
    console.log('\n--- 3. Role Authorization Tests (Customer Access) ---');
    const custMeRes = await fetch(`${baseUrl}/api/v1/admin/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custMeRes.status === 403, 'Customer accessing /admin/me returns HTTP 403 (FORBIDDEN)');
    const custMeData = await custMeRes.json();
    assert(custMeData.success === false, 'Customer accessing /admin/me returns success: false');
    assert(custMeData.code === 'FORBIDDEN', 'Customer accessing /admin/me error code is FORBIDDEN');

    const custSummaryRes = await fetch(`${baseUrl}/api/v1/admin/dashboard/summary`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custSummaryRes.status === 403, 'Customer accessing /admin/dashboard/summary returns HTTP 403 (FORBIDDEN)');

    // 4. Valid Admin Profile Tests
    console.log('\n--- 4. Admin Profile (/admin/me) Tests ---');
    const adminMeRes = await fetch(`${baseUrl}/api/v1/admin/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminMeRes.status === 200, 'Admin accessing /admin/me returns HTTP 200');
    const adminMeData = await adminMeRes.json();
    assert(adminMeData.success === true, 'Admin /admin/me returns success: true');
    assert(adminMeData.message === 'Admin profile fetched successfully', 'Admin /admin/me returns standard success message');

    const profile = adminMeData.data?.user;
    assert(profile !== undefined, 'Admin /admin/me returns user object');
    assert(profile.public_id === adminUser.public_id, 'Admin /admin/me returns correct public_id');
    assert(profile.name === 'Test Administrator', 'Admin /admin/me returns correct name');
    assert(profile.email === adminEmail, 'Admin /admin/me returns correct email');
    assert(profile.role === 'admin', 'Admin /admin/me returns role "admin"');
    assert(profile.status === 'active', 'Admin /admin/me returns status "active"');
    assert(profile.last_login_at !== null && profile.last_login_at !== undefined, 'Admin /admin/me returns last_login_at timestamp');

    // Security assertions: Never expose sensitive data
    assert(profile.password_hash === undefined, 'Admin profile does NOT expose password_hash');
    assert(profile.id === undefined, 'Admin profile does NOT expose internal database ID');
    assert(profile.refresh_token === undefined, 'Admin profile does NOT expose refresh token');
    assert(!JSON.stringify(adminMeData).includes('password_hash'), 'Response string does not contain password_hash');

    // 5. Admin Dashboard Summary Tests
    console.log('\n--- 5. Admin Dashboard Summary Tests ---');
    const summaryRes = await fetch(`${baseUrl}/api/v1/admin/dashboard/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(summaryRes.status === 200, 'GET /admin/dashboard/summary returns HTTP 200');
    const summaryData = await summaryRes.json();
    assert(summaryData.success === true, 'Dashboard summary returns success: true');
    assert(summaryData.message === 'Admin dashboard summary fetched successfully', 'Dashboard summary returns expected message');

    const d = summaryData.data;
    assert(typeof d === 'object' && d !== null, 'Dashboard data is an object');

    // Check all 8 entities exist
    assert(typeof d.users === 'object', 'Dashboard data contains users summary');
    assert(typeof d.products === 'object', 'Dashboard data contains products summary');
    assert(typeof d.enquiries === 'object', 'Dashboard data contains enquiries summary');
    assert(typeof d.customRequests === 'object', 'Dashboard data contains customRequests summary');
    assert(typeof d.b2bAccounts === 'object', 'Dashboard data contains b2bAccounts summary');
    assert(typeof d.quotations === 'object', 'Dashboard data contains quotations summary');
    assert(typeof d.orders === 'object', 'Dashboard data contains orders summary');
    assert(typeof d.payments === 'object', 'Dashboard data contains payments summary');

    // Check users counts
    assert(typeof d.users.total === 'number' && d.users.total >= 2, 'users.total is a valid number');
    assert(typeof d.users.active === 'number' && d.users.active >= 2, 'users.active is a valid number');
    assert(d.users.total >= d.users.active, 'users.total is greater than or equal to users.active');

    // Check products counts
    assert(typeof d.products.total === 'number', 'products.total is a number');
    assert(typeof d.products.published === 'number', 'products.published is a number');
    assert(typeof d.products.draft === 'number', 'products.draft is a number');

    // Check enquiries counts
    assert(typeof d.enquiries.total === 'number', 'enquiries.total is a number');
    assert(typeof d.enquiries.new === 'number', 'enquiries.new is a number');

    // Check customRequests counts
    assert(typeof d.customRequests.total === 'number', 'customRequests.total is a number');
    assert(typeof d.customRequests.new === 'number', 'customRequests.new is a number');

    // Check b2bAccounts counts
    assert(typeof d.b2bAccounts.total === 'number', 'b2bAccounts.total is a number');
    assert(typeof d.b2bAccounts.pending === 'number', 'b2bAccounts.pending is a number');

    // Check quotations counts
    assert(typeof d.quotations.total === 'number', 'quotations.total is a number');
    assert(typeof d.quotations.sent === 'number', 'quotations.sent is a number');
    assert(typeof d.quotations.accepted === 'number', 'quotations.accepted is a number');

    // Check orders counts
    assert(typeof d.orders.total === 'number', 'orders.total is a number');
    assert(typeof d.orders.pending === 'number', 'orders.pending is a number');
    assert(typeof d.orders.confirmed === 'number', 'orders.confirmed is a number');
    assert(typeof d.orders.manufacturing === 'number', 'orders.manufacturing is a number');

    // Check payments counts
    assert(typeof d.payments.total === 'number', 'payments.total is a number');
    assert(typeof d.payments.paid === 'number', 'payments.paid is a number');
    assert(typeof d.payments.pending === 'number', 'payments.pending is a number');
    assert(typeof d.payments.failed === 'number', 'payments.failed is a number');

    // 6. Soft-Deleted Users Dashboard Precision Test
    console.log('\n--- 6. Soft-Deleted Users Precision Test ---');
    // Verify that soft-deleted user is not in d.users.total
    const nonDeletedCount = await User.query().whereNull('deleted_at').count('* as count').first();
    const activeCount = await User.query().whereNull('deleted_at').where('status', 'active').count('* as count').first();
    assert(d.users.total === Number(nonDeletedCount.count), 'users.total exactly matches non-deleted database count');
    assert(d.users.active === Number(activeCount.count), 'users.active exactly matches active non-deleted database count');

    // 7. Route Isolation & 404 Tests
    console.log('\n--- 7. Route Isolation & 404 Tests ---');
    const unknownAdminRes = await fetch(`${baseUrl}/api/v1/admin/unknown-endpoint`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(unknownAdminRes.status === 404, 'Admin accessing unknown admin sub-route returns HTTP 404');
    const unknownAdminData = await unknownAdminRes.json();
    assert(unknownAdminData.success === false, '404 returns success: false');
    assert(unknownAdminData.message === 'Route not found', '404 returns "Route not found"');

    const custUnknownRes = await fetch(`${baseUrl}/api/v1/admin/unknown-endpoint`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custUnknownRes.status === 403, 'Customer accessing unknown admin sub-route returns HTTP 403');

    // 8. Audit Logging Foundation Tests
    console.log('\n--- 8. Audit Log Foundation Tests ---');
    // Test getAuditContext
    const mockReq = {
      user: { id: adminUser.id, public_id: adminUser.public_id, role: 'admin' },
      ip: '127.0.0.1',
      get: (header) => (header === 'user-agent' ? 'Mozilla/5.0 Test Browser' : null),
    };
    const ctx = auditService.getAuditContext(mockReq);
    assert(ctx.userId === adminUser.id, 'getAuditContext extracts correct user ID');
    assert(ctx.userPublicId === adminUser.public_id, 'getAuditContext extracts correct public_id');
    assert(ctx.userRole === 'admin', 'getAuditContext extracts correct role');
    assert(ctx.ipAddress === '127.0.0.1', 'getAuditContext extracts correct IP');
    assert(ctx.userAgent === 'Mozilla/5.0 Test Browser', 'getAuditContext extracts user-agent');

    // Test logAction directly
    const directAuditLog = await auditService.logAction({
      userId: adminUser.id,
      action: 'ADMIN_DASHBOARD_VIEW_TEST',
      entityType: 'User',
      entityId: adminUser.id,
      oldValues: { status: 'pending' },
      newValues: { status: 'active' },
      metadata: { testSuite: 'Phase2Step3' },
      ipAddress: '127.0.0.1',
      userAgent: 'TestAgent/1.0',
    });
    assert(directAuditLog && directAuditLog.id, 'logAction inserts record into audit_logs table');
    assert(directAuditLog.public_id && directAuditLog.public_id.length === 36, 'Audit log has UUID public_id');
    assert(directAuditLog.action === 'ADMIN_DASHBOARD_VIEW_TEST', 'Audit log stores correct action');
    assert(directAuditLog.user_id === adminUser.id, 'Audit log stores correct user_id');
    testAuditLogIds.push(directAuditLog.id);

    // Test logRequestAction
    const reqAuditLog = await auditService.logRequestAction(mockReq, {
      action: 'ADMIN_PROFILE_INSPECT_TEST',
      entityType: 'AdminProfile',
      entityId: null,
      metadata: { tested: true },
    });
    assert(reqAuditLog && reqAuditLog.id, 'logRequestAction inserts record using req context');
    assert(reqAuditLog.user_id === adminUser.id, 'logRequestAction stores authenticated user_id');
    testAuditLogIds.push(reqAuditLog.id);

    // 9. Regression Tests
    console.log('\n--- 9. Existing Foundation & Auth Endpoints Regression Check ---');
    // Health check
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    assert(healthRes.status === 200, 'GET /api/v1/health still returns HTTP 200');

    // Existing /api/v1/auth/me for Customer
    const custAuthMeRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custAuthMeRes.status === 200, 'Existing GET /api/v1/auth/me returns HTTP 200 for Customer');
    const custAuthMeData = await custAuthMeRes.json();
    assert(custAuthMeData.data?.user?.role === 'customer', 'Customer profile role is customer');

    // Existing /api/v1/auth/me for Admin
    const adminAuthMeRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminAuthMeRes.status === 200, 'Existing GET /api/v1/auth/me returns HTTP 200 for Admin');
    const adminAuthMeData = await adminAuthMeRes.json();
    assert(adminAuthMeData.data?.user?.role === 'admin', 'Admin profile role is admin');

  } catch (err) {
    console.error('Unexpected error during admin tests:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up test records ---');
    try {
      // Clean up audit logs created during test
      if (testAuditLogIds.length > 0) {
        await AuditLog.query().whereIn('id', testAuditLogIds).delete();
      }

      // Clean up sessions of test users
      const testUserIds = [customerUser?.id, adminUser?.id, suspendedAdminUser?.id, deletedAdminUser?.id].filter(Boolean);
      if (testUserIds.length > 0) {
        await Session.query().whereIn('user_id', testUserIds).delete();
        await AuditLog.query().whereIn('user_id', testUserIds).delete();
        await User.query().whereIn('id', testUserIds).delete();
      }
      console.log('Admin test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Error during test cleanup:', cleanupErr);
    }

    if (testServer) {
      testServer.close();
    }
  }

  console.log('\n====================================================');
  console.log(`ADMIN TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAdminTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Admin test execution failed:', err);
      process.exit(1);
    });
}

module.exports = runAdminTests;
