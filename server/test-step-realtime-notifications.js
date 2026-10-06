const http = require('http');
const ioClient = require('socket.io-client');
const app = require('./src/app');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Notification = require('./src/models/Notification');
const { initSocketServer, closeSocketServer } = require('./src/socket');
const { generateAccessToken } = require('./src/utils/jwt');
const { hashPassword } = require('./src/utils/password');
const notificationService = require('./src/services/notification.service');
const enquiryService = require('./src/services/enquiry.service');
const customRequestService = require('./src/services/customRequest.service');
const quotationService = require('./src/services/quotation.service');
const reviewService = require('./src/services/review.service');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Quotation = require('./src/models/Quotation');
const jwt = require('jsonwebtoken');
const config = require('./src/config');

let httpServer;
let baseUrl;
let ioServer;

function createClientSocket(url, token, options = {}) {
  return ioClient(url, {
    transports: ['websocket', 'polling'],
    forceNew: true,
    reconnection: false,
    timeout: 3000,
    auth: token ? { token } : undefined,
    ...options,
  });
}

async function runRealtimeNotificationTests() {
  console.log('====================================================');
  console.log('REAL-TIME SOCKET.IO NOTIFICATIONS VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // 1. Start HTTP server + Socket.IO
  httpServer = http.createServer(app);
  ioServer = initSocketServer(httpServer);

  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      const port = httpServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test Socket.IO Server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Socket2026';
  const hashedPassword = await hashPassword(testPassword);

  let adminUserA;
  let adminUserB;
  let superAdminUser;
  let customerUser;
  let barberUser;

  let adminTokenA;
  let adminTokenB;
  let superAdminToken;
  let customerToken;
  let barberToken;

  const createdEntities = {
    users: [],
    notifications: [],
    enquiries: [],
    customRequests: [],
    quotations: [],
    reviews: [],
    categories: [],
    products: [],
  };

  try {
    console.log('--- 1. Seed Accounts & Issue Tokens ---');
    adminUserA = await User.query().insert({
      name: 'Realtime Admin A',
      email: `admin_a_${uniqueId}@example.com`,
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    });
    createdEntities.users.push(adminUserA.id);

    adminUserB = await User.query().insert({
      name: 'Realtime Admin B',
      email: `admin_b_${uniqueId}@example.com`,
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    });
    createdEntities.users.push(adminUserB.id);

    superAdminUser = await User.query().insert({
      name: 'Realtime SuperAdmin',
      email: `superadmin_${uniqueId}@example.com`,
      password_hash: hashedPassword,
      role: 'super_admin',
      status: 'active',
    });
    createdEntities.users.push(superAdminUser.id);

    customerUser = await User.query().insert({
      name: 'Realtime Customer',
      email: `customer_${uniqueId}@example.com`,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });
    createdEntities.users.push(customerUser.id);

    barberUser = await User.query().insert({
      name: 'Realtime Barber',
      email: `barber_${uniqueId}@example.com`,
      password_hash: hashedPassword,
      role: 'barber',
      status: 'active',
    });
    createdEntities.users.push(barberUser.id);

    const mockSession = { public_id: 'sess-rt-' + uniqueId };
    adminTokenA = generateAccessToken(adminUserA, mockSession);
    adminTokenB = generateAccessToken(adminUserB, mockSession);
    superAdminToken = generateAccessToken(superAdminUser, mockSession);
    customerToken = generateAccessToken(customerUser, mockSession);
    barberToken = generateAccessToken(barberUser, mockSession);

    assert(Boolean(adminTokenA), 'Admin A access token generated');
    assert(Boolean(adminTokenB), 'Admin B access token generated');
    assert(Boolean(superAdminToken), 'SuperAdmin access token generated');
    assert(Boolean(customerToken), 'Customer access token generated');
    assert(Boolean(barberToken), 'Barber access token generated');

    // =========================================================================
    // 2. SOCKET AUTHENTICATION TESTS
    // =========================================================================
    console.log('\n--- 2. Socket Authentication & RBAC Verification ---');

    // Test 1: Admin connection succeeds
    const adminSocketA = createClientSocket(baseUrl, adminTokenA);
    const adminAConnected = await new Promise((resolve) => {
      adminSocketA.on('connect', () => resolve(true));
      adminSocketA.on('connect_error', (err) => resolve(false));
    });
    assert(adminAConnected, 'Socket authentication succeeds for admin');

    // Test 2: Super Admin connection succeeds
    const superAdminSocket = createClientSocket(baseUrl, superAdminToken);
    const superAdminConnected = await new Promise((resolve) => {
      superAdminSocket.on('connect', () => resolve(true));
      superAdminSocket.on('connect_error', () => resolve(false));
    });
    assert(superAdminConnected, 'Socket authentication succeeds for super_admin');
    superAdminSocket.disconnect();

    // Test 3: Customer connection fails
    const customerSocket = createClientSocket(baseUrl, customerToken);
    const customerRejected = await new Promise((resolve) => {
      customerSocket.on('connect', () => resolve(false));
      customerSocket.on('connect_error', (err) => {
        resolve(err.message.includes('Forbidden') || err.message.includes('Only administrators'));
      });
    });
    assert(customerRejected, 'Customer socket authentication fails (rejected by role)');
    customerSocket.disconnect();

    // Test 4: Barber connection fails
    const barberSocket = createClientSocket(baseUrl, barberToken);
    const barberRejected = await new Promise((resolve) => {
      barberSocket.on('connect', () => resolve(false));
      barberSocket.on('connect_error', (err) => {
        resolve(err.message.includes('Forbidden') || err.message.includes('Only administrators'));
      });
    });
    assert(barberRejected, 'Barber socket authentication fails (rejected by role)');
    barberSocket.disconnect();

    // Test 5: Invalid token fails
    const invalidSocket = createClientSocket(baseUrl, 'invalid-jwt-token-string');
    const invalidRejected = await new Promise((resolve) => {
      invalidSocket.on('connect', () => resolve(false));
      invalidSocket.on('connect_error', (err) => {
        resolve(err.message.includes('Invalid access token') || err.message.includes('Authentication error'));
      });
    });
    assert(invalidRejected, 'Invalid token connection fails');
    invalidSocket.disconnect();

    // Test 6: Expired token fails
    const expiredToken = jwt.sign(
      { sub: adminUserA.public_id, role: 'admin' },
      config.jwt.accessSecret,
      { expiresIn: '-10s' }
    );
    const expiredSocket = createClientSocket(baseUrl, expiredToken);
    const expiredRejected = await new Promise((resolve) => {
      expiredSocket.on('connect', () => resolve(false));
      expiredSocket.on('connect_error', (err) => {
        resolve(err.message.includes('expired'));
      });
    });
    assert(expiredRejected, 'Expired token connection fails');
    expiredSocket.disconnect();

    // Test: No token fails
    const noTokenSocket = createClientSocket(baseUrl, null);
    const noTokenRejected = await new Promise((resolve) => {
      noTokenSocket.on('connect', () => resolve(false));
      noTokenSocket.on('connect_error', (err) => {
        resolve(err.message.includes('Token') || err.message.includes('required'));
      });
    });
    assert(noTokenRejected, 'Unauthenticated socket without token is rejected');
    noTokenSocket.disconnect();

    // =========================================================================
    // 3. REAL-TIME EVENT EMISSION & ROOM ISOLATION
    // =========================================================================
    console.log('\n--- 3. Real-Time Event Emission & Room Isolation ---');

    // Connect Admin B socket
    const adminSocketB = createClientSocket(baseUrl, adminTokenB);
    const adminBConnected = await new Promise((resolve) => {
      adminSocketB.on('connect', () => resolve(true));
      adminSocketB.on('connect_error', () => resolve(false));
    });
    assert(adminBConnected, 'Admin B socket successfully connected');

    // Test 7, 8, 9: User-specific notification targeting Admin A
    let adminAReceivedPayload = null;
    let adminBReceivedPayload = null;

    adminSocketA.on('notification:new', (payload) => {
      adminAReceivedPayload = payload;
    });

    adminSocketB.on('notification:new', (payload) => {
      adminBReceivedPayload = payload;
    });

    const userSpecificNotification = await notificationService.createNotification({
      user_id: adminUserA.id,
      type: 'enquiry',
      title: 'Targeted Notification for Admin A',
      message: 'This notification is strictly intended for Admin A only.',
      data: { target: 'Admin A' },
    });
    createdEntities.notifications.push(userSpecificNotification.public_id);

    // Wait 300ms for event propagation
    await new Promise((r) => setTimeout(r, 300));

    assert(Boolean(adminAReceivedPayload), 'Correct admin (Admin A) receives user-specific notification');
    assert(
      adminAReceivedPayload?.public_id === userSpecificNotification.public_id,
      'Received payload has correct public_id'
    );
    assert(
      adminAReceivedPayload?.title === 'Targeted Notification for Admin A',
      'Received payload has matching title'
    );
    assert(adminAReceivedPayload?.is_read === false, 'Received payload has is_read=false');
    assert(adminBReceivedPayload === null, 'Unauthorized admin (Admin B) does NOT receive user-specific notification');

    // Test 10: Broadcast notification reaches BOTH Admin A and Admin B
    adminAReceivedPayload = null;
    adminBReceivedPayload = null;

    const broadcastNotification = await notificationService.createNotification({
      user_id: null,
      type: 'system',
      title: 'System Wide Broadcast',
      message: 'All administrators should receive this operational notice.',
      data: { announcement_id: 'announce-01' },
    });
    createdEntities.notifications.push(broadcastNotification.public_id);

    await new Promise((r) => setTimeout(r, 300));

    assert(Boolean(adminAReceivedPayload), 'Broadcast notification reaches Admin A');
    assert(Boolean(adminBReceivedPayload), 'Broadcast notification reaches Admin B');
    assert(
      adminAReceivedPayload?.public_id === broadcastNotification.public_id,
      'Admin A received correct broadcast public_id'
    );
    assert(
      adminBReceivedPayload?.public_id === broadcastNotification.public_id,
      'Admin B received correct broadcast public_id'
    );

    // Test 11: Notification is saved in DB before socket emission
    const dbRecord = await Notification.query()
      .where('public_id', broadcastNotification.public_id)
      .first();
    assert(Boolean(dbRecord), 'Notification is persisted in DB prior to socket emission');
    assert(dbRecord.title === 'System Wide Broadcast', 'DB record matches emitted event data');

    // =========================================================================
    // 4. REST NOTIFICATION APIS STILL FUNCTIONAL
    // =========================================================================
    console.log('\n--- 4. REST Notification API Backward Compatibility ---');

    // List notifications via REST
    const listRes = await fetch(`${baseUrl}/api/v1/admin/notifications?limit=10`, {
      headers: { Authorization: `Bearer ${adminTokenA}` },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, 'GET /api/v1/admin/notifications returns HTTP 200');
    assert(Array.isArray(listData.data?.items), 'REST response items is an array');

    // Get single notification via REST
    const singleRes = await fetch(
      `${baseUrl}/api/v1/admin/notifications/${userSpecificNotification.public_id}`,
      {
        headers: { Authorization: `Bearer ${adminTokenA}` },
      }
    );
    const singleData = await singleRes.json();
    assert(singleRes.status === 200, 'GET /api/v1/admin/notifications/:publicId returns HTTP 200');
    assert(
      singleData.data?.notification?.public_id === userSpecificNotification.public_id,
      'GET single notification returns expected record'
    );

    // Mark single notification as read via REST
    const readRes = await fetch(
      `${baseUrl}/api/v1/admin/notifications/${userSpecificNotification.public_id}/read`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminTokenA}` },
      }
    );
    assert(readRes.status === 200, 'POST /api/v1/admin/notifications/:publicId/read returns HTTP 200');

    // Mark all notifications as read via REST
    const readAllRes = await fetch(`${baseUrl}/api/v1/admin/notifications/read-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminTokenA}` },
    });
    assert(readAllRes.status === 200, 'POST /api/v1/admin/notifications/read-all returns HTTP 200');

    // Delete notification via REST
    const deleteRes = await fetch(
      `${baseUrl}/api/v1/admin/notifications/${userSpecificNotification.public_id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminTokenA}` },
      }
    );
    assert(deleteRes.status === 200, 'DELETE /api/v1/admin/notifications/:publicId returns HTTP 200');

    // =========================================================================
    // 5. EXISTING BUSINESS EVENT NOTIFICATION TRIGGERS
    // =========================================================================
    console.log('\n--- 5. Verify Real-Time Delivery for All 5 Business Triggers ---');

    // Setup Category and Product for triggers
    const testCategory = await Category.query().insert({
      name: `Realtime Cat ${uniqueId}`,
      slug: `realtime-cat-${uniqueId}`,
      is_active: true,
    });
    createdEntities.categories.push(testCategory.id);

    const testProduct = await Product.query().insert({
      name: `Realtime Table ${uniqueId}`,
      slug: `realtime-table-${uniqueId}`,
      product_code: `SKF-TBL-${uniqueId}`,
      category_id: testCategory.id,
      material: '304 Stainless Steel',
      status: 'published',
    });
    createdEntities.products.push(testProduct.id);

    // Trigger 1: Customer Enquiry Submitted -> emits notification:new
    let triggerEvent = null;
    adminSocketA.once('notification:new', (p) => { triggerEvent = p; });

    const enquiryRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Dr. Ramesh Sharma',
        phone: '+919876543210',
        email: 'ramesh@hospital.org',
        message: 'Need 10 stainless steel tables for surgery department',
        source: 'website',
        product_public_id: testProduct.public_id,
      }),
    });
    const enquiryData = await enquiryRes.json();
    if (enquiryData.data?.public_id) createdEntities.enquiries.push(enquiryData.data.public_id);

    await new Promise((r) => setTimeout(r, 400));
    assert(Boolean(triggerEvent), 'Trigger 1: Customer Enquiry emits notification:new to admin socket');
    assert(triggerEvent?.type === 'enquiry', 'Trigger 1 payload type is "enquiry"');

    // Trigger 2: Custom Furniture Request Created -> emits notification:new
    triggerEvent = null;
    adminSocketA.once('notification:new', (p) => { triggerEvent = p; });

    const customReqRes = await fetch(`${baseUrl}/api/v1/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Anita Roy',
        phone: '+919123456789',
        email: 'anita@royinteriors.com',
        product_type: 'Custom Steel Island',
        material: '316',
        finish: 'satin',
        requirement: 'For luxury kitchen project',
      }),
    });
    const customReqData = await customReqRes.json();
    if (customReqData.data?.public_id) createdEntities.customRequests.push(customReqData.data.public_id);

    await new Promise((r) => setTimeout(r, 400));
    assert(Boolean(triggerEvent), 'Trigger 2: Custom Furniture Request emits notification:new to admin socket');
    assert(triggerEvent?.type === 'custom_request', 'Trigger 2 payload type is "custom_request"');

    // Trigger 3: Quotation Accepted by Customer -> emits notification:new
    const testQuotation = await Quotation.query().insert({
      quotation_number: `SKF-QT-RT-${uniqueId}`,
      customer_name: 'Vikram Seth',
      customer_phone: '+919988776655',
      customer_email: 'vikram@sethcorp.in',
      status: 'sent',
      subtotal: 50000,
      tax_amount: 9000,
      discount_amount: 0,
      total_amount: 59000,
    });
    createdEntities.quotations.push(testQuotation.id);

    triggerEvent = null;
    adminSocketA.once('notification:new', (p) => { triggerEvent = p; });

    await fetch(`${baseUrl}/api/v1/quotations/${testQuotation.public_id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accepted_by_name: 'Vikram Seth',
      }),
    });

    await new Promise((r) => setTimeout(r, 400));
    assert(Boolean(triggerEvent), 'Trigger 3: Quotation Accepted emits notification:new to admin socket');
    assert(triggerEvent?.type === 'quotation', 'Trigger 3 payload type is "quotation"');

    // Trigger 4: Quotation Rejected by Customer -> emits notification:new
    const testQuotationReject = await Quotation.query().insert({
      quotation_number: `SKF-QT-REJ-${uniqueId}`,
      customer_name: 'Sunil Rao',
      customer_phone: '+919776655443',
      customer_email: 'sunil@rao.com',
      status: 'sent',
      subtotal: 20000,
      tax_amount: 3600,
      discount_amount: 0,
      total_amount: 23600,
    });
    createdEntities.quotations.push(testQuotationReject.id);

    triggerEvent = null;
    adminSocketA.once('notification:new', (p) => { triggerEvent = p; });

    await fetch(`${baseUrl}/api/v1/quotations/${testQuotationReject.public_id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: 'Budget constraint for this fiscal quarter',
      }),
    });

    await new Promise((r) => setTimeout(r, 400));
    assert(Boolean(triggerEvent), 'Trigger 4: Quotation Rejected emits notification:new to admin socket');
    assert(triggerEvent?.type === 'quotation', 'Trigger 4 payload type is "quotation"');

    // Trigger 5: Review Submitted by Customer -> emits notification:new
    triggerEvent = null;
    adminSocketA.once('notification:new', (p) => { triggerEvent = p; });

    const reviewRes = await fetch(`${baseUrl}/api/v1/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Kavita Patel',
        rating: 5,
        review_text: 'Top quality 304 stainless steel workstation table. Super sturdy finish!',
        product_public_id: testProduct.public_id,
      }),
    });
    const reviewData = await reviewRes.json();
    if (reviewData.data?.public_id) createdEntities.reviews.push(reviewData.data.public_id);

    await new Promise((r) => setTimeout(r, 400));
    assert(Boolean(triggerEvent), 'Trigger 5: Customer Review Submitted emits notification:new to admin socket');
    assert(triggerEvent?.type === 'review', 'Trigger 5 payload type is "review"');

    // Clean disconnect client sockets
    adminSocketA.disconnect();
    adminSocketB.disconnect();

  } catch (error) {
    console.error('[TEST ERROR]', error);
    failed++;
  } finally {
    console.log('\n--- Cleaning up test records ---');
    try {
      if (createdEntities.reviews.length > 0) {
        await knex('reviews').whereIn('public_id', createdEntities.reviews).delete();
      }
      if (createdEntities.enquiries.length > 0) {
        await knex('enquiries').whereIn('public_id', createdEntities.enquiries).delete();
      }
      if (createdEntities.customRequests.length > 0) {
        await knex('custom_requests').whereIn('public_id', createdEntities.customRequests).delete();
      }
      if (createdEntities.quotations.length > 0) {
        await knex('quotations').whereIn('id', createdEntities.quotations).delete();
      }
      if (createdEntities.products.length > 0) {
        await knex('products').whereIn('id', createdEntities.products).delete();
      }
      if (createdEntities.categories.length > 0) {
        await knex('categories').whereIn('id', createdEntities.categories).delete();
      }
      if (createdEntities.notifications.length > 0) {
        await knex('notifications').whereIn('public_id', createdEntities.notifications).delete();
      }
      if (createdEntities.users.length > 0) {
        await knex('notifications').whereIn('user_id', createdEntities.users).delete();
        await knex('users').whereIn('id', createdEntities.users).delete();
      }
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }

    // Close socket server and HTTP server
    closeSocketServer();
    if (httpServer) {
      await new Promise((r) => httpServer.close(r));
    }
  }

  console.log('\n====================================================');
  console.log(`REAL-TIME NOTIFICATIONS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runRealtimeNotificationTests()
    .then(() => {
      console.log('Test completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}

module.exports = runRealtimeNotificationTests;
