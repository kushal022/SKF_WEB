const express = require('express');
const app = require('./src/app');
const config = require('./src/config');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Session = require('./src/models/Session');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const AuditLog = require('./src/models/AuditLog');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep6Tests() {
  console.log('====================================================');
  console.log('STEP 6: PRODUCTS API VERIFICATION SUITE');
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

  // 1. Start test server
  await new Promise((resolve) => {
    testServer = app.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Step 6 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step6Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step6_${uniqueId}@example.com`;
  const adminEmail = `admin_step6_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;
  let testCategory;

  const createdProductIds = [];
  const createdAuditIds = [];

  try {
    console.log('--- 1. Seed Accounts & Authenticate ---');
    customerUser = await User.query().insert({
      name: 'Step6 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step6 Admin',
      email: adminEmail,
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    testCategory = await Category.query().insert({
      name: 'Stainless Steel Wardrobes',
      slug: `wardrobes-${uniqueId}`,
      is_active: true,
    });

    const custLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerEmail, password: testPassword }),
    });
    const custLoginData = await custLoginRes.json();
    customerToken = custLoginData.data?.accessToken;
    assert(customerToken, 'Customer authenticated');

    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: testPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.accessToken;
    assert(adminToken, 'Admin authenticated');

    // 2. Admin Create Product Tests
    console.log('\n--- 2. Admin Create Product Tests ---');
    const productSlug1 = `skf-royal-wardrobe-${uniqueId}`;
    const productCode1 = `SKF-WRD-001-${uniqueId}`;

    const createProdRes = await fetch(`${baseUrl}/api/v1/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'SKF Royal SS 304 Wardrobe',
        slug: productSlug1,
        product_code: productCode1,
        category_public_id: testCategory.public_id,
        short_description: 'Precision laser cut 304 grade wardrobe with brushed gold finish',
        description: 'Complete stainless steel cabinetry system engineered for humid luxury master bedrooms.',
        material: 'SS 304 Grade',
        finish: 'PVD Coated Brushed Gold',
        color: 'Gold',
        features: ['Anti-rust warranty 25 years', 'Soft close hydraulic hinges'],
        sizes: [{ width: 1200, depth: 600, height: 2100 }],
        customizable: true,
        featured: true,
        status: 'draft',
      }),
    });
    assert(createProdRes.status === 201, 'POST /api/v1/admin/products creates product (HTTP 201)');
    const createProdData = await createProdRes.json();
    const createdProduct1 = createProdData.data?.product;
    assert(createdProduct1 && createdProduct1.public_id, 'Created product has public_id');
    assert(createdProduct1.status === 'draft', 'Initial product status is draft');
    createdProductIds.push(createdProduct1.public_id);

    // Verify Audit Log for Product Create
    const prodCreateAudit = await AuditLog.query().where({ action: 'CREATE_PRODUCT' }).orderBy('created_at', 'desc').first();
    assert(prodCreateAudit && prodCreateAudit.user_id === adminUser.id, 'Audit log created for CREATE_PRODUCT');
    if (prodCreateAudit) createdAuditIds.push(prodCreateAudit.id);

    // Duplicate Slug Rejection
    const dupSlugRes = await fetch(`${baseUrl}/api/v1/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Duplicate Wardrobe',
        slug: productSlug1,
        product_code: `CODE-DIFF-${uniqueId}`,
        category_public_id: testCategory.public_id,
      }),
    });
    assert(dupSlugRes.status === 409, 'Duplicate product slug rejected with HTTP 409 (DUPLICATE_SLUG)');

    // Duplicate Product Code Rejection
    const dupCodeRes = await fetch(`${baseUrl}/api/v1/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Different Wardrobe',
        slug: `diff-slug-${uniqueId}`,
        product_code: productCode1,
        category_public_id: testCategory.public_id,
      }),
    });
    assert(dupCodeRes.status === 409, 'Duplicate product_code rejected with HTTP 409 (DUPLICATE_PRODUCT_CODE)');

    // Invalid Category Rejection
    const invalidCatRes = await fetch(`${baseUrl}/api/v1/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'No Cat Product',
        slug: `no-cat-${uniqueId}`,
        product_code: `NO-CAT-${uniqueId}`,
        category_public_id: '00000000-0000-4000-8000-000000000000',
      }),
    });
    assert(invalidCatRes.status === 404, 'Invalid category_public_id rejected with HTTP 404 (CATEGORY_NOT_FOUND)');

    // Create a second published product
    const productSlug2 = `skf-elite-wardrobe-${uniqueId}`;
    const productCode2 = `SKF-WRD-002-${uniqueId}`;
    const createProd2Res = await fetch(`${baseUrl}/api/v1/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'SKF Elite Wardrobe',
        slug: productSlug2,
        product_code: productCode2,
        category_public_id: testCategory.public_id,
        status: 'published',
        featured: true,
      }),
    });
    const createProd2Data = await createProd2Res.json();
    const createdProduct2 = createProd2Data.data?.product;
    createdProductIds.push(createdProduct2.public_id);

    // 3. Public Product Visibility & Filtering
    console.log('\n--- 3. Public Product Visibility & Filtering Tests ---');
    const pubListRes = await fetch(`${baseUrl}/api/v1/products`);
    assert(pubListRes.status === 200, 'GET /api/v1/products returns HTTP 200');
    const pubListData = await pubListRes.json();
    assert(Array.isArray(pubListData.data?.items), 'Public product items is an array');

    // Published product must be present
    const hasPublished = pubListData.data?.items.some((p) => p.public_id === createdProduct2.public_id);
    assert(hasPublished, 'Published product is present in public listing');

    // Draft product must NOT be present
    const hasDraft = pubListData.data?.items.some((p) => p.public_id === createdProduct1.public_id);
    assert(!hasDraft, 'Draft product is strictly hidden from public listing');

    // Category filter test
    const catFilterRes = await fetch(`${baseUrl}/api/v1/products?category_public_id=${testCategory.public_id}`);
    const catFilterData = await catFilterRes.json();
    assert(catFilterData.data?.items.some((p) => p.public_id === createdProduct2.public_id), 'Products filter by category_public_id');

    // 4. Public Product Detail
    console.log('\n--- 4. Public Product Detail Tests ---');
    const pubDetailRes = await fetch(`${baseUrl}/api/v1/products/${createdProduct2.public_id}`);
    assert(pubDetailRes.status === 200, 'GET /api/v1/products/:publicId returns HTTP 200 for published product');
    const pubDetailData = await pubDetailRes.json();
    assert(pubDetailData.data?.product?.name === 'SKF Elite Wardrobe', 'Product detail contains correct name');
    assert(pubDetailData.data?.product?.id === undefined, 'Public product detail does NOT expose internal ID');

    // Public detail for draft product returns 404
    const pubDraftDetailRes = await fetch(`${baseUrl}/api/v1/products/${createdProduct1.public_id}`);
    assert(pubDraftDetailRes.status === 404, 'Public request for draft product returns HTTP 404 (PRODUCT_NOT_FOUND)');

    // 5. Admin Product Operations & Lifecycle Tests
    console.log('\n--- 5. Admin Product Operations & Lifecycle Tests ---');
    // Admin list shows both draft and published
    const adminListRes = await fetch(`${baseUrl}/api/v1/admin/products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminListRes.status === 200, 'GET /api/v1/admin/products returns HTTP 200');
    const adminListData = await adminListRes.json();
    const adminHasDraft = adminListData.data?.items.some((p) => p.public_id === createdProduct1.public_id);
    assert(adminHasDraft, 'Admin product list includes draft products');

    // Admin detail for draft product works
    const adminDraftDetailRes = await fetch(`${baseUrl}/api/v1/admin/products/${createdProduct1.public_id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDraftDetailRes.status === 200, 'Admin can view draft product details (HTTP 200)');

    // Update Product
    const updateProdRes = await fetch(`${baseUrl}/api/v1/admin/products/${createdProduct1.public_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        material: 'SS 316 Marine Grade',
        finish: 'Brushed Rose Gold',
      }),
    });
    assert(updateProdRes.status === 200, 'PATCH /api/v1/admin/products/:publicId returns HTTP 200');
    const updateProdData = await updateProdRes.json();
    assert(updateProdData.data?.product?.material === 'SS 316 Marine Grade', 'Updated product material persists');

    // Publish Product via dedicated endpoint
    const publishProdRes = await fetch(`${baseUrl}/api/v1/admin/products/${createdProduct1.public_id}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(publishProdRes.status === 200, 'POST /api/v1/admin/products/:publicId/publish returns HTTP 200');
    const publishProdData = await publishProdRes.json();
    assert(publishProdData.data?.product?.status === 'published', 'Product status updated to published');

    // Archive Product
    const archiveProdRes = await fetch(`${baseUrl}/api/v1/admin/products/${createdProduct1.public_id}/archive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(archiveProdRes.status === 200, 'POST /api/v1/admin/products/:publicId/archive returns HTTP 200');
    const archiveProdData = await archiveProdRes.json();
    assert(archiveProdData.data?.product?.status === 'archived', 'Product status updated to archived');

    // Delete Product
    const deleteProdRes = await fetch(`${baseUrl}/api/v1/admin/products/${createdProduct1.public_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteProdRes.status === 200, 'DELETE /api/v1/admin/products/:publicId returns HTTP 200');
    createdProductIds.shift();

    // Verify Delete Audit Log
    const prodDelAudit = await AuditLog.query().where({ action: 'DELETE_PRODUCT' }).orderBy('created_at', 'desc').first();
    assert(prodDelAudit && prodDelAudit.user_id === adminUser.id, 'Audit log created for DELETE_PRODUCT');
    if (prodDelAudit) createdAuditIds.push(prodDelAudit.id);

  } catch (err) {
    console.error('Unexpected error in Step 6 tests:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 6 test records ---');
    try {
      if (createdProductIds.length > 0) {
        await Product.query().whereIn('public_id', createdProductIds).delete();
      }
      if (testCategory) {
        await Category.query().deleteById(testCategory.id);
      }
      if (createdAuditIds.length > 0) {
        await AuditLog.query().whereIn('id', createdAuditIds).delete();
      }
      const testUserIds = [customerUser?.id, adminUser?.id].filter(Boolean);
      if (testUserIds.length > 0) {
        await Session.query().whereIn('user_id', testUserIds).delete();
        await AuditLog.query().whereIn('user_id', testUserIds).delete();
        await User.query().whereIn('id', testUserIds).delete();
      }
      console.log('Step 6 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Error during Step 6 cleanup:', cleanupErr);
    }

    if (testServer) {
      testServer.close();
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 6 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  runStep6Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 6 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep6Tests;
