const app = require('./src/app');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Notification = require('./src/models/Notification');
const notificationService = require('./src/services/notification.service');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep15Tests() {
  console.log('====================================================');
  console.log('STEP 15: NOTIFICATIONS API VERIFICATION');
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
      console.log(`Step 15 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step15Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step15_${uniqueId}@example.com`;
  const adminEmail = `admin_step15_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;

  let createdNotificationPublicId;
  let secondNotificationPublicId;

  try {
    console.log('--- 1. Seed Accounts & Authenticate ---');
    customerUser = await User.query().insert({
      name: 'Step15 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step15 Admin',
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

    console.log('\n--- 2. Create In-App Notification (Admin API) ---');
    const createRes = await fetch(`${baseUrl}/api/v1/admin/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        user_public_id: adminUser.public_id,
        type: 'order',
        title: 'New High-Value Order Placed',
        message: 'Order SKF-ORD-2026-000001 has been confirmed by customer.',
        channel: 'in_app',
        data: { order_number: 'SKF-ORD-2026-000001', amount: 150000 },
        related_entity_type: 'Order',
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'POST /admin/notifications returns HTTP 201');
    const notif = createData.data?.notification;
    createdNotificationPublicId = notif?.public_id;
    assert(Boolean(createdNotificationPublicId), 'Notification has public_id');
    assert(notif?.title === 'New High-Value Order Placed', 'Title matches');
    assert(notif?.is_read === false, 'Initially is_read is false');
    assert(notif?.read_at === null, 'Initially read_at is null');
    assert(notif?.id === undefined, 'Internal ID is NOT exposed');
    assert(notif?.user?.public_id === adminUser.public_id, 'Recipient user matches');

    // Create a second unread notification
    const createRes2 = await fetch(`${baseUrl}/api/v1/admin/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        user_public_id: adminUser.public_id,
        type: 'quotation',
        title: 'Quotation Expiring Soon',
        message: 'Quotation SKF-QT-2026-000001 expires in 2 days.',
      }),
    });
    const createData2 = await createRes2.json();
    secondNotificationPublicId = createData2.data?.notification?.public_id;
    assert(Boolean(secondNotificationPublicId), 'Second notification created');

    console.log('\n--- 3. Get Notification By Public ID ---');
    const getRes = await fetch(`${baseUrl}/api/v1/admin/notifications/${createdNotificationPublicId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getData = await getRes.json();
    assert(getRes.status === 200, 'GET /admin/notifications/:publicId returns HTTP 200');
    assert(getData.data?.notification?.public_id === createdNotificationPublicId, 'Public ID matches');
    assert(getData.data?.notification?.data?.amount === 150000, 'Structured metadata payload preserved');

    console.log('\n--- 4. List Notifications & Filters ---');
    const listRes = await fetch(`${baseUrl}/api/v1/admin/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, 'GET /admin/notifications returns HTTP 200');
    assert(listData.data?.pagination?.total >= 2, 'Total notifications >= 2');

    // Filter by is_read=false
    const unreadRes = await fetch(`${baseUrl}/api/v1/admin/notifications?is_read=false`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const unreadData = await unreadRes.json();
    assert(unreadData.data.items.every((n) => n.is_read === false), 'All filtered notifications are unread');

    // Filter by type=quotation
    const typeRes = await fetch(`${baseUrl}/api/v1/admin/notifications?type=quotation`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const typeData = await typeRes.json();
    assert(typeData.data.items.every((n) => n.type === 'quotation'), 'All filtered notifications have type quotation');

    console.log('\n--- 5. Mark As Read (Single Notification) ---');
    // POST /notifications/:publicId/read
    const markReadRes = await fetch(`${baseUrl}/api/v1/admin/notifications/${createdNotificationPublicId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const markReadData = await markReadRes.json();
    assert(markReadRes.status === 200, 'POST /notifications/:publicId/read returns HTTP 200');
    assert(markReadData.data?.notification?.is_read === true, 'is_read is now true');
    assert(Boolean(markReadData.data?.notification?.read_at), 'read_at timestamp recorded');

    // Also support PATCH /notifications/:publicId/read
    const patchReadRes = await fetch(`${baseUrl}/api/v1/admin/notifications/${createdNotificationPublicId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(patchReadRes.status === 200, 'PATCH /notifications/:publicId/read returns HTTP 200');

    console.log('\n--- 6. Mark All As Read ---');
    const markAllRes = await fetch(`${baseUrl}/api/v1/admin/notifications/read-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const markAllData = await markAllRes.json();
    assert(markAllRes.status === 200, 'POST /notifications/read-all returns HTTP 200');
    assert(markAllData.data?.updated_count >= 1, 'Marked remaining unread notifications as read');

    // Verify all are read now for this user
    const checkUnreadRes = await fetch(
      `${baseUrl}/api/v1/admin/notifications?user_public_id=${adminUser.public_id}&is_read=false`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const checkUnreadData = await checkUnreadRes.json();
    assert(checkUnreadData.data.items.length === 0, 'No unread notifications remain for admin');

    console.log('\n--- 7. Delete Notification ---');
    const delRes = await fetch(`${baseUrl}/api/v1/admin/notifications/${secondNotificationPublicId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(delRes.status === 200, 'DELETE /admin/notifications/:publicId returns HTTP 200');

    const checkDelRes = await fetch(`${baseUrl}/api/v1/admin/notifications/${secondNotificationPublicId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(checkDelRes.status === 404, 'Deleted notification returns HTTP 404');

    console.log('\n--- 8. Reusable NotificationService Verification ---');
    // Test service helpers directly
    const srvNotif = await notificationService.createForUser(customerUser.public_id, {
      type: 'system',
      title: 'Welcome to SKF Steel Furniture',
      message: 'Your account has been registered successfully.',
    });
    assert(Boolean(srvNotif?.public_id), 'notificationService.createForUser works');

    const adminNotifs = await notificationService.createForAdmins({
      type: 'enquiry',
      title: 'New Commercial Enquiry Received',
      message: 'New enquiry received from client.',
    });
    assert(Array.isArray(adminNotifs) && adminNotifs.length >= 1, 'notificationService.createForAdmins broadcasts to admins');

    console.log('\n--- 9. Authorization & Security Checks ---');
    const custAccessRes = await fetch(`${baseUrl}/api/v1/admin/notifications`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custAccessRes.status === 403, 'Non-admin rejected from notifications API with HTTP 403');

    const noAuthRes = await fetch(`${baseUrl}/api/v1/admin/notifications`);
    assert(noAuthRes.status === 401, 'Unauthenticated rejected with HTTP 401');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 15 test records ---');
    try {
      if (adminUser) {
        await Notification.query().where('user_id', adminUser.id).delete();
      }
      if (customerUser) {
        await Notification.query().where('user_id', customerUser.id).delete();
      }
      if (customerUser) await User.query().deleteById(customerUser.id);
      if (adminUser) await User.query().deleteById(adminUser.id);
      console.log('Step 15 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 15 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStep15Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 15 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep15Tests;
