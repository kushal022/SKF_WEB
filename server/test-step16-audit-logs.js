const app = require('./src/app');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const AuditLog = require('./src/models/AuditLog');
const auditService = require('./src/services/audit.service');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep16Tests() {
  console.log('====================================================');
  console.log('STEP 16: AUDIT LOGS API VERIFICATION');
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

  await new Promise((resolve) => {
    testServer = app.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Step 16 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step16Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step16_${uniqueId}@example.com`;
  const adminEmail = `admin_step16_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;

  let testAuditLog1;
  let testAuditLog2;

  try {
    console.log('--- 1. Seed Accounts & Authenticate ---');
    customerUser = await User.query().insert({
      name: 'Step16 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step16 Admin',
      email: adminEmail,
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    const custLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerEmail, password: testPassword }),
    });
    const custLoginData = await custLoginRes.json();
    customerToken = custLoginData.data?.accessToken;
    assert(Boolean(customerToken), 'Customer authenticated');

    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: testPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.accessToken;
    assert(Boolean(adminToken), 'Admin authenticated');

    console.log('\n--- 2. Seed Audit Log Records & Redaction Check ---');
    // Seed audit log 1: with sensitive keys in old_values and new_values
    testAuditLog1 = await auditService.logAction({
      userId: adminUser.id,
      action: 'SYSTEM_CONFIG_UPDATE',
      entityType: 'SystemConfig',
      oldValues: {
        api_key: 'sk_live_secret_112233',
        password_hash: '$2b$10$supersecretstringthatshouldneverbeexposed',
        timeout: 30,
      },
      newValues: {
        api_key: 'sk_live_secret_445566',
        password_hash: '$2b$10$newsecretstringthatshouldneverbeexposed',
        timeout: 60,
      },
      metadata: {
        jwt_secret: 'super_secret_jwt_key',
        auth_token: 'Bearer xyz123',
        description: 'Updated system security parameters',
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 Test Suite Agent',
    });
    assert(Boolean(testAuditLog1?.public_id), 'Seeded audit log 1 with sensitive data');

    // Seed audit log 2: standard mutation
    testAuditLog2 = await auditService.logAction({
      userId: adminUser.id,
      action: 'USER_ROLE_PROMOTION',
      entityType: 'User',
      entityId: customerUser.id,
      oldValues: { role: 'customer' },
      newValues: { role: 'staff' },
      metadata: { reason: 'Promoted to customer support team' },
      ipAddress: '192.168.1.50',
      userAgent: 'SKF-Admin-Portal/2.0',
    });
    assert(Boolean(testAuditLog2?.public_id), 'Seeded audit log 2');

    console.log('\n--- 3. List Audit Logs & Pagination ---');
    const listRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, 'GET /admin/audit-logs returns HTTP 200');
    assert(Array.isArray(listData.data?.items), 'Returns items array');
    assert(listData.data?.pagination?.total >= 2, 'Total audit logs >= 2');
    assert(listData.data?.items[0]?.id === undefined, 'Internal numeric ID is not exposed in list');

    console.log('\n--- 4. Audit Log Filtering ---');
    // Filter by action
    const actionFilterRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs?action=USER_ROLE_PROMOTION`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const actionFilterData = await actionFilterRes.json();
    assert(actionFilterRes.status === 200, 'Filter by action returns HTTP 200');
    assert(
      actionFilterData.data.items.every((l) => l.action === 'USER_ROLE_PROMOTION'),
      'All filtered items have matching action'
    );

    // Filter by entity_type
    const entityFilterRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs?entity_type=SystemConfig`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const entityFilterData = await entityFilterRes.json();
    assert(entityFilterRes.status === 200, 'Filter by entity_type returns HTTP 200');
    assert(
      entityFilterData.data.items.every((l) => l.entity_type === 'SystemConfig'),
      'All filtered items have matching entity_type'
    );

    // Filter by user_public_id
    const userFilterRes = await fetch(
      `${baseUrl}/api/v1/admin/audit-logs?user_public_id=${adminUser.public_id}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const userFilterData = await userFilterRes.json();
    assert(userFilterRes.status === 200, 'Filter by user_public_id returns HTTP 200');
    assert(
      userFilterData.data.items.every((l) => l.user?.public_id === adminUser.public_id),
      'All filtered items match user public_id'
    );

    console.log('\n--- 5. Get Audit Log Detail & Sensitive Field Redaction ---');
    const getRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs/${testAuditLog1.public_id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getData = await getRes.json();
    assert(getRes.status === 200, 'GET /admin/audit-logs/:publicId returns HTTP 200');
    const auditDetail = getData.data?.auditLog;
    assert(auditDetail?.public_id === testAuditLog1.public_id, 'Public ID matches');
    assert(auditDetail?.action === 'SYSTEM_CONFIG_UPDATE', 'Action matches');
    assert(auditDetail?.id === undefined, 'Database internal ID is not exposed in detail');
    assert(auditDetail?.user?.password_hash === undefined, 'User password_hash not present on actor');

    // CRITICAL: Verify sensitive secrets were redacted
    assert(auditDetail?.old_values?.api_key === '[REDACTED]', 'api_key is redacted in old_values');
    assert(auditDetail?.old_values?.password_hash === '[REDACTED]', 'password_hash is redacted in old_values');
    assert(auditDetail?.old_values?.timeout === 30, 'Non-sensitive field preserved in old_values');
    assert(auditDetail?.new_values?.api_key === '[REDACTED]', 'api_key is redacted in new_values');
    assert(auditDetail?.metadata?.jwt_secret === '[REDACTED]', 'jwt_secret is redacted in metadata');
    assert(auditDetail?.metadata?.auth_token === '[REDACTED]', 'auth_token is redacted in metadata');
    assert(auditDetail?.metadata?.description === 'Updated system security parameters', 'Non-sensitive metadata preserved');

    console.log('\n--- 6. Audit Immutability Verification ---');
    // POST /admin/audit-logs should not exist
    const postAuditRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ action: 'FORGED_AUDIT' }),
    });
    assert(postAuditRes.status === 404, 'POST /admin/audit-logs rejected with HTTP 404 (read-only API)');

    // PATCH /admin/audit-logs/:publicId should not exist
    const patchAuditRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs/${testAuditLog1.public_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ action: 'TAMPERED_ACTION' }),
    });
    assert(patchAuditRes.status === 404, 'PATCH /admin/audit-logs/:publicId rejected with HTTP 404');

    // DELETE /admin/audit-logs/:publicId should not exist
    const deleteAuditRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs/${testAuditLog1.public_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteAuditRes.status === 404, 'DELETE /admin/audit-logs/:publicId rejected with HTTP 404');

    console.log('\n--- 7. Authorization & Security Checks ---');
    const nonAdminRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(nonAdminRes.status === 403, 'Non-admin rejected from audit-logs with HTTP 403');

    const noAuthRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs`);
    assert(noAuthRes.status === 401, 'Unauthenticated rejected from audit-logs with HTTP 401');

    const malformedIdRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs/not-a-valid-uuid`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(malformedIdRes.status === 400, 'Malformed UUID rejected with HTTP 400');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 16 test records ---');
    try {
      if (testAuditLog1) await AuditLog.query().deleteById(testAuditLog1.id);
      if (testAuditLog2) await AuditLog.query().deleteById(testAuditLog2.id);
      if (customerUser) await User.query().deleteById(customerUser.id);
      if (adminUser) await User.query().deleteById(adminUser.id);
      console.log('Step 16 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 16 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStep16Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 16 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep16Tests;
