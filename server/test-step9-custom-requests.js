const app = require('./src/app');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const CustomRequest = require('./src/models/CustomRequest');
const CustomRequestImage = require('./src/models/CustomRequestImage');
const EstimatorRule = require('./src/models/EstimatorRule');
const Enquiry = require('./src/models/Enquiry');
const AuditLog = require('./src/models/AuditLog');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep9Tests() {
  console.log('====================================================');
  console.log('STEP 9: CUSTOM FURNITURE REQUESTS + ESTIMATOR VERIFICATION');
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
      console.log(`Step 9 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step9Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step9_${uniqueId}@example.com`;
  const adminEmail = `admin_step9_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;
  let createdCustomRequestPublicId;
  let createdRulePublicId;

  try {
    console.log('--- 1. Seed Accounts ---');
    customerUser = await User.query().insert({
      name: 'Step9 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step9 Admin',
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

    console.log('\n--- 2. Public Custom Request Submission ---');
    const customReqPayload = {
      product_type: 'SS Commercial Kitchen Island',
      width: 1500,
      length: 2400,
      height: 900,
      dimension_unit: 'mm',
      material: 'SS 304 Grade',
      finish: 'Hairline Satin',
      quantity: 2,
      customer_name: 'Chef Vikram Roy',
      phone: '9811223344',
      email: 'vikram.roy@kitchen.com',
      city: 'Mumbai',
      requirement: 'Custom dual sink cutout and heavy duty undercounter drawers.',
      estimated_amount: 125000,
      images: [
        {
          image_url: 'https://res.cloudinary.com/skf/image/upload/v1/kitchen_ref1.jpg',
          cloudinary_public_id: 'skf/kitchen_ref1',
          sort_order: 1,
        },
      ],
    };

    const submitRes = await fetch(`${baseUrl}/api/v1/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customReqPayload),
    });
    const submitData = await submitRes.json();
    assert(submitRes.status === 201, 'POST /custom-requests returns HTTP 201');
    assert(Boolean(submitData.data?.public_id), 'Response includes custom request public_id');
    assert(submitData.data?.status === 'new', 'Initial status is "new"');
    createdCustomRequestPublicId = submitData.data?.public_id;

    // Check Step 9.9 relationship: linked enquiry was created
    const linkedEnquiry = await Enquiry.query()
      .where({ source: 'custom_request', phone: '9811223344' })
      .first();
    assert(Boolean(linkedEnquiry), 'Linked enquiry record created in transaction');
    assert(Boolean(linkedEnquiry.custom_request_id), 'Enquiry has valid custom_request_id FK');

    // Validation: missing required fields
    const invalidRes = await fetch(`${baseUrl}/api/v1/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        width: 1000,
      }),
    });
    assert(invalidRes.status === 400, 'Invalid custom request body rejected with HTTP 400');

    console.log('\n--- 3. Admin Authorization & Listing ---');
    const custAccessRes = await fetch(`${baseUrl}/api/v1/admin/custom-requests`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custAccessRes.status === 403, 'Customer gets 403 on admin custom requests');

    const adminListRes = await fetch(`${baseUrl}/api/v1/admin/custom-requests?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    assert(adminListRes.status === 200, 'GET /admin/custom-requests returns HTTP 200');
    assert(Array.isArray(adminListData.data?.items), 'Returns array of custom requests');
    assert(adminListData.data?.pagination?.total >= 1, 'Pagination tracks total requests');

    // Filter by product_type
    const filterRes = await fetch(
      `${baseUrl}/api/v1/admin/custom-requests?product_type=SS+Commercial+Kitchen+Island`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const filterData = await filterRes.json();
    assert(filterRes.status === 200 && filterData.data.items.length >= 1, 'Filter by product_type works');

    console.log('\n--- 4. Admin Custom Request Detail ---');
    const detailRes = await fetch(
      `${baseUrl}/api/v1/admin/custom-requests/${createdCustomRequestPublicId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const detailData = await detailRes.json();
    assert(detailRes.status === 200, 'GET /admin/custom-requests/:publicId returns HTTP 200');
    assert(detailData.data.images?.length >= 1, 'Images included in custom request detail');
    assert(detailData.data.linked_enquiries?.length >= 1, 'Linked enquiries included in detail');
    assert(detailData.data.customer_name === 'Chef Vikram Roy', 'Customer info is correct');

    console.log('\n--- 5. Admin Update Custom Request ---');
    const updateRes = await fetch(
      `${baseUrl}/api/v1/admin/custom-requests/${createdCustomRequestPublicId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          city: 'Navi Mumbai',
          estimated_amount: 130000,
        }),
      }
    );
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'PATCH /admin/custom-requests/:publicId returns HTTP 200');
    assert(updateData.data.city === 'Navi Mumbai', 'City updated');
    assert(updateData.data.estimated_amount === 130000, 'Estimated amount updated');

    console.log('\n--- 6. Status Transitions ---');
    // new -> reviewing
    const statusRes1 = await fetch(
      `${baseUrl}/api/v1/admin/custom-requests/${createdCustomRequestPublicId}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'reviewing' }),
      }
    );
    const statusData1 = await statusRes1.json();
    assert(statusRes1.status === 200, 'Transition from new to reviewing succeeds');
    assert(statusData1.data.status === 'reviewing', 'Status is reviewing');

    // reviewing -> quoted
    const statusRes2 = await fetch(
      `${baseUrl}/api/v1/admin/custom-requests/${createdCustomRequestPublicId}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'quoted' }),
      }
    );
    assert(statusRes2.status === 200, 'Transition from reviewing to quoted succeeds');

    // Invalid transition: quoted -> new is not allowed
    const invalidStatusRes = await fetch(
      `${baseUrl}/api/v1/admin/custom-requests/${createdCustomRequestPublicId}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'new' }),
      }
    );
    assert(invalidStatusRes.status === 400, 'Disallowed status transition rejected with HTTP 400');

    console.log('\n--- 7. Custom Request Images CRUD ---');
    // Add image
    const addImgRes = await fetch(
      `${baseUrl}/api/v1/admin/custom-requests/${createdCustomRequestPublicId}/images`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          image_url: 'https://res.cloudinary.com/skf/image/upload/v1/kitchen_drawing.jpg',
          cloudinary_public_id: 'skf/kitchen_drawing',
          sort_order: 2,
        }),
      }
    );
    const addImgData = await addImgRes.json();
    assert(addImgRes.status === 201, 'POST /images adds custom request image (HTTP 201)');
    const imgPublicId = addImgData.data.public_id;

    // List images
    const listImgRes = await fetch(
      `${baseUrl}/api/v1/admin/custom-requests/${createdCustomRequestPublicId}/images`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const listImgData = await listImgRes.json();
    assert(listImgRes.status === 200 && listImgData.data.length >= 2, 'GET /images lists all images');

    // Update image
    const updateImgRes = await fetch(
      `${baseUrl}/api/v1/admin/custom-requests/${createdCustomRequestPublicId}/images/${imgPublicId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          sort_order: 5,
        }),
      }
    );
    const updateImgData = await updateImgRes.json();
    assert(updateImgRes.status === 200 && updateImgData.data.sort_order === 5, 'PATCH /images/:imagePublicId updates image');

    // Delete image
    const delImgRes = await fetch(
      `${baseUrl}/api/v1/admin/custom-requests/${createdCustomRequestPublicId}/images/${imgPublicId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert(delImgRes.status === 200, 'DELETE /images/:imagePublicId deletes image');

    console.log('\n--- 8. Estimator Rules Admin CRUD ---');
    // Create rule
    const createRuleRes = await fetch(`${baseUrl}/api/v1/admin/estimator-rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Stainless Steel Commercial Table Rule',
        product_type: 'SS Table',
        material: 'SS 304',
        finish: 'Matte',
        dimension_multiplier: 2500,
        material_rate: 3000,
        finish_adjustment: 500,
        base_rate: 8000,
        priority: 10,
        is_active: true,
      }),
    });
    const createRuleData = await createRuleRes.json();
    assert(createRuleRes.status === 201, 'POST /admin/estimator-rules returns HTTP 201');
    assert(Boolean(createRuleData.data?.public_id), 'Estimator rule has public_id');
    createdRulePublicId = createRuleData.data?.public_id;

    // List rules
    const listRulesRes = await fetch(`${baseUrl}/api/v1/admin/estimator-rules?is_active=true`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listRulesData = await listRulesRes.json();
    assert(listRulesRes.status === 200 && listRulesData.data.items.length >= 1, 'GET /admin/estimator-rules lists rules');

    // Detail
    const ruleDetailRes = await fetch(`${baseUrl}/api/v1/admin/estimator-rules/${createdRulePublicId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(ruleDetailRes.status === 200, 'GET /admin/estimator-rules/:publicId returns HTTP 200');

    // Update rule
    const updateRuleRes = await fetch(`${baseUrl}/api/v1/admin/estimator-rules/${createdRulePublicId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        base_rate: 9000,
      }),
    });
    const updateRuleData = await updateRuleRes.json();
    assert(updateRuleRes.status === 200 && updateRuleData.data.base_rate === 9000, 'PATCH /admin/estimator-rules updates base_rate');

    console.log('\n--- 9. Public Estimator Calculation & Rules ---');
    // Public rules
    const pubRulesRes = await fetch(`${baseUrl}/api/v1/estimator/rules`);
    const pubRulesData = await pubRulesRes.json();
    assert(pubRulesRes.status === 200, 'GET /estimator/rules returns HTTP 200');
    assert(Array.isArray(pubRulesData.data), 'Public rules returns array');
    const matchedPubRule = pubRulesData.data.find((r) => r.public_id === createdRulePublicId);
    assert(Boolean(matchedPubRule), 'Active rule appears in public estimator rules');
    assert(matchedPubRule?.rule_config === undefined, 'Internal rule_config not exposed publicly');

    // Public calculate
    const calcRes = await fetch(`${baseUrl}/api/v1/estimator/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_type: 'SS Table',
        width: 1000,
        length: 2000,
        height: 850,
        dimension_unit: 'mm',
        material: 'SS 304',
        finish: 'Matte',
        quantity: 1,
      }),
    });
    const calcData = await calcRes.json();
    assert(calcRes.status === 200, 'POST /estimator/calculate returns HTTP 200');
    assert(calcData.data.is_estimate === true, 'Response is labeled as an estimate');
    assert(Boolean(calcData.data.disclaimer), 'Estimate includes formal quotation disclaimer');
    assert(calcData.data.total_estimate > 0, 'Estimate amount calculated greater than 0');
    assert(calcData.data.currency === 'INR', 'Currency is INR');

    console.log('\n--- 10. Audit Logging Verification ---');
    const customReqAudits = await AuditLog.query().where('action', 'like', '%CUSTOM_REQUEST%');
    assert(customReqAudits.length >= 2, 'Audit logs recorded for custom requests');
    const estimatorAudits = await AuditLog.query().where('action', 'like', '%ESTIMATOR_RULE%');
    assert(estimatorAudits.length >= 1, 'Audit logs recorded for estimator rules');

  } catch (err) {
    console.error('Unexpected test error in Step 9:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 9 test records ---');
    try {
      if (createdRulePublicId) {
        await EstimatorRule.query().where({ public_id: createdRulePublicId }).delete();
      }
      if (createdCustomRequestPublicId) {
        const cr = await CustomRequest.query().where({ public_id: createdCustomRequestPublicId }).first();
        if (cr) {
          await Enquiry.query().where({ custom_request_id: cr.id }).delete();
          await CustomRequestImage.query().where({ custom_request_id: cr.id }).delete();
          await CustomRequest.query().deleteById(cr.id);
        }
      }
      if (customerUser) await User.query().deleteById(customerUser.id);
      if (adminUser) await User.query().deleteById(adminUser.id);
      console.log('Step 9 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 9 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStep9Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 9 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep9Tests;
