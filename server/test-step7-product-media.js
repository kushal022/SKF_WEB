const express = require('express');
const app = require('./src/app');
const config = require('./src/config');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Session = require('./src/models/Session');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const ProductImage = require('./src/models/ProductImage');
const ProductVideo = require('./src/models/ProductVideo');
const ProductSpec = require('./src/models/ProductSpec');
const AuditLog = require('./src/models/AuditLog');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep7Tests() {
  console.log('====================================================');
  console.log('STEP 7: PRODUCT MEDIA + SPECIFICATIONS VERIFICATION');
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
      console.log(`Step 7 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step7Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step7_${uniqueId}@example.com`;
  const adminEmail = `admin_step7_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;
  let testCategory;
  let testProduct;

  const createdAuditIds = [];

  try {
    console.log('--- 1. Seed Accounts & Baseline Product ---');
    customerUser = await User.query().insert({
      name: 'Step7 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step7 Admin',
      email: adminEmail,
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    testCategory = await Category.query().insert({
      name: 'SS Dining Tables',
      slug: `ss-dining-${uniqueId}`,
      is_active: true,
    });

    testProduct = await Product.query().insert({
      name: 'Imperial SS Dining Table',
      slug: `imperial-dining-${uniqueId}`,
      product_code: `IMP-DT-${uniqueId}`,
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
    assert(customerToken, 'Customer authenticated');

    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: testPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.accessToken;
    assert(adminToken, 'Admin authenticated');

    // 2. Product Images CRUD & Actions
    console.log('\n--- 2. Product Images CRUD & Operations ---');
    // Add image 1
    const addImg1Res = await fetch(`${baseUrl}/api/v1/admin/products/${testProduct.public_id}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        image_url: 'https://res.cloudinary.com/skf/image/upload/v1/table_front.jpg',
        public_cloudinary_id: 'skf/table_front',
        alt_text: 'Front view of luxury dining table',
        sort_order: 1,
        is_primary: true,
      }),
    });
    assert(addImg1Res.status === 201, 'POST /images creates product image (HTTP 201)');
    const addImg1Data = await addImg1Res.json();
    const image1 = addImg1Data.data?.image;
    assert(image1 && image1.public_id, 'Image 1 has public_id');
    assert(image1.is_primary === true, 'Image 1 set as primary');

    // Add image 2
    const addImg2Res = await fetch(`${baseUrl}/api/v1/admin/products/${testProduct.public_id}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        image_url: 'https://res.cloudinary.com/skf/image/upload/v1/table_angle.jpg',
        public_cloudinary_id: 'skf/table_angle',
        alt_text: 'Side angled view of polished steel leg',
        sort_order: 2,
        is_primary: false,
      }),
    });
    assert(addImg2Res.status === 201, 'POST /images creates second image');
    const addImg2Data = await addImg2Res.json();
    const image2 = addImg2Data.data?.image;

    // List Images
    const listImgRes = await fetch(`${baseUrl}/api/v1/admin/products/${testProduct.public_id}/images`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(listImgRes.status === 200, 'GET /images returns HTTP 200');
    const listImgData = await listImgRes.json();
    assert(listImgData.data?.images?.length === 2, 'Two images returned in listing');

    // Set Image 2 as Primary
    const setPrimaryRes = await fetch(
      `${baseUrl}/api/v1/admin/products/${testProduct.public_id}/images/${image2.public_id}/primary`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert(setPrimaryRes.status === 200, 'POST /images/:imagePublicId/primary returns HTTP 200');

    // Verify Primary swapped in DB
    const img1Updated = await ProductImage.query().where({ public_id: image1.public_id }).first();
    const img2Updated = await ProductImage.query().where({ public_id: image2.public_id }).first();
    assert(img1Updated.is_primary === 0 || img1Updated.is_primary === false, 'Image 1 is no longer primary');
    assert(img2Updated.is_primary === 1 || img2Updated.is_primary === true, 'Image 2 is now primary');

    // Verify Audit Log for Primary Image
    const primAudit = await AuditLog.query().where({ action: 'SET_PRIMARY_PRODUCT_IMAGE' }).orderBy('created_at', 'desc').first();
    assert(primAudit && primAudit.user_id === adminUser.id, 'Audit log created for SET_PRIMARY_PRODUCT_IMAGE');
    if (primAudit) createdAuditIds.push(primAudit.id);

    // Reorder Images
    const reorderRes = await fetch(`${baseUrl}/api/v1/admin/products/${testProduct.public_id}/images/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        items: [
          { public_id: image1.public_id, sort_order: 10 },
          { public_id: image2.public_id, sort_order: 5 },
        ],
      }),
    });
    assert(reorderRes.status === 200, 'PATCH /images/reorder returns HTTP 200');

    // Update Image details
    const updateImgRes = await fetch(
      `${baseUrl}/api/v1/admin/products/${testProduct.public_id}/images/${image1.public_id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ alt_text: 'Updated alt description' }),
      }
    );
    assert(updateImgRes.status === 200, 'PATCH /images/:imagePublicId returns HTTP 200');
    const updateImgData = await updateImgRes.json();
    assert(updateImgData.data?.image?.alt_text === 'Updated alt description', 'Updated alt text persists');

    // Delete Image 1
    const delImgRes = await fetch(
      `${baseUrl}/api/v1/admin/products/${testProduct.public_id}/images/${image1.public_id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert(delImgRes.status === 200, 'DELETE /images/:imagePublicId returns HTTP 200');

    // 3. Product Videos CRUD
    console.log('\n--- 3. Product Videos CRUD ---');
    // Add Video
    const addVidRes = await fetch(`${baseUrl}/api/v1/admin/products/${testProduct.public_id}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        video_url: 'https://youtube.com/watch?v=sample123',
        title: '360 Table Showcase',
        sort_order: 1,
        is_active: true,
      }),
    });
    assert(addVidRes.status === 201, 'POST /videos returns HTTP 201');
    const addVidData = await addVidRes.json();
    const video = addVidData.data?.video;
    assert(video && video.public_id, 'Created video has public_id');

    // List Videos
    const listVidRes = await fetch(`${baseUrl}/api/v1/admin/products/${testProduct.public_id}/videos`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(listVidRes.status === 200, 'GET /videos returns HTTP 200');

    // Update Video
    const updateVidRes = await fetch(
      `${baseUrl}/api/v1/admin/products/${testProduct.public_id}/videos/${video.public_id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ title: 'Updated Showcase Title' }),
      }
    );
    assert(updateVidRes.status === 200, 'PATCH /videos/:videoPublicId returns HTTP 200');

    // 4. Product Specifications CRUD
    console.log('\n--- 4. Product Specifications CRUD ---');
    // Add Spec
    const addSpecRes = await fetch(`${baseUrl}/api/v1/admin/products/${testProduct.public_id}/specs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        spec_name: 'Steel Grade',
        spec_value: 'AISI 304 High Nickel Content',
        sort_order: 1,
      }),
    });
    assert(addSpecRes.status === 201, 'POST /specs returns HTTP 201');
    const addSpecData = await addSpecRes.json();
    const spec = addSpecData.data?.spec;
    assert(spec && spec.public_id, 'Created spec has public_id');

    // List Specs
    const listSpecRes = await fetch(`${baseUrl}/api/v1/admin/products/${testProduct.public_id}/specs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(listSpecRes.status === 200, 'GET /specs returns HTTP 200');

    // Update Spec
    const updateSpecRes = await fetch(
      `${baseUrl}/api/v1/admin/products/${testProduct.public_id}/specs/${spec.public_id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ spec_value: 'AISI 316 Marine Grade' }),
      }
    );
    assert(updateSpecRes.status === 200, 'PATCH /specs/:specPublicId returns HTTP 200');

    // 5. Verification on Public Product Detail (Integration)
    console.log('\n--- 5. Integration Verification on Public Product Detail ---');
    const pubDetailRes = await fetch(`${baseUrl}/api/v1/products/${testProduct.public_id}`);
    assert(pubDetailRes.status === 200, 'Public product detail returns HTTP 200');
    const pubDetailData = await pubDetailRes.json();
    const prod = pubDetailData.data?.product;
    assert(prod.images?.length === 1, 'Product images included in public detail');
    assert(prod.videos?.length === 1, 'Product videos included in public detail');
    assert(prod.specs?.length === 1, 'Product specs included in public detail');
    assert(prod.specs[0].spec_name === 'Steel Grade', 'Spec name reflects in public detail');

    // 6. Delete Spec & Video
    console.log('\n--- 6. Deletion of Spec & Video ---');
    const delSpecRes = await fetch(
      `${baseUrl}/api/v1/admin/products/${testProduct.public_id}/specs/${spec.public_id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert(delSpecRes.status === 200, 'DELETE /specs/:specPublicId returns HTTP 200');

    const delVidRes = await fetch(
      `${baseUrl}/api/v1/admin/products/${testProduct.public_id}/videos/${video.public_id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert(delVidRes.status === 200, 'DELETE /videos/:videoPublicId returns HTTP 200');

  } catch (err) {
    console.error('Unexpected error in Step 7 tests:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 7 test records ---');
    try {
      if (testProduct) {
        await ProductImage.query().where('product_id', testProduct.id).delete();
        await ProductVideo.query().where('product_id', testProduct.id).delete();
        await ProductSpec.query().where('product_id', testProduct.id).delete();
        await Product.query().deleteById(testProduct.id);
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
      console.log('Step 7 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Error during Step 7 cleanup:', cleanupErr);
    }

    if (testServer) {
      testServer.close();
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 7 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  runStep7Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 7 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep7Tests;
