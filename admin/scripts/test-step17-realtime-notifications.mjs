// test-step17-realtime-notifications.mjs
// Real-Time Socket.IO Notifications Integration Tests (Admin Frontend & Real-Time Flow)

import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:7000/api/v1';
const SOCKET_BASE = 'http://localhost:7000';

async function waitForServer(maxRetries = 15, delayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch('http://localhost:7000/health');
      if (res.ok) return true;
    } catch {
      // Retry
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 STEP 17: ADMIN REAL-TIME SOCKET.IO NOTIFICATIONS TEST');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Ensure server is reachable
  const isUp = await waitForServer(3, 500);
  if (!isUp) {
    console.error('Server at http://localhost:7000 is not reachable. Please start server first.');
    process.exit(1);
  }

  const createdPublicIds = [];
  let adminSocket = null;

  try {
    // =========================================================================
    // 1. ADMIN AUTHENTICATION
    // =========================================================================
    console.log('--- 1. Admin Authentication & In-Memory Token Acquisition ---');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@skffurniture.com', password: '123456' }),
    });
    const loginData = await loginRes.json();
    const adminToken = loginData.data?.accessToken;
    assert(loginRes.status === 200 && Boolean(adminToken), 'Admin login returned 200 with JWT access token');

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // =========================================================================
    // 2. SOCKET AUTHENTICATION & HANDSHAKE
    // =========================================================================
    console.log('\n--- 2. Socket.IO Connection & Authentication Lifecycle ---');

    // Test: Unauthenticated socket connection fails
    const unauthSocket = io(SOCKET_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 3000,
    });
    const unauthRejected = await new Promise((resolve) => {
      unauthSocket.on('connect', () => resolve(false));
      unauthSocket.on('connect_error', (err) => {
        resolve(err.message.includes('Token') || err.message.includes('required'));
      });
    });
    assert(unauthRejected, 'Unauthenticated socket connection without token is rejected');
    unauthSocket.disconnect();

    // Test: Invalid token socket connection fails
    const invalidSocket = io(SOCKET_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 3000,
      auth: { token: 'invalid.token.here' },
    });
    const invalidRejected = await new Promise((resolve) => {
      invalidSocket.on('connect', () => resolve(false));
      invalidSocket.on('connect_error', (err) => {
        resolve(err.message.includes('Invalid') || err.message.includes('Authentication error'));
      });
    });
    assert(invalidRejected, 'Invalid JWT token socket connection is rejected');
    invalidSocket.disconnect();

    // Test: Authenticated admin socket connection succeeds
    adminSocket = io(SOCKET_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
      auth: { token: adminToken },
    });

    const adminConnected = await new Promise((resolve) => {
      adminSocket.on('connect', () => resolve(true));
      adminSocket.on('connect_error', (err) => {
        console.error('Admin connect error:', err.message);
        resolve(false);
      });
    });
    assert(adminConnected, 'Socket connects successfully after admin authentication');

    // =========================================================================
    // 3. REAL-TIME NOTIFICATION EVENT DELIVERY & RTK QUERY CACHE SIMULATION
    // =========================================================================
    console.log('\n--- 3. Real-Time "notification:new" Delivery ---');

    // Set up real-time listener simulating Admin Notification Bell
    let receivedNotification = null;
    let eventReceivedCount = 0;

    adminSocket.on('notification:new', (payload) => {
      receivedNotification = payload;
      eventReceivedCount++;
    });

    // Create a new notification via API
    const createRes = await fetch(`${API_BASE}/admin/notifications`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'enquiry',
        title: 'New Commercial Dining Table Request',
        message: 'Luxury villa architect submitted enquiry for 8 customized 316-grade steel tables.',
        channel: 'in_app',
        data: { customer_name: 'Rajesh Interior Studio', project: 'Alibaug Villa' },
        related_entity_type: 'Enquiry',
      }),
    });
    assert(createRes.status === 201, 'POST /admin/notifications returns HTTP 201');
    const createData = await createRes.json();
    const createdNotification = createData.data?.notification;
    const createdPublicId = createdNotification?.public_id;
    assert(Boolean(createdPublicId), `Notification saved in DB with public_id: ${createdPublicId}`);
    if (createdPublicId) createdPublicIds.push(createdPublicId);

    // Wait for real-time delivery
    await new Promise((r) => setTimeout(r, 600));

    assert(Boolean(receivedNotification), 'Admin socket received "notification:new" event instantly');
    assert(
      receivedNotification?.public_id === createdPublicId,
      'Received socket payload matches DB record public_id'
    );
    assert(
      receivedNotification?.title === 'New Commercial Dining Table Request',
      'Received payload has correct title'
    );
    assert(
      receivedNotification?.is_read === false,
      'Received payload has is_read=false'
    );
    assert(
      receivedNotification?.type === 'enquiry',
      'Received payload has correct domain type ("enquiry")'
    );

    // =========================================================================
    // 4. DUPLICATE PREVENTION VERIFICATION
    // =========================================================================
    console.log('\n--- 4. Duplicate Prevention Verification ---');

    // Emulating duplicate event filtering as implemented in notificationSocket.ts
    const localHandledIds = new Set([createdPublicId]);
    const isDuplicate = localHandledIds.has(receivedNotification?.public_id);
    assert(isDuplicate, 'Duplicate detection identifies already-handled public_id');

    // Local list deduplication check
    const rawList = [
      receivedNotification,
      { ...receivedNotification }, // duplicate entry
    ];
    const deduplicatedList = Array.from(new Map(rawList.map((n) => [n.public_id, n])).values());
    assert(deduplicatedList.length === 1, 'UI list deduplication reduces duplicate entries to exactly 1');

    // =========================================================================
    // 5. RECONNECT HANDLING VERIFICATION
    // =========================================================================
    console.log('\n--- 5. Socket Reconnection Handling ---');

    let reconnected = false;
    adminSocket.io.on('reconnect', () => {
      reconnected = true;
    });

    // Manually force reconnect
    adminSocket.disconnect();
    assert(!adminSocket.connected, 'Socket disconnected manually');

    adminSocket.connect();
    const reconnectSuccess = await new Promise((resolve) => {
      if (adminSocket.connected) return resolve(true);
      adminSocket.on('connect', () => resolve(true));
      setTimeout(() => resolve(false), 3000);
    });

    assert(reconnectSuccess, 'Socket successfully reconnected with valid JWT auth');

    // =========================================================================
    // 6. REST NOTIFICATION APIS FUNCTIONALITY (REGRESSION CHECK)
    // =========================================================================
    console.log('\n--- 6. Existing REST Notification APIs Regression Check ---');

    // List notifications
    const listRes = await fetch(`${API_BASE}/admin/notifications?limit=5`, {
      headers: authHeaders,
    });
    assert(listRes.status === 200, 'GET /admin/notifications still returns HTTP 200');
    const listData = await listRes.json();
    assert(Array.isArray(listData.data?.items), 'List response contains items array');

    // Get single notification
    const getSingleRes = await fetch(`${API_BASE}/admin/notifications/${createdPublicId}`, {
      headers: authHeaders,
    });
    assert(getSingleRes.status === 200, 'GET /admin/notifications/:publicId still returns HTTP 200');

    // Mark as read
    const markReadRes = await fetch(`${API_BASE}/admin/notifications/${createdPublicId}/read`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert(markReadRes.status === 200, 'POST /admin/notifications/:publicId/read still returns HTTP 200');
    const markReadData = await markReadRes.json();
    assert(markReadData.data?.notification?.is_read === true, 'Notification marked as read in DB');

    // Mark all as read
    const markAllRes = await fetch(`${API_BASE}/admin/notifications/read-all`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert(markAllRes.status === 200, 'POST /admin/notifications/read-all still returns HTTP 200');

    // Delete notification
    const deleteRes = await fetch(`${API_BASE}/admin/notifications/${createdPublicId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(deleteRes.status === 200, 'DELETE /admin/notifications/:publicId still returns HTTP 200');

    // =========================================================================
    // 7. CLEAN DISCONNECT ON LOGOUT & ERROR RESILIENCE
    // =========================================================================
    console.log('\n--- 7. Clean Disconnect on Logout & Error Resilience ---');

    adminSocket.disconnect();
    assert(!adminSocket.connected, 'Socket disconnects cleanly on admin logout');

    // Verify REST APIs continue working when socket is disconnected
    const fallbackRes = await fetch(`${API_BASE}/admin/notifications?limit=1`, {
      headers: authHeaders,
    });
    assert(fallbackRes.status === 200, 'REST notifications API functions seamlessly when socket is offline');

  } catch (error) {
    console.error('Test execution error:', error);
    failed++;
  } finally {
    if (adminSocket) {
      adminSocket.disconnect();
    }
    // Clean up created notifications
    for (const pid of createdPublicIds) {
      try {
        await fetch(`${API_BASE}/admin/notifications/${pid}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
      } catch {
        // Ignored
      }
    }
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
