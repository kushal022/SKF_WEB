// test-step14-notifications.mjs
// Step 14 Admin Notifications Integration Tests

const BASE_URL = 'http://localhost:7000/api/v1';

async function runTests() {
  console.log('🧪 Starting Step 14 - Admin Notifications Integration Tests...\n');
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

  const createdPublicIds = [];

  try {
    // =========================================================================
    // 1. AUTHENTICATION & ACCESS CONTROL
    // =========================================================================
    console.log('--- 1. Admin Authentication & RBAC Verification ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@skffurniture.com', password: '123456' }),
    });
    const loginData = await loginRes.json();
    const adminToken = loginData.data?.accessToken;
    assert(loginRes.status === 200 && Boolean(adminToken), 'Admin login returned 200 with accessToken');

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // Unauthenticated request should be rejected (401)
    const unauthRes = await fetch(`${BASE_URL}/admin/notifications`);
    assert(unauthRes.status === 401, 'Unauthenticated GET /admin/notifications rejected with HTTP 401');

    // =========================================================================
    // 2. CREATE NOTIFICATIONS (MULTIPLE DOMAIN TYPES)
    // =========================================================================
    console.log('\n--- 2. Create Notifications across Domain Types ---');

    // Domain Type 1: Enquiry
    const enquiryNotifRes = await fetch(`${BASE_URL}/admin/notifications`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'enquiry',
        title: 'New Commercial Dining Enquiry',
        message: 'A hotel architect submitted an enquiry for 12 custom stainless dining tables.',
        channel: 'in_app',
        data: { customer_name: 'Oberoi Hotels', budget: '1500000' },
        related_entity_type: 'Enquiry',
      }),
    });
    assert(enquiryNotifRes.status === 201, 'POST /admin/notifications (type=enquiry) returns HTTP 201');
    const enquiryNotifData = await enquiryNotifRes.json();
    const enquiryNotifId = enquiryNotifData.data?.notification?.public_id;
    assert(Boolean(enquiryNotifId), `Enquiry notification created with public_id: ${enquiryNotifId}`);
    assert(enquiryNotifData.data?.notification?.is_read === false, 'New enquiry notification defaults to is_read=false');
    if (enquiryNotifId) createdPublicIds.push(enquiryNotifId);

    // Domain Type 2: Quotation
    const quoteNotifRes = await fetch(`${BASE_URL}/admin/notifications`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'quotation',
        title: 'Quotation Accepted by Customer',
        message: 'Quotation SKF-QT-2026-000042 has been accepted by client online.',
        channel: 'in_app',
        data: { quotation_number: 'SKF-QT-2026-000042', total_amount: 320000 },
        related_entity_type: 'Quotation',
      }),
    });
    assert(quoteNotifRes.status === 201, 'POST /admin/notifications (type=quotation) returns HTTP 201');
    const quoteNotifData = await quoteNotifRes.json();
    const quoteNotifId = quoteNotifData.data?.notification?.public_id;
    if (quoteNotifId) createdPublicIds.push(quoteNotifId);

    // Domain Type 3: Custom Furniture Request
    const customNotifRes = await fetch(`${BASE_URL}/admin/notifications`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'custom_request',
        title: 'Bespoke Steel Console Request',
        message: 'Client uploaded architectural CAD drawings for a 316-grade mirror finish console.',
        channel: 'in_app',
        data: { grade: '316', finish: 'mirror' },
        related_entity_type: 'CustomRequest',
      }),
    });
    assert(customNotifRes.status === 201, 'POST /admin/notifications (type=custom_request) returns HTTP 201');
    const customNotifData = await customNotifRes.json();
    const customNotifId = customNotifData.data?.notification?.public_id;
    if (customNotifId) createdPublicIds.push(customNotifId);

    // Domain Type 4: Review
    const reviewNotifRes = await fetch(`${BASE_URL}/admin/notifications`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'review',
        title: 'New 5-Star Customer Review',
        message: 'Client reviewed Stainless Steel Kitchen Island with 5 stars.',
        channel: 'in_app',
        data: { rating: 5, customer: 'Dr. Mehta' },
        related_entity_type: 'Review',
      }),
    });
    assert(reviewNotifRes.status === 201, 'POST /admin/notifications (type=review) returns HTTP 201');
    const reviewNotifData = await reviewNotifRes.json();
    const reviewNotifId = reviewNotifData.data?.notification?.public_id;
    if (reviewNotifId) createdPublicIds.push(reviewNotifId);

    // =========================================================================
    // 3. FETCH NOTIFICATION BY PUBLIC ID
    // =========================================================================
    console.log('\n--- 3. Fetch Notification by Public ID ---');
    const singleRes = await fetch(`${BASE_URL}/admin/notifications/${enquiryNotifId}`, {
      headers: authHeaders,
    });
    assert(singleRes.status === 200, 'GET /admin/notifications/:publicId returns HTTP 200');
    const singleData = await singleRes.json();
    const singleItem = singleData.data?.notification;
    assert(singleItem?.public_id === enquiryNotifId, 'Public ID matches requested notification');
    assert(singleItem?.type === 'enquiry', 'Type matches enquiry');
    assert(singleItem?.data?.customer_name === 'Oberoi Hotels', 'Structured metadata preserved');
    assert(singleItem?.id === undefined, 'Internal auto-increment DB id is NOT leaked');

    // =========================================================================
    // 4. LIST & PAGINATION
    // =========================================================================
    console.log('\n--- 4. List Notifications & Pagination ---');
    const listRes = await fetch(`${BASE_URL}/admin/notifications?page=1&limit=10&sort_order=desc`, {
      headers: authHeaders,
    });
    assert(listRes.status === 200, 'GET /admin/notifications with pagination returns HTTP 200');
    const listData = await listRes.json();
    const items = listData.data?.items;
    const pagination = listData.data?.pagination;
    assert(Array.isArray(items), 'Items is an array');
    assert(Boolean(pagination), 'Pagination object is present');
    assert(typeof pagination.total === 'number' && pagination.total >= 4, `Total notifications is >= 4 (current: ${pagination.total})`);
    assert(pagination.page === 1, 'Pagination page is 1');
    assert(pagination.limit === 10, 'Pagination limit is 10');

    // =========================================================================
    // 5. FILTERING (BY TYPE & BY READ STATUS)
    // =========================================================================
    console.log('\n--- 5. Filtering by Type & Read State ---');

    // Filter by type=quotation
    const filterTypeRes = await fetch(`${BASE_URL}/admin/notifications?type=quotation`, {
      headers: authHeaders,
    });
    assert(filterTypeRes.status === 200, 'GET /admin/notifications?type=quotation returns HTTP 200');
    const filterTypeData = await filterTypeRes.json();
    assert(
      filterTypeData.data.items.every((n) => n.type === 'quotation'),
      'All filtered notifications have type=quotation'
    );

    // Filter by is_read=false
    const filterUnreadRes = await fetch(`${BASE_URL}/admin/notifications?is_read=false`, {
      headers: authHeaders,
    });
    assert(filterUnreadRes.status === 200, 'GET /admin/notifications?is_read=false returns HTTP 200');
    const filterUnreadData = await filterUnreadRes.json();
    assert(
      filterUnreadData.data.items.every((n) => n.is_read === false),
      'All filtered notifications have is_read=false'
    );

    // =========================================================================
    // 6. MARK AS READ (SINGLE)
    // =========================================================================
    console.log('\n--- 6. Mark Single Notification as Read ---');
    // Test POST /notifications/:publicId/read
    const markReadRes = await fetch(`${BASE_URL}/admin/notifications/${enquiryNotifId}/read`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert(markReadRes.status === 200, 'POST /admin/notifications/:publicId/read returns HTTP 200');
    const markReadData = await markReadRes.json();
    assert(markReadData.data?.notification?.is_read === true, 'Notification is_read is now true');
    assert(Boolean(markReadData.data?.notification?.read_at), 'Notification read_at timestamp recorded');

    // Test PATCH /notifications/:publicId/read (idempotent)
    const patchReadRes = await fetch(`${BASE_URL}/admin/notifications/${enquiryNotifId}/read`, {
      method: 'PATCH',
      headers: authHeaders,
    });
    assert(patchReadRes.status === 200, 'PATCH /admin/notifications/:publicId/read returns HTTP 200');

    // =========================================================================
    // 7. MARK ALL AS READ
    // =========================================================================
    console.log('\n--- 7. Mark All Notifications as Read ---');
    const markAllRes = await fetch(`${BASE_URL}/admin/notifications/read-all`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert(markAllRes.status === 200, 'POST /admin/notifications/read-all returns HTTP 200');
    const markAllData = await markAllRes.json();
    assert(typeof markAllData.data?.updated_count === 'number', 'Updated count returned in response');

    // Verify unread count is now 0 for the created records
    const verifyUnreadRes = await fetch(`${BASE_URL}/admin/notifications?is_read=false&limit=1`, {
      headers: authHeaders,
    });
    const verifyUnreadData = await verifyUnreadRes.json();
    assert(
      verifyUnreadData.data?.pagination?.total === 0 || verifyUnreadData.data?.items?.length === 0,
      'Zero unread notifications remaining'
    );

    // =========================================================================
    // 8. DELETE NOTIFICATION
    // =========================================================================
    console.log('\n--- 8. Delete Notification ---');
    const delRes = await fetch(`${BASE_URL}/admin/notifications/${reviewNotifId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(delRes.status === 200, 'DELETE /admin/notifications/:publicId returns HTTP 200');

    const checkDelRes = await fetch(`${BASE_URL}/admin/notifications/${reviewNotifId}`, {
      headers: authHeaders,
    });
    assert(checkDelRes.status === 404, 'Deleted notification returns HTTP 404');

    // Remove from cleanup array since already deleted
    const idx = createdPublicIds.indexOf(reviewNotifId);
    if (idx !== -1) createdPublicIds.splice(idx, 1);

    // =========================================================================
    // 9. INPUT VALIDATION & ERROR SAFETY
    // =========================================================================
    console.log('\n--- 9. Input Validation & Edge Cases ---');
    // Missing required fields
    const invalidCreateRes = await fetch(`${BASE_URL}/admin/notifications`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ type: 'only_type' }),
    });
    assert(invalidCreateRes.status === 400, 'Create notification missing title/message rejected with HTTP 400');

    // Invalid UUID param
    const invalidUuidRes = await fetch(`${BASE_URL}/admin/notifications/not-a-valid-uuid`, {
      headers: authHeaders,
    });
    assert(invalidUuidRes.status === 400, 'Malformed UUID parameter rejected with HTTP 400');

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  } finally {
    // Cleanup created test records
    console.log('\n--- Cleanup Step 14 Test Notifications ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@skffurniture.com', password: '123456' }),
    });
    const loginData = await loginRes.json();
    const cleanupToken = loginData.data?.accessToken;

    if (cleanupToken) {
      for (const id of createdPublicIds) {
        try {
          await fetch(`${BASE_URL}/admin/notifications/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${cleanupToken}` },
          });
        } catch {
          // ignore
        }
      }
      console.log(`Cleaned up ${createdPublicIds.length} test notification records.`);
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 14 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
