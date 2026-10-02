const app = require('./src/app');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Enquiry = require('./src/models/Enquiry');
const EnquiryNote = require('./src/models/EnquiryNote');
const EnquiryStatusLog = require('./src/models/EnquiryStatusLog');
const EnquiryFollowUp = require('./src/models/EnquiryFollowUp');
const AuditLog = require('./src/models/AuditLog');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep8Tests() {
  console.log('====================================================');
  console.log('STEP 8: ENQUIRIES + CRM FOUNDATION VERIFICATION');
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
      console.log(`Step 8 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step8Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step8_${uniqueId}@example.com`;
  const adminEmail = `admin_step8_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;
  let testCategory;
  let testProduct;
  let draftProduct;

  try {
    console.log('--- 1. Seed Accounts & Test Products ---');
    customerUser = await User.query().insert({
      name: 'Step8 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step8 Admin',
      email: adminEmail,
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    testCategory = await Category.query().insert({
      name: 'SS Office Desks',
      slug: `ss-office-${uniqueId}`,
      is_active: true,
    });

    testProduct = await Product.query().insert({
      name: 'Executive SS Desk',
      slug: `exec-ss-desk-${uniqueId}`,
      product_code: `DESK-${uniqueId}`,
      category_id: testCategory.id,
      status: 'published',
    });

    draftProduct = await Product.query().insert({
      name: 'Draft Desk',
      slug: `draft-desk-${uniqueId}`,
      product_code: `DRAFT-${uniqueId}`,
      category_id: testCategory.id,
      status: 'draft',
    });

    // Authenticate
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

    console.log('\n--- 2. Public Enquiry Submission ---');
    // Public general enquiry
    const pubEnqRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Rajesh Sharma',
        phone: '9876543210',
        email: 'rajesh@example.com',
        source: 'google_search',
        message: 'Interested in stainless steel dining tables for restaurant.',
      }),
    });
    const pubEnqData = await pubEnqRes.json();
    assert(pubEnqRes.status === 201, 'POST /enquiries creates enquiry (HTTP 201)');
    assert(Boolean(pubEnqData.data.public_id), 'Enquiry has public_id');
    assert(pubEnqData.data.status === 'new', 'Enquiry initial status is "new"');
    assert(pubEnqData.data.id === undefined, 'Internal ID is not exposed');

    // Public product enquiry with product_public_id
    const prodEnqRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Amit Verma',
        phone: '9876543211',
        product_id: testProduct.public_id,
        message: 'Need bulk quote for 10 executive desks.',
      }),
    });
    const prodEnqData = await prodEnqRes.json();
    assert(prodEnqRes.status === 201, 'POST /enquiries with valid product succeeds');
    const createdEnquiryPublicId = prodEnqData.data.public_id;

    // Public enquiry for draft product (should be 404)
    const draftEnqRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Sneha Patel',
        phone: '9876543212',
        product_id: draftProduct.public_id,
      }),
    });
    assert(draftEnqRes.status === 404, 'Enquiry for draft/unpublished product returns 404');

    // Public enquiry for non-existent product
    const fakeEnqRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Sneha Patel',
        phone: '9876543212',
        product_id: 'a0000000-0000-4000-8000-000000000000',
      }),
    });
    assert(fakeEnqRes.status === 404, 'Enquiry for non-existent product returns 404');

    // Validation rejection on missing required fields
    const invalidEnqRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: '',
      }),
    });
    assert(invalidEnqRes.status === 400, 'Invalid enquiry body rejected with 400');

    console.log('\n--- 3. Admin Authorization & Listing ---');
    // Customer cannot access admin enquiries
    const custAccessRes = await fetch(`${baseUrl}/api/v1/admin/enquiries`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custAccessRes.status === 403, 'Customer gets 403 on /admin/enquiries');

    // Admin listing
    const adminListRes = await fetch(`${baseUrl}/api/v1/admin/enquiries?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    assert(adminListRes.status === 200, 'GET /admin/enquiries returns HTTP 200');
    assert(Array.isArray(adminListData.data.items), 'Returns array of items');
    assert(adminListData.data.pagination.total >= 2, 'Pagination tracks total enquiries');

    // Admin search filter
    const searchRes = await fetch(`${baseUrl}/api/v1/admin/enquiries?search=Rajesh`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchData = await searchRes.json();
    assert(searchRes.status === 200 && searchData.data.items.length >= 1, 'Search filter works');

    console.log('\n--- 4. Admin Enquiry Detail ---');
    const detailRes = await fetch(`${baseUrl}/api/v1/admin/enquiries/${createdEnquiryPublicId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailData = await detailRes.json();
    assert(detailRes.status === 200, 'GET /admin/enquiries/:publicId returns HTTP 200');
    assert(detailData.data.product?.public_id === testProduct.public_id, 'Resolved product in detail');
    assert(Array.isArray(detailData.data.notes), 'Notes included in enquiry detail');
    assert(Array.isArray(detailData.data.status_logs), 'Status logs included in enquiry detail');
    assert(Array.isArray(detailData.data.follow_ups), 'Follow-ups included in enquiry detail');

    console.log('\n--- 5. Admin Update Enquiry ---');
    const updateRes = await fetch(`${baseUrl}/api/v1/admin/enquiries/${createdEnquiryPublicId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        customer_name: 'Amit Kumar Verma',
        phone: '9876549999',
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'PATCH /admin/enquiries/:publicId returns HTTP 200');
    assert(updateData.data.customer_name === 'Amit Kumar Verma', 'Enquiry customer_name updated');

    console.log('\n--- 6. Status Transition & Status Logs ---');
    // Transition from 'new' to 'contacted'
    const statusRes = await fetch(
      `${baseUrl}/api/v1/admin/enquiries/${createdEnquiryPublicId}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'contacted',
          comment: 'Called customer on WhatsApp, discussed desk measurements.',
        }),
      }
    );
    const statusData = await statusRes.json();
    assert(statusRes.status === 200, 'POST /enquiries/:publicId/status returns HTTP 200');
    assert(statusData.data.status === 'contacted', 'Enquiry status changed to contacted');

    // Invalid status transition: 'contacted' to an invalid string or disallowed jump
    const invalidStatusRes = await fetch(
      `${baseUrl}/api/v1/admin/enquiries/${createdEnquiryPublicId}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'new', // Cannot jump back to new from contacted
        }),
      }
    );
    assert(invalidStatusRes.status === 400, 'Disallowed status transition rejected with HTTP 400');

    // Verify EnquiryStatusLog was created in the database
    const statusLogRecord = await EnquiryStatusLog.query()
      .where({ to_status: 'contacted' })
      .first();
    assert(Boolean(statusLogRecord), 'EnquiryStatusLog persisted in database');
    assert(
      statusLogRecord.comment === 'Called customer on WhatsApp, discussed desk measurements.',
      'Status log comment persisted'
    );

    console.log('\n--- 7. Enquiry Notes CRUD ---');
    // Create note
    const createNoteRes = await fetch(
      `${baseUrl}/api/v1/admin/enquiries/${createdEnquiryPublicId}/notes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          note: 'Customer requested 304 grade stainless steel quote.',
        }),
      }
    );
    const createNoteData = await createNoteRes.json();
    assert(createNoteRes.status === 201, 'POST /notes returns HTTP 201');
    assert(Boolean(createNoteData.data.public_id), 'Note has public_id');
    const notePublicId = createNoteData.data.public_id;

    // List notes
    const listNotesRes = await fetch(
      `${baseUrl}/api/v1/admin/enquiries/${createdEnquiryPublicId}/notes`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const listNotesData = await listNotesRes.json();
    assert(listNotesRes.status === 200, 'GET /notes returns HTTP 200');
    assert(listNotesData.data.length >= 1, 'Notes list contains created note');

    // Update note
    const updateNoteRes = await fetch(
      `${baseUrl}/api/v1/admin/enquiries/${createdEnquiryPublicId}/notes/${notePublicId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          note: 'Customer requested 304 grade SS quote with matte finish.',
        }),
      }
    );
    const updateNoteData = await updateNoteRes.json();
    assert(updateNoteRes.status === 200, 'PATCH /notes/:notePublicId returns HTTP 200');
    assert(
      updateNoteData.data.note === 'Customer requested 304 grade SS quote with matte finish.',
      'Note content updated'
    );

    // Delete note
    const deleteNoteRes = await fetch(
      `${baseUrl}/api/v1/admin/enquiries/${createdEnquiryPublicId}/notes/${notePublicId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert(deleteNoteRes.status === 200, 'DELETE /notes/:notePublicId returns HTTP 200');

    console.log('\n--- 8. Enquiry Follow-Ups CRUD ---');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    // Create follow-up
    const createFollowUpRes = await fetch(
      `${baseUrl}/api/v1/admin/enquiries/${createdEnquiryPublicId}/follow-ups`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          follow_up_at: tomorrow,
          assigned_to: adminUser.public_id,
          note: 'Call back to finalize desk dimensions.',
        }),
      }
    );
    const createFollowUpData = await createFollowUpRes.json();
    assert(createFollowUpRes.status === 201, 'POST /follow-ups returns HTTP 201');
    assert(Boolean(createFollowUpData.data.public_id), 'Follow-up has public_id');
    const followUpPublicId = createFollowUpData.data.public_id;

    // List follow-ups
    const listFollowUpsRes = await fetch(
      `${baseUrl}/api/v1/admin/enquiries/${createdEnquiryPublicId}/follow-ups`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const listFollowUpsData = await listFollowUpsRes.json();
    assert(listFollowUpsRes.status === 200, 'GET /follow-ups returns HTTP 200');
    assert(listFollowUpsData.data.length >= 1, 'Follow-ups list contains item');

    // Update follow-up (complete it)
    const updateFollowUpRes = await fetch(
      `${baseUrl}/api/v1/admin/enquiries/${createdEnquiryPublicId}/follow-ups/${followUpPublicId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'completed',
          note: 'Completed follow-up call, client approved dimensions.',
        }),
      }
    );
    const updateFollowUpData = await updateFollowUpRes.json();
    assert(updateFollowUpRes.status === 200, 'PATCH /follow-ups/:followUpPublicId returns HTTP 200');
    assert(updateFollowUpData.data.status === 'completed', 'Follow-up marked completed');
    assert(Boolean(updateFollowUpData.data.completed_at), 'Completed_at set automatically');

    // Delete follow-up
    const deleteFollowUpRes = await fetch(
      `${baseUrl}/api/v1/admin/enquiries/${createdEnquiryPublicId}/follow-ups/${followUpPublicId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert(deleteFollowUpRes.status === 200, 'DELETE /follow-ups/:followUpPublicId returns HTTP 200');

    console.log('\n--- 9. Audit Logging Verification ---');
    const auditLogs = await AuditLog.query().where('action', 'like', '%ENQUIRY%');
    assert(auditLogs.length >= 4, 'Multiple audit log entries created for enquiry mutations');
    const hasStatusLogAudit = auditLogs.some((l) => l.action === 'UPDATE_ENQUIRY_STATUS');
    assert(hasStatusLogAudit, 'Audit log recorded UPDATE_ENQUIRY_STATUS');

  } catch (err) {
    console.error('Unexpected test error in Step 8:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 8 test records ---');
    try {
      if (testProduct) await Product.query().deleteById(testProduct.id);
      if (draftProduct) await Product.query().deleteById(draftProduct.id);
      if (testCategory) await Category.query().deleteById(testCategory.id);
      if (customerUser) await User.query().deleteById(customerUser.id);
      if (adminUser) await User.query().deleteById(adminUser.id);
      console.log('Step 8 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 8 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStep8Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 8 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep8Tests;
