// test-step16-final-integration.mjs
// Step 16 Final Admin Integration & Cross-Module Business Flow Test Suite

const BASE_URL = 'http://localhost:7000/api/v1';

async function runFinalIntegrationTests() {
  console.log('🚀 Starting Step 16 - Final Admin QA & Cross-Module Integration Audit...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  let adminToken = '';
  const cleanupNotifIds = [];

  try {
    // =========================================================================
    // 0. ADMIN AUTHENTICATION
    // =========================================================================
    console.log('--- 1. Operational Authentication ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@skffurniture.com', password: '123456' }),
    });
    const loginData = await loginRes.json();
    adminToken = loginData.data?.accessToken;
    assert(loginRes.status === 200 && Boolean(adminToken), 'Admin authenticated with valid access token');
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // =========================================================================
    // FLOW 1: PRODUCT → ENQUIRY → ADMIN CRM → NOTIFICATION
    // =========================================================================
    console.log('\n--- 2. Cross-Module Flow 1: Product → Customer Enquiry → Admin CRM & Notification ---');
    // 2.1 Fetch published product
    const prodRes = await fetch(`${BASE_URL}/products?limit=1`);
    const prodData = await prodRes.json();
    const testProduct = prodData.data?.items?.[0];
    assert(Boolean(testProduct?.public_id), `Product fetched from catalogue: "${testProduct?.name}"`);

    // 2.2 Customer submits enquiry
    const enqRes = await fetch(`${BASE_URL}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Oberoi Suite Architect',
        phone: '+91 98220 12345',
        email: 'architect@oberoi.com',
        source: 'website',
        message: 'Interested in bespoke 316-grade satin finish specifications for dining table.',
        product_public_id: testProduct.public_id,
      }),
    });
    assert(enqRes.status === 201, 'Customer enquiry submitted via public endpoint (HTTP 201)');
    const enqData = await enqRes.json();
    const enquiryPublicId = enqData.data?.public_id;
    assert(Boolean(enquiryPublicId), `Enquiry created with public_id: ${enquiryPublicId}`);

    // 2.3 Verify enquiry appears in Admin CRM
    const adminEnqRes = await fetch(`${BASE_URL}/admin/enquiries/${enquiryPublicId}`, {
      headers: authHeaders,
    });
    assert(adminEnqRes.status === 200, 'Admin CRM retrieved newly created enquiry (HTTP 200)');
    const adminEnqData = await adminEnqRes.json();
    assert(
      adminEnqData.data?.customer_name === 'Oberoi Suite Architect',
      'Enquiry customer name matches in Admin CRM'
    );
    assert(
      adminEnqData.data?.product?.public_id === testProduct.public_id,
      'Linked product preserved in Admin CRM'
    );

    // 2.4 Verify notification was dispatched to Admin
    const notifRes1 = await fetch(`${BASE_URL}/admin/notifications?type=enquiry&limit=5`, {
      headers: authHeaders,
    });
    const notifData1 = await notifRes1.json();
    const matchingNotif1 = notifData1.data?.items?.find(
      (n) => n.data?.enquiry_public_id === enquiryPublicId
    );
    assert(Boolean(matchingNotif1), 'Admin notification automatically generated for new enquiry');
    if (matchingNotif1) cleanupNotifIds.push(matchingNotif1.public_id);

    // =========================================================================
    // FLOW 2: CUSTOM FURNITURE REQUEST → ADMIN CRM → LINKED ENQUIRY → NOTIFICATION
    // =========================================================================
    console.log('\n--- 3. Cross-Module Flow 2: Custom Request → Linked Enquiry & Notification ---');
    const customReqRes = await fetch(`${BASE_URL}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_type: 'Dining Table',
        customer_name: 'Mehta Penthouse',
        phone: '+91 98450 99887',
        email: 'mehta@luxury.com',
        city: 'Mumbai',
        material: 'SS 316',
        finish: 'PVD Titanium Gold',
        width: 1200,
        length: 2400,
        height: 750,
        quantity: 1,
        requirement: 'Custom mirror-finish stainless steel dining table for sea-facing terrace.',
      }),
    });
    assert(customReqRes.status === 201, 'Public custom furniture request submitted (HTTP 201)');
    const customReqData = await customReqRes.json();
    const customReqPublicId = customReqData.data?.public_id;
    assert(Boolean(customReqPublicId), `Custom request created with public_id: ${customReqPublicId}`);

    // Verify Admin custom request access
    const adminCustomRes = await fetch(`${BASE_URL}/admin/custom-requests/${customReqPublicId}`, {
      headers: authHeaders,
    });
    assert(adminCustomRes.status === 200, 'Admin retrieved custom request (HTTP 200)');

    // Verify notification was dispatched
    const notifRes2 = await fetch(`${BASE_URL}/admin/notifications?type=custom_request&limit=5`, {
      headers: authHeaders,
    });
    const notifData2 = await notifRes2.json();
    const matchingNotif2 = notifData2.data?.items?.find(
      (n) => n.data?.custom_request_public_id === customReqPublicId
    );
    assert(Boolean(matchingNotif2), 'Admin notification automatically generated for custom request');
    if (matchingNotif2) cleanupNotifIds.push(matchingNotif2.public_id);

    // =========================================================================
    // FLOW 3: ESTIMATOR RULE CALCULATION
    // =========================================================================
    console.log('\n--- 4. Cross-Module Flow 3: Pricing Estimator Engine ---');
    const calcRes = await fetch(`${BASE_URL}/estimator/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_type: 'dining_table',
        material: '304',
        finish: 'matte',
        width: 1000,
        length: 2000,
        height: 750,
        dimension_unit: 'mm',
        quantity: 1,
      }),
    });
    assert(calcRes.status === 200, 'Pricing Estimator API calculates cost (HTTP 200)');
    const calcData = await calcRes.json();
    assert(typeof calcData.data?.total_estimate === 'number', `Computed price: Rs. ${calcData.data?.total_estimate}`);
    assert(calcData.data?.total_estimate > 0, 'Estimated price is a positive non-zero number');

    // =========================================================================
    // FLOW 4: QUOTATION → PUBLIC SHARING → CUSTOMER APPROVAL → NOTIFICATION
    // =========================================================================
    console.log('\n--- 5. Cross-Module Flow 4: Quotation Lifecycle & Customer Approval ---');
    // 5.1 Admin creates quotation
    const createQuoteRes = await fetch(`${BASE_URL}/admin/quotations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        customer_name: 'Taj Gateway Lounge',
        customer_phone: '+91 97654 32100',
        customer_email: 'taj.gateway@ihcl.com',
        valid_until: '2026-12-31',
        notes: 'Commercial quotation for lounge credenzas',
        items: [
          {
            product_public_id: testProduct.public_id,
            description: 'Custom Stainless Lounge Credenza',
            quantity: 1,
            unit_price: 180000,
          },
        ],
      }),
    });
    assert(createQuoteRes.status === 201, 'Admin created quotation (HTTP 201)');
    const createQuoteData = await createQuoteRes.json();
    const quotePublicId = createQuoteData.data?.quotation?.public_id;
    assert(Boolean(quotePublicId), `Quotation created with public_id: ${quotePublicId}`);

    // 5.2 Transition quotation to 'sent' so it is available for public sharing
    const sendQuoteRes = await fetch(`${BASE_URL}/admin/quotations/${quotePublicId}/status`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'sent',
        comment: 'Sent to client via email & portal',
      }),
    });
    assert(sendQuoteRes.status === 200, 'Quotation transitioned from draft to sent (HTTP 200)');

    // 5.3 Public Customer inspects quotation
    const publicQuoteRes = await fetch(`${BASE_URL}/quotations/${quotePublicId}`);
    assert(publicQuoteRes.status === 200, 'Public customer views shared quotation (HTTP 200)');
    const publicQuoteData = await publicQuoteRes.json();
    assert(
      publicQuoteData.data?.quotation?.customer_name === 'Taj Gateway Lounge',
      'Shared quotation customer name matches'
    );
    assert(
      publicQuoteData.data?.quotation?.status === 'sent',
      'Shared quotation shows sent status'
    );

    // 5.4 Customer accepts quotation via public link
    const acceptRes = await fetch(`${BASE_URL}/quotations/${quotePublicId}/accept`, {
      method: 'POST',
    });
    assert(acceptRes.status === 200, 'Customer accepts quotation via public portal (HTTP 200)');
    const acceptData = await acceptRes.json();
    assert(
      acceptData.data?.quotation?.status === 'accepted',
      'Quotation status transitioned to "accepted"'
    );

    // 5.5 Verify notification was dispatched to Admin
    const notifRes3 = await fetch(`${BASE_URL}/admin/notifications?type=quotation&limit=5`, {
      headers: authHeaders,
    });
    const notifData3 = await notifRes3.json();
    const matchingNotif3 = notifData3.data?.items?.find(
      (n) => n.data?.quotation_public_id === quotePublicId
    );
    assert(Boolean(matchingNotif3), 'Admin notification automatically generated for quotation approval');
    if (matchingNotif3) cleanupNotifIds.push(matchingNotif3.public_id);

    // =========================================================================
    // FLOW 5: CUSTOMER REVIEW → ADMIN MODERATION → NOTIFICATION
    // =========================================================================
    console.log('\n--- 6. Cross-Module Flow 5: Customer Review Submission & Moderation ---');
    const reviewRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Kavita Patel',
        rating: 5,
        review_text: 'The SS 304 dining table is flawless. Impeccable mirror finish and sturdy engineering.',
        product_public_id: testProduct.public_id,
      }),
    });
    assert(reviewRes.status === 201, 'Customer review submitted (HTTP 201)');
    const reviewData = await reviewRes.json();
    const reviewPublicId = reviewData.data?.public_id;
    assert(Boolean(reviewPublicId), `Review created with public_id: ${reviewPublicId}`);

    // Verify notification was dispatched
    const notifRes4 = await fetch(`${BASE_URL}/admin/notifications?type=review&limit=5`, {
      headers: authHeaders,
    });
    const notifData4 = await notifRes4.json();
    const matchingNotif4 = notifData4.data?.items?.find(
      (n) => n.data?.customer_name === 'Kavita Patel'
    );
    assert(Boolean(matchingNotif4), 'Admin notification generated for new review submission');
    if (matchingNotif4) cleanupNotifIds.push(matchingNotif4.public_id);

    // Admin moderates / approves the review
    const approveReviewRes = await fetch(`${BASE_URL}/admin/reviews/${reviewPublicId}/status`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ status: 'approved' }),
    });
    assert(approveReviewRes.status === 200, 'Admin approved customer review (HTTP 200)');

    // =========================================================================
    // FLOW 6: THEME & WEBSITE SETTINGS PUBLIC CONSUMPTION
    // =========================================================================
    console.log('\n--- 7. Cross-Module Flow 6: Theme & Website Settings Synchronization ---');
    // Public settings endpoint
    const pubSettingsRes = await fetch(`${BASE_URL}/settings/public`);
    assert(pubSettingsRes.status === 200, 'GET /settings/public returns public settings (HTTP 200)');
    const pubSettingsData = await pubSettingsRes.json();
    assert(Boolean(pubSettingsData.data?.settings?.site_name), 'site_name is present in public settings');

    // Public active theme endpoint
    const pubThemeRes = await fetch(`${BASE_URL}/theme/public`);
    assert(pubThemeRes.status === 200, 'GET /theme/public returns active published theme (HTTP 200)');
    const pubThemeData = await pubThemeRes.json();
    assert(
      Boolean(pubThemeData.data?.theme?.primary_color),
      'Theme color tokens present for client rendering'
    );

    // =========================================================================
    // FLOW 7: NOTIFICATION CENTER MANAGEMENT
    // =========================================================================
    console.log('\n--- 8. Cross-Module Flow 7: Notification Center Batch Operations ---');
    const markAllRes = await fetch(`${BASE_URL}/admin/notifications/read-all`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert(markAllRes.status === 200, 'Admin marks all notifications as read (HTTP 200)');

    const unreadCheckRes = await fetch(`${BASE_URL}/admin/notifications?is_read=false&limit=1`, {
      headers: authHeaders,
    });
    const unreadCheckData = await unreadCheckRes.json();
    assert(
      unreadCheckData.data?.pagination?.total === 0 || unreadCheckData.data?.items?.length === 0,
      'Unread count verified at 0 after mark-all-read'
    );

  } catch (err) {
    console.error('Final integration test exception:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 16 test notification records ---');
    if (adminToken && cleanupNotifIds.length > 0) {
      for (const id of cleanupNotifIds) {
        try {
          await fetch(`${BASE_URL}/admin/notifications/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` },
          });
        } catch {
          // ignore
        }
      }
      console.log(`Cleaned up ${cleanupNotifIds.length} test notification records.`);
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 16 INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFinalIntegrationTests();
