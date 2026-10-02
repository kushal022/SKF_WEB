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

async function runStep5Tests() {
  console.log('====================================================');
  console.log('STEP 5: CATEGORIES API VERIFICATION SUITE');
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
      console.log(`Step 5 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step5Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step5_${uniqueId}@example.com`;
  const adminEmail = `admin_step5_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;

  const createdCategoryIds = [];
  const createdProductIds = [];
  const createdAuditIds = [];

  try {
    console.log('--- 1. Seed Accounts & Authenticate ---');
    customerUser = await User.query().insert({
      name: 'Step5 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step5 Admin',
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
    assert(customerToken, 'Customer authenticated');

    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: testPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.accessToken;
    assert(adminToken, 'Admin authenticated');

    // 2. Admin Create Category Tests
    console.log('\n--- 2. Admin Create Category Tests ---');
    const parentSlug = `ss-tables-${uniqueId}`;
    const createParentRes = await fetch(`${baseUrl}/api/v1/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Stainless Steel Dining Tables',
        slug: parentSlug,
        description: 'Luxury SS 304 and 316 dining tables crafted for endurance',
        sort_order: 1,
        is_active: true,
      }),
    });
    assert(createParentRes.status === 201, 'POST /api/v1/admin/categories creates parent category (HTTP 201)');
    const createParentData = await createParentRes.json();
    const parentCategory = createParentData.data?.category;
    assert(parentCategory && parentCategory.public_id, 'Created parent category has public_id');
    createdCategoryIds.push(parentCategory.public_id);

    // Verify Duplicate Slug
    const duplicateSlugRes = await fetch(`${baseUrl}/api/v1/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Duplicate Tables',
        slug: parentSlug,
      }),
    });
    assert(duplicateSlugRes.status === 409, 'Duplicate category slug returns HTTP 409 (DUPLICATE_SLUG)');

    // Create Child Category
    const childSlug = `ss-coffee-tables-${uniqueId}`;
    const createChildRes = await fetch(`${baseUrl}/api/v1/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Coffee Tables',
        slug: childSlug,
        parent_public_id: parentCategory.public_id,
        sort_order: 2,
        is_active: true,
      }),
    });
    assert(createChildRes.status === 201, 'POST /api/v1/admin/categories creates child category with parent_public_id');
    const createChildData = await createChildRes.json();
    const childCategory = createChildData.data?.category;
    assert(childCategory.parent?.public_id === parentCategory.public_id, 'Child category links to parent public_id');
    createdCategoryIds.push(childCategory.public_id);

    // Create Inactive Category
    const inactiveSlug = `archived-stools-${uniqueId}`;
    const createInactiveRes = await fetch(`${baseUrl}/api/v1/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Draft Stools',
        slug: inactiveSlug,
        is_active: false,
      }),
    });
    assert(createInactiveRes.status === 201, 'POST /api/v1/admin/categories creates inactive category');
    const createInactiveData = await createInactiveRes.json();
    const inactiveCategory = createInactiveData.data?.category;
    createdCategoryIds.push(inactiveCategory.public_id);

    // Verify Audit Log for Category Create
    const catCreateAudit = await AuditLog.query().where({ action: 'CREATE_CATEGORY' }).orderBy('created_at', 'desc').first();
    assert(catCreateAudit && catCreateAudit.user_id === adminUser.id, 'Audit log created for CREATE_CATEGORY');
    if (catCreateAudit) createdAuditIds.push(catCreateAudit.id);

    // 3. Public Category Listing & Filtering Tests
    console.log('\n--- 3. Public Category Listing & Filtering Tests ---');
    const publicCatListRes = await fetch(`${baseUrl}/api/v1/categories`);
    assert(publicCatListRes.status === 200, 'GET /api/v1/categories returns HTTP 200');
    const publicCatListData = await publicCatListRes.json();
    assert(Array.isArray(publicCatListData.data?.items), 'Public categories data.items is an array');
    assert(publicCatListData.data?.pagination !== undefined, 'Public categories contains pagination info');

    // Inactive categories must NOT be in public list
    const hasInactive = publicCatListData.data?.items.some((c) => c.public_id === inactiveCategory.public_id);
    assert(!hasInactive, 'Inactive category is excluded from public category listing');

    // Search filter
    const searchCatRes = await fetch(`${baseUrl}/api/v1/categories?search=Dining`);
    const searchCatData = await searchCatRes.json();
    assert(searchCatData.data?.items.some((c) => c.public_id === parentCategory.public_id), 'Search query filters category by name');

    // 4. Public Category Detail Tests
    console.log('\n--- 4. Public Category Detail Tests ---');
    const pubCatDetailRes = await fetch(`${baseUrl}/api/v1/categories/${parentCategory.public_id}`);
    assert(pubCatDetailRes.status === 200, 'GET /api/v1/categories/:publicId returns HTTP 200');
    const pubCatDetailData = await pubCatDetailRes.json();
    assert(pubCatDetailData.data?.category?.name === 'Stainless Steel Dining Tables', 'Category name matches');
    assert(pubCatDetailData.data?.category?.id === undefined, 'Public category detail does NOT expose internal ID');

    // Inactive category detail should return 404
    const pubInactiveRes = await fetch(`${baseUrl}/api/v1/categories/${inactiveCategory.public_id}`);
    assert(pubInactiveRes.status === 404, 'Public request for inactive category returns HTTP 404');

    // 5. Admin Category Listing & Mutations
    console.log('\n--- 5. Admin Category Listing & Update Tests ---');
    const adminCatListRes = await fetch(`${baseUrl}/api/v1/admin/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminCatListRes.status === 200, 'GET /api/v1/admin/categories returns HTTP 200');
    const adminCatListData = await adminCatListRes.json();
    const adminHasInactive = adminCatListData.data?.items.some((c) => c.public_id === inactiveCategory.public_id);
    assert(adminHasInactive, 'Admin category listing includes inactive categories');

    // Update Category
    const updateCatRes = await fetch(`${baseUrl}/api/v1/admin/categories/${childCategory.public_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Premium Coffee Tables',
        sort_order: 10,
      }),
    });
    assert(updateCatRes.status === 200, 'PATCH /api/v1/admin/categories/:publicId returns HTTP 200');
    const updateCatData = await updateCatRes.json();
    assert(updateCatData.data?.category?.name === 'Premium Coffee Tables', 'Updated category name persists');

    // Circular Hierarchy Rejection: Self-parenting
    const selfParentRes = await fetch(`${baseUrl}/api/v1/admin/categories/${parentCategory.public_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        parent_public_id: parentCategory.public_id,
      }),
    });
    assert(selfParentRes.status === 400, 'Self-parenting rejected with HTTP 400 (CIRCULAR_PARENT_ERROR)');

    // Circular Hierarchy Rejection: Setting child as parent
    const childAsParentRes = await fetch(`${baseUrl}/api/v1/admin/categories/${parentCategory.public_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        parent_public_id: childCategory.public_id,
      }),
    });
    assert(childAsParentRes.status === 400, 'Setting descendant as parent rejected with HTTP 400 (CIRCULAR_PARENT_ERROR)');

    // 6. Safe Category Deletion Tests
    console.log('\n--- 6. Category Deletion & Product Constraint Tests ---');
    // Seed a product linked to childCategory to test RESTRICT constraint
    const testProduct = await Product.query().insert({
      name: 'Linked Test Table',
      slug: `linked-table-${uniqueId}`,
      product_code: `CODE-LINKED-${uniqueId}`,
      category_id: (await Category.query().where({ public_id: childCategory.public_id }).first()).id,
      status: 'draft',
    });
    createdProductIds.push(testProduct.id);

    // Attempt to delete category with linked product -> must be rejected (409)
    const deleteBlockedRes = await fetch(`${baseUrl}/api/v1/admin/categories/${childCategory.public_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteBlockedRes.status === 409, 'Deleting category with linked products is blocked with HTTP 409 (CATEGORY_HAS_PRODUCTS)');

    // Remove the product to permit safe category deletion
    await Product.query().deleteById(testProduct.id);
    createdProductIds.pop();

    // Now delete category
    const deleteSuccessRes = await fetch(`${baseUrl}/api/v1/admin/categories/${childCategory.public_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteSuccessRes.status === 200, 'DELETE /api/v1/admin/categories/:publicId succeeds when unlinked (HTTP 200)');

    // Verify Audit Log for Category Delete
    const catDelAudit = await AuditLog.query().where({ action: 'DELETE_CATEGORY' }).orderBy('created_at', 'desc').first();
    assert(catDelAudit && catDelAudit.user_id === adminUser.id, 'Audit log created for DELETE_CATEGORY');
    if (catDelAudit) createdAuditIds.push(catDelAudit.id);

  } catch (err) {
    console.error('Unexpected error in Step 5 tests:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 5 test records ---');
    try {
      if (createdProductIds.length > 0) {
        await Product.query().whereIn('id', createdProductIds).delete();
      }
      if (createdCategoryIds.length > 0) {
        await Category.query().whereIn('public_id', createdCategoryIds).delete();
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
      console.log('Step 5 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Error during Step 5 cleanup:', cleanupErr);
    }

    if (testServer) {
      testServer.close();
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 5 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  runStep5Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 5 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep5Tests;
