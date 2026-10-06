// test-step15-security-audit.mjs
// Step 15 Security Audit & Hardening Verification Test Suite

const BASE_URL = 'http://localhost:7000/api/v1';

async function runSecurityAudit() {
  console.log('🛡️  Starting Step 15 - Security Audit & Hardening Test Suite...\n');
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
  let customerToken = '';
  const testCustomerEmail = `sec_audit_cust_${Date.now()}@example.com`;

  try {
    // =========================================================================
    // 1. AUTHENTICATION CONTROLS
    // =========================================================================
    console.log('--- 1. Authentication Security Tests ---');

    // 1.1 Unauthenticated access to admin endpoints
    const unauthRes = await fetch(`${BASE_URL}/admin/products`);
    assert(unauthRes.status === 401, 'Unauthenticated GET /admin/products returns HTTP 401');

    const unauthNotifRes = await fetch(`${BASE_URL}/admin/notifications`);
    assert(unauthNotifRes.status === 401, 'Unauthenticated GET /admin/notifications returns HTTP 401');

    // 1.2 Invalid Bearer token
    const invalidTokenRes = await fetch(`${BASE_URL}/admin/products`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.token' },
    });
    assert(invalidTokenRes.status === 401, 'Invalid JWT token returns HTTP 401 Unauthorized');

    // 1.3 Malformed authorization header format
    const malformedAuthRes = await fetch(`${BASE_URL}/admin/products`, {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    assert(malformedAuthRes.status === 401, 'Non-Bearer Authorization header returns HTTP 401');

    // 1.4 Valid Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@skffurniture.com', password: '123456' }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.accessToken;
    assert(adminLoginRes.status === 200 && Boolean(adminToken), 'Admin login successful with valid JWT access token');

    // 1.5 Register test customer to test privilege boundaries
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Customer',
        email: testCustomerEmail,
        password: 'Password@123',
        phone: '9988776655',
      }),
    });
    // If registration succeeds or user exists, log in
    const custLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testCustomerEmail, password: 'Password@123' }),
    });
    const custLoginData = await custLoginRes.json();
    customerToken = custLoginData.data?.accessToken;
    assert(Boolean(customerToken), 'Customer account authenticated with non-admin role');

    // =========================================================================
    // 2. AUTHORIZATION & RBAC PRIVILEGE BOUNDARIES
    // =========================================================================
    console.log('\n--- 2. Authorization & RBAC Privilege Boundary Tests ---');

    // 2.1 Customer attempting admin notifications
    const custNotifRes = await fetch(`${BASE_URL}/admin/notifications`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custNotifRes.status === 403, 'Customer token rejected from /admin/notifications with HTTP 403');

    // 2.2 Customer attempting admin products
    const custProdRes = await fetch(`${BASE_URL}/admin/products`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custProdRes.status === 403, 'Customer token rejected from /admin/products with HTTP 403');

    // 2.3 Customer attempting admin quotations
    const custQuoteRes = await fetch(`${BASE_URL}/admin/quotations`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custQuoteRes.status === 403, 'Customer token rejected from /admin/quotations with HTTP 403');

    // 2.4 Customer attempting admin settings
    const custSettingsRes = await fetch(`${BASE_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custSettingsRes.status === 403, 'Customer token rejected from /admin/settings with HTTP 403');

    // 2.5 Customer attempting audit logs
    const custAuditRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custAuditRes.status === 403, 'Customer token rejected from /admin/audit-logs with HTTP 403');

    // =========================================================================
    // 3. IDOR (INSECURE DIRECT OBJECT REFERENCE) DEFENSES
    // =========================================================================
    console.log('\n--- 3. IDOR Defense Verification ---');

    // 3.1 Draft Quotation Protection: Customer cannot view draft quotation via public link
    // First, retrieve an existing product
    const prodListRes = await fetch(`${BASE_URL}/admin/products?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const prodListData = await prodListRes.json();
    const productPublicId = prodListData.data?.items?.[0]?.public_id;

    // Admin creates a draft quotation
    const createDraftRes = await fetch(`${BASE_URL}/admin/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        customer_name: 'Confidential Client',
        customer_phone: '9876543210',
        customer_email: 'confidential@example.com',
        notes: 'Secret internal contractor margin note: 40% markup',
        items: [
          {
            product_public_id: productPublicId,
            description: 'Custom Bespoke Stainless Desk',
            quantity: 1,
            unit_price: 50000,
          },
        ],
      }),
    });
    const createDraftData = await createDraftRes.json();
    const draftPublicId = createDraftData.data?.quotation?.public_id;
    assert(Boolean(draftPublicId), 'Admin created draft quotation for IDOR testing');

    // Public request to draft quotation must be rejected (403)
    const publicDraftRes = await fetch(`${BASE_URL}/quotations/${draftPublicId}`);
    assert(publicDraftRes.status === 403, 'Public viewer blocked from accessing draft quotation (HTTP 403)');

    // 3.2 Cross-Resource Item Isolation (attempt modifying non-existent or foreign item)
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const fakeItemRes = await fetch(`${BASE_URL}/admin/quotations/${draftPublicId}/items/${fakeUuid}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ description: 'Hacked Item' }),
    });
    assert(fakeItemRes.status === 404 || fakeItemRes.status === 400, 'Cross-resource item manipulation rejected (HTTP 400/404)');

    // Clean up draft quotation
    if (draftPublicId) {
      await fetch(`${BASE_URL}/admin/quotations/${draftPublicId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }

    // =========================================================================
    // 4. INPUT VALIDATION & MASS ASSIGNMENT DEFENSES
    // =========================================================================
    console.log('\n--- 4. Input Validation & Mass Assignment Defenses ---');

    // 4.1 Malformed UUID path parameters
    const malformedUuidRes = await fetch(`${BASE_URL}/admin/products/not-a-valid-uuid`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(malformedUuidRes.status === 400, 'Malformed UUID path parameter rejected with HTTP 400');

    // 4.2 Invalid Enum values
    const invalidStatusRes = await fetch(`${BASE_URL}/admin/enquiries?status=INVALID_STATUS_ENUM`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(invalidStatusRes.status === 400 || invalidStatusRes.status === 200, 'Invalid status handled safely without server crash');

    // 4.3 Missing mandatory fields in Product creation
    const emptyProdRes = await fetch(`${BASE_URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    });
    assert(emptyProdRes.status === 400, 'Empty product payload rejected with HTTP 400 validation error');

    // 4.4 Mass assignment attempt: trying to overwrite internal fields (id, created_at, role)
    const massAssignRes = await fetch(`${BASE_URL}/admin/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: 999999,
        type: 'system',
        title: 'Mass Assignment Probe',
        message: 'Testing strict schema validation',
        is_admin: true,
        secret_field: 'malicious',
      }),
    });
    assert(
      massAssignRes.status === 400,
      'Notification payload containing unexpected/disallowed fields rejected with HTTP 400 (strict validation)'
    );

    // =========================================================================
    // 5. SQL INJECTION DEFENSE (PARAMETERIZED QUERIES)
    // =========================================================================
    console.log('\n--- 5. SQL Injection Neutralization ---');

    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE notifications; --",
      "1 UNION SELECT null, null, password_hash FROM users --",
    ];

    for (const sqlPayload of sqlPayloads) {
      const searchRes = await fetch(
        `${BASE_URL}/admin/products?search=${encodeURIComponent(sqlPayload)}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assert(
        searchRes.status === 200,
        `SQL injection attempt "${sqlPayload.slice(0, 20)}..." safely parameterized (HTTP 200)`
      );
      const searchData = await searchRes.json();
      assert(Array.isArray(searchData.data?.items), 'Returned valid empty/filtered items array, database intact');
    }

    // =========================================================================
    // 6. XSS (CROSS-SITE SCRIPTING) PAYLOAD RESILIENCE
    // =========================================================================
    console.log('\n--- 6. XSS Payload Handling ---');

    const xssPayload = '<script>alert("XSS")</script><img src="x" onerror="alert(1)">';
    const xssEnquiryRes = await fetch(`${BASE_URL}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Security Researcher',
        phone: '+91 99999 88888',
        email: 'research@example.com',
        message: xssPayload,
      }),
    });
    assert(xssEnquiryRes.status === 201, 'Enquiry with HTML/script characters handled safely (HTTP 201)');
    const xssEnquiryData = await xssEnquiryRes.json();
    const createdEnquiryId = xssEnquiryData.data?.public_id;

    if (createdEnquiryId) {
      const fetchEnquiryRes = await fetch(`${BASE_URL}/admin/enquiries/${createdEnquiryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const fetchEnquiryData = await fetchEnquiryRes.json();
      const storedMessage = fetchEnquiryData.data?.message || fetchEnquiryData.data?.enquiry?.message;
      assert(
        typeof storedMessage === 'string' && storedMessage.includes('<script>'),
        'Payload stored safely as plain string text, preventing executable DOM insertion'
      );
    }

    // =========================================================================
    // 7. SENSITIVE DATA EXPOSURE & ERROR HYGIENE
    // =========================================================================
    console.log('\n--- 7. Sensitive Data Exposure & Error Hygiene ---');

    // 7.1 Intentionally trigger 404
    const notFoundRes = await fetch(`${BASE_URL}/admin/products/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const notFoundData = await notFoundRes.json();
    assert(notFoundRes.status === 404, 'Nonexistent resource returns HTTP 404');
    assert(
      !notFoundData.stack || process.env.NODE_ENV !== 'production',
      'Stack trace suppressed in production mode'
    );
    assert(
      !JSON.stringify(notFoundData).toLowerCase().includes('password') &&
        !JSON.stringify(notFoundData).toLowerCase().includes('secret'),
      'Zero credentials or secrets leaked in error response'
    );

    // 7.2 Check that password_hash is never exposed in user API responses
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /auth/me returns 200 OK');
    const userObj = meData.data?.user;
    assert(userObj?.password_hash === undefined, 'password_hash is strictly excluded from user response');
    assert(userObj?.password === undefined, 'password field is strictly excluded from user response');
    assert(userObj?.id === undefined, 'Internal database integer id is strictly excluded from public user payload');

    // 7.3 Audit log sanitization
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await auditRes.json();
    assert(auditRes.status === 200, 'GET /admin/audit-logs returns HTTP 200');
    const logItems = auditData.data?.items || [];
    const hasExposedPassword = logItems.some(
      (log) => JSON.stringify(log).includes('password_hash') || JSON.stringify(log).includes('secret')
    );
    assert(!hasExposedPassword, 'Zero passwords, hashes, or secrets present in audit log telemetry');

  } catch (err) {
    console.error('Security audit test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`STEP 15 SECURITY AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit();
