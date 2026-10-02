const app = require('./src/app');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const B2BAccount = require('./src/models/B2BAccount');
const B2BDocument = require('./src/models/B2BDocument');
const B2BPricingRule = require('./src/models/B2BPricingRule');
const AuditLog = require('./src/models/AuditLog');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep10Tests() {
  console.log('====================================================');
  console.log('STEP 10: B2B / TRADE PORTAL VERIFICATION');
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
      console.log(`Step 10 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step10Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step10_${uniqueId}@example.com`;
  const adminEmail = `admin_step10_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;
  let testCategory;
  let testProduct;
  let createdAccountPublicId;
  let createdDocPublicId;
  let tierPricingRulePublicId;
  let productPricingRulePublicId;

  try {
    console.log('--- 1. Seed Accounts & Baseline Product ---');
    customerUser = await User.query().insert({
      name: 'Step10 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step10 Admin',
      email: adminEmail,
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    testCategory = await Category.query().insert({
      name: 'SS Commercial Kitchens',
      slug: `ss-comm-kitchen-${uniqueId}`,
      is_active: true,
    });

    testProduct = await Product.query().insert({
      name: 'Industrial Prep Sink',
      slug: `ind-prep-sink-${uniqueId}`,
      product_code: `SINK-${uniqueId}`,
      category_id: testCategory.id,
      status: 'published',
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

    console.log('\n--- 2. Public B2B Application ---');
    const applyPayload = {
      company_name: 'Apex Hospitality Pvt Ltd',
      contact_name: 'Karan Mehra',
      email: `karan.mehra_${uniqueId}@apex.com`,
      phone: '9822334455',
      business_type: 'Hotel Chain / Restaurant',
      gst_number: '27AAAAA0000A1Z5',
      address: 'Plot 45, Andheri Industrial Estate, Mumbai',
      notes: 'Planning to furnish 3 new hotel restaurants.',
    };

    const applyRes = await fetch(`${baseUrl}/api/v1/b2b/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applyPayload),
    });
    const applyData = await applyRes.json();
    assert(applyRes.status === 201, 'POST /b2b/apply returns HTTP 201');
    assert(Boolean(applyData.data?.public_id), 'Application returns public_id');
    assert(applyData.data?.verification_status === 'pending', 'Status defaults to "pending"');
    assert(applyData.data?.id === undefined, 'Internal DB ID is not exposed');
    createdAccountPublicId = applyData.data?.public_id;

    // Validation: missing required fields
    const invalidApplyRes = await fetch(`${baseUrl}/api/v1/b2b/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'No Phone Company',
      }),
    });
    assert(invalidApplyRes.status === 400, 'Invalid B2B application rejected with HTTP 400');

    console.log('\n--- 3. Admin Authorization & Account Listing ---');
    const custAccessRes = await fetch(`${baseUrl}/api/v1/admin/b2b/accounts`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custAccessRes.status === 403, 'Customer gets 403 on /admin/b2b/accounts');

    const adminListRes = await fetch(`${baseUrl}/api/v1/admin/b2b/accounts?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    assert(adminListRes.status === 200, 'GET /admin/b2b/accounts returns HTTP 200');
    assert(Array.isArray(adminListData.data.items), 'Returns array of accounts');
    assert(adminListData.data.pagination.total >= 1, 'Pagination tracks accounts');

    // Filter by verification_status
    const filterRes = await fetch(`${baseUrl}/api/v1/admin/b2b/accounts?verification_status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const filterData = await filterRes.json();
    assert(filterRes.status === 200 && filterData.data.items.length >= 1, 'Filter by verification_status works');

    console.log('\n--- 4. Admin B2B Account Detail & Update ---');
    const detailRes = await fetch(`${baseUrl}/api/v1/admin/b2b/accounts/${createdAccountPublicId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailData = await detailRes.json();
    assert(detailRes.status === 200, 'GET /admin/b2b/accounts/:publicId returns HTTP 200');
    assert(detailData.data.company_name === 'Apex Hospitality Pvt Ltd', 'Company name verified');
    assert(Array.isArray(detailData.data.documents), 'Documents array present in detail');

    // Update account (assign discount_tier)
    const updateRes = await fetch(`${baseUrl}/api/v1/admin/b2b/accounts/${createdAccountPublicId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        discount_tier: 'gold',
        notes: 'Verified trade license, tier gold assigned.',
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'PATCH /admin/b2b/accounts/:publicId returns HTTP 200');
    assert(updateData.data.discount_tier === 'gold', 'Discount tier updated to gold');

    console.log('\n--- 5. B2B Account Status Verification ---');
    const statusRes = await fetch(`${baseUrl}/api/v1/admin/b2b/accounts/${createdAccountPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'approved' }),
    });
    const statusData = await statusRes.json();
    assert(statusRes.status === 200, 'POST /status approves B2B account');
    assert(statusData.data.verification_status === 'approved', 'Status is now approved');

    // Invalid status rejected
    const invalidStatusRes = await fetch(
      `${baseUrl}/api/v1/admin/b2b/accounts/${createdAccountPublicId}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'unknown_status' }),
      }
    );
    assert(invalidStatusRes.status === 400, 'Invalid status rejected with HTTP 400');

    console.log('\n--- 6. B2B Documents CRUD & Verification ---');
    // Add document
    const addDocRes = await fetch(`${baseUrl}/api/v1/admin/b2b/accounts/${createdAccountPublicId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        document_type: 'GST Certificate',
        document_url: 'https://res.cloudinary.com/skf/raw/upload/v1/gst_cert.pdf',
        cloudinary_public_id: 'skf/gst_cert_pdf',
      }),
    });
    const addDocData = await addDocRes.json();
    assert(addDocRes.status === 201, 'POST /documents adds document (HTTP 201)');
    assert(Boolean(addDocData.data.public_id), 'Document has public_id');
    assert(addDocData.data.verification_status === 'pending', 'Document status is pending');
    createdDocPublicId = addDocData.data.public_id;

    // List documents
    const listDocsRes = await fetch(
      `${baseUrl}/api/v1/admin/b2b/accounts/${createdAccountPublicId}/documents`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const listDocsData = await listDocsRes.json();
    assert(listDocsRes.status === 200 && listDocsData.data.length >= 1, 'GET /documents lists documents');

    // Update document status: reject without reason should fail
    const rejectNoReasonRes = await fetch(
      `${baseUrl}/api/v1/admin/b2b/accounts/${createdAccountPublicId}/documents/${createdDocPublicId}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'rejected' }),
      }
    );
    assert(rejectNoReasonRes.status === 400, 'Rejecting document without reason rejected with 400');

    // Reject with reason
    const rejectDocRes = await fetch(
      `${baseUrl}/api/v1/admin/b2b/accounts/${createdAccountPublicId}/documents/${createdDocPublicId}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: 'Blurry scan, GSTIN not clearly legible',
        }),
      }
    );
    const rejectDocData = await rejectDocRes.json();
    assert(rejectDocRes.status === 200, 'Rejecting document with reason succeeds');
    assert(rejectDocData.data.verification_status === 'rejected', 'Document status is rejected');

    // Approve document
    const approveDocRes = await fetch(
      `${baseUrl}/api/v1/admin/b2b/accounts/${createdAccountPublicId}/documents/${createdDocPublicId}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      }
    );
    const approveDocData = await approveDocRes.json();
    assert(approveDocRes.status === 200, 'Approving document succeeds');
    assert(approveDocData.data.verification_status === 'approved', 'Document status is approved');

    console.log('\n--- 7. B2B Pricing Rules CRUD ---');
    // Tier-based pricing rule
    const createTierRuleRes = await fetch(`${baseUrl}/api/v1/admin/b2b/pricing-rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        discount_tier: 'gold',
        discount_type: 'percentage',
        discount_value: 12.5,
        min_quantity: 3,
        is_active: true,
      }),
    });
    const createTierRuleData = await createTierRuleRes.json();
    assert(createTierRuleRes.status === 201, 'POST /pricing-rules creates tier rule (HTTP 201)');
    assert(Boolean(createTierRuleData.data.public_id), 'Tier rule has public_id');
    tierPricingRulePublicId = createTierRuleData.data.public_id;

    // Product-specific pricing rule
    const createProdRuleRes = await fetch(`${baseUrl}/api/v1/admin/b2b/pricing-rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        discount_tier: 'gold',
        product_id: testProduct.public_id,
        discount_type: 'fixed',
        discount_value: 2000,
        min_quantity: 1,
        is_active: true,
      }),
    });
    const createProdRuleData = await createProdRuleRes.json();
    assert(createProdRuleRes.status === 201, 'POST /pricing-rules creates product-specific rule');
    assert(createProdRuleData.data.product?.public_id === testProduct.public_id, 'Rule references product');
    productPricingRulePublicId = createProdRuleData.data.public_id;

    // List pricing rules
    const listRulesRes = await fetch(`${baseUrl}/api/v1/admin/b2b/pricing-rules?discount_tier=gold`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listRulesData = await listRulesRes.json();
    assert(listRulesRes.status === 200, 'GET /b2b/pricing-rules returns HTTP 200');
    assert(listRulesData.data.items.length >= 2, 'Lists both tier and product rules');

    // Update pricing rule
    const updateRuleRes = await fetch(
      `${baseUrl}/api/v1/admin/b2b/pricing-rules/${tierPricingRulePublicId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          discount_value: 15,
        }),
      }
    );
    const updateRuleData = await updateRuleRes.json();
    assert(updateRuleRes.status === 200 && updateRuleData.data.discount_value === 15, 'PATCH /pricing-rules updates discount');

    console.log('\n--- 8. Critical Regression Test: Product FK ON DELETE SET NULL on Pricing Rules ---');
    // Delete product
    await Product.query().deleteById(testProduct.id);

    // Verify pricing rule still exists, and product_id was SET NULL by database FK
    const orphanedRule = await B2BPricingRule.query().where({ public_id: productPricingRulePublicId }).first();
    assert(Boolean(orphanedRule), 'Pricing rule survived product deletion');
    assert(orphanedRule.product_id === null, 'Pricing rule product_id was successfully SET NULL by MySQL FK');

    console.log('\n--- 9. Audit Logging Verification ---');
    const b2bAudits = await AuditLog.query().where('action', 'like', '%B2B%');
    assert(b2bAudits.length >= 4, 'Multiple audit log entries recorded for B2B operations');

  } catch (err) {
    console.error('Unexpected test error in Step 10:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 10 test records ---');
    try {
      if (tierPricingRulePublicId) {
        await B2BPricingRule.query().where({ public_id: tierPricingRulePublicId }).delete();
      }
      if (productPricingRulePublicId) {
        await B2BPricingRule.query().where({ public_id: productPricingRulePublicId }).delete();
      }
      if (createdAccountPublicId) {
        const acc = await B2BAccount.query().where({ public_id: createdAccountPublicId }).first();
        if (acc) {
          await B2BDocument.query().where({ b2b_account_id: acc.id }).delete();
          await B2BAccount.query().deleteById(acc.id);
        }
      }
      if (testProduct) await Product.query().deleteById(testProduct.id);
      if (testCategory) await Category.query().deleteById(testCategory.id);
      if (customerUser) await User.query().deleteById(customerUser.id);
      if (adminUser) await User.query().deleteById(adminUser.id);
      console.log('Step 10 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 10 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStep10Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 10 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep10Tests;
