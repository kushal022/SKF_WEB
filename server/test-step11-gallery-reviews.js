const app = require('./src/app');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Gallery = require('./src/models/Gallery');
const GalleryImage = require('./src/models/GalleryImage');
const Review = require('./src/models/Review');
const AuditLog = require('./src/models/AuditLog');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep11Tests() {
  console.log('====================================================');
  console.log('STEP 11: GALLERY + REVIEWS VERIFICATION');
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
      console.log(`Step 11 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step11Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step11_${uniqueId}@example.com`;
  const adminEmail = `admin_step11_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;
  let testCategory;
  let testProduct;
  let createdGalleryPublicId;
  let draftGalleryPublicId;
  let createdGalleryImagePublicId;
  let createdReviewPublicId;

  try {
    console.log('--- 1. Seed Accounts & Product ---');
    customerUser = await User.query().insert({
      name: 'Step11 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step11 Admin',
      email: adminEmail,
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    testCategory = await Category.query().insert({
      name: 'SS Architectural Rails',
      slug: `ss-arch-rails-${uniqueId}`,
      is_active: true,
    });

    testProduct = await Product.query().insert({
      name: 'Modular Glass SS Railing',
      slug: `modular-glass-ss-railing-${uniqueId}`,
      product_code: `RAIL-${uniqueId}`,
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

    console.log('\n--- 2. Admin Gallery Creation & Management ---');
    // Create draft gallery
    const createDraftRes = await fetch(`${baseUrl}/api/v1/admin/galleries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Modern Highrise Balcony Railings',
        slug: `modern-highrise-railings-${uniqueId}`,
        category: 'Architectural Projects',
        description: 'Bespoke SS 316 balcony installations for luxury apartment towers.',
        status: 'draft',
      }),
    });
    const createDraftData = await createDraftRes.json();
    assert(createDraftRes.status === 201, 'POST /admin/galleries creates draft gallery (HTTP 201)');
    assert(Boolean(createDraftData.data.public_id), 'Draft gallery has public_id');
    draftGalleryPublicId = createDraftData.data.public_id;

    // Create published gallery
    const createPubRes = await fetch(`${baseUrl}/api/v1/admin/galleries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Commercial Restaurant Kitchen Installations',
        slug: `commercial-kitchen-installations-${uniqueId}`,
        category: 'Hospitality',
        description: 'Heavy duty SS worktables and custom ventilation hoods.',
        status: 'published',
      }),
    });
    const createPubData = await createPubRes.json();
    assert(createPubRes.status === 201, 'POST /admin/galleries creates published gallery (HTTP 201)');
    createdGalleryPublicId = createPubData.data.public_id;

    // Duplicate slug should fail with 409
    const dupSlugRes = await fetch(`${baseUrl}/api/v1/admin/galleries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Duplicate Slug Gallery',
        slug: `commercial-kitchen-installations-${uniqueId}`,
      }),
    });
    assert(dupSlugRes.status === 409, 'Duplicate gallery slug rejected with HTTP 409');

    // Admin Gallery list
    const adminGalListRes = await fetch(`${baseUrl}/api/v1/admin/galleries?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminGalListData = await adminGalListRes.json();
    assert(adminGalListRes.status === 200, 'GET /admin/galleries returns HTTP 200');
    assert(adminGalListData.data.items.length >= 2, 'Admin list includes both draft and published');

    // Admin Gallery update
    const updateGalRes = await fetch(`${baseUrl}/api/v1/admin/galleries/${createdGalleryPublicId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        description: 'Updated commercial restaurant kitchen installations description.',
      }),
    });
    const updateGalData = await updateGalRes.json();
    assert(updateGalRes.status === 200, 'PATCH /admin/galleries/:publicId returns HTTP 200');
    assert(
      updateGalData.data.description ===
        'Updated commercial restaurant kitchen installations description.',
      'Gallery description updated'
    );

    console.log('\n--- 3. Gallery Images CRUD ---');
    // Add image 1
    const addImg1Res = await fetch(
      `${baseUrl}/api/v1/admin/galleries/${createdGalleryPublicId}/images`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          image_url: 'https://res.cloudinary.com/skf/image/upload/v1/kitchen_project_1.jpg',
          cloudinary_public_id: 'skf/kitchen_project_1',
          alt_text: 'Stainless steel commercial cooking line installation',
          sort_order: 1,
        }),
      }
    );
    const addImg1Data = await addImg1Res.json();
    assert(addImg1Res.status === 201, 'POST /galleries/:publicId/images adds image (HTTP 201)');
    assert(Boolean(addImg1Data.data.public_id), 'Gallery image has public_id');
    createdGalleryImagePublicId = addImg1Data.data.public_id;

    // List images
    const listImgsRes = await fetch(
      `${baseUrl}/api/v1/admin/galleries/${createdGalleryPublicId}/images`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const listImgsData = await listImgsRes.json();
    assert(listImgsRes.status === 200 && listImgsData.data.length >= 1, 'GET /images lists gallery images');

    // Update image
    const updateImgRes = await fetch(
      `${baseUrl}/api/v1/admin/galleries/${createdGalleryPublicId}/images/${createdGalleryImagePublicId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          alt_text: 'Updated alt text for kitchen installation',
        }),
      }
    );
    const updateImgData = await updateImgRes.json();
    assert(updateImgRes.status === 200 && updateImgData.data.alt_text === 'Updated alt text for kitchen installation', 'PATCH /images/:imagePublicId updates image');

    console.log('\n--- 4. Public Gallery Visibility & Detail ---');
    // Public gallery listing (MUST ONLY SHOW PUBLISHED)
    const pubGalListRes = await fetch(`${baseUrl}/api/v1/galleries`);
    const pubGalListData = await pubGalListRes.json();
    assert(pubGalListRes.status === 200, 'GET /galleries returns HTTP 200');
    assert(
      pubGalListData.data.items.every((g) => g.status === 'published'),
      'Public listing ONLY contains published galleries'
    );
    const draftFoundInPublic = pubGalListData.data.items.some(
      (g) => g.public_id === draftGalleryPublicId
    );
    assert(!draftFoundInPublic, 'Draft gallery is NOT visible in public listing');

    // Public detail of published gallery
    const pubGalDetailRes = await fetch(`${baseUrl}/api/v1/galleries/${createdGalleryPublicId}`);
    const pubGalDetailData = await pubGalDetailRes.json();
    assert(pubGalDetailRes.status === 200, 'GET /galleries/:publicId returns HTTP 200 for published');
    assert(pubGalDetailData.data.images?.length >= 1, 'Public detail includes gallery images');

    // Public detail of draft gallery (MUST RETURN 404)
    const pubDraftDetailRes = await fetch(`${baseUrl}/api/v1/galleries/${draftGalleryPublicId}`);
    assert(pubDraftDetailRes.status === 404, 'Public access to draft gallery returns HTTP 404');

    // Publish draft gallery via dedicated endpoint
    const publishRes = await fetch(
      `${baseUrl}/api/v1/admin/galleries/${draftGalleryPublicId}/publish`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const publishData = await publishRes.json();
    assert(publishRes.status === 200, 'POST /publish publishes gallery');
    assert(publishData.data.status === 'published', 'Gallery status changed to published');

    // Archive gallery via dedicated endpoint
    const archiveRes = await fetch(
      `${baseUrl}/api/v1/admin/galleries/${draftGalleryPublicId}/archive`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const archiveData = await archiveRes.json();
    assert(archiveRes.status === 200, 'POST /archive archives gallery');
    assert(archiveData.data.status === 'archived', 'Gallery status changed to archived');

    console.log('\n--- 5. Public Reviews Submission & Moderation Lifecycle ---');
    // Public submit review
    const submitRevRes = await fetch(`${baseUrl}/api/v1/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Priya Mukherjee',
        rating: 5,
        review_text: 'Exceptional build quality on the SS railing! Highly recommended.',
        product_id: testProduct.public_id,
      }),
    });
    const submitRevData = await submitRevRes.json();
    assert(submitRevRes.status === 201, 'POST /reviews submits review (HTTP 201)');
    assert(Boolean(submitRevData.data?.public_id), 'Review has public_id');
    assert(submitRevData.data?.status === 'pending', 'Public review is created in "pending" status');
    assert(submitRevData.data?.id === undefined, 'Internal ID is not exposed');
    createdReviewPublicId = submitRevData.data?.public_id;

    // Public list reviews (PENDING REVIEW MUST NOT APPEAR)
    const pubRevListRes1 = await fetch(`${baseUrl}/api/v1/reviews`);
    const pubRevListData1 = await pubRevListRes1.json();
    assert(pubRevListRes1.status === 200, 'GET /reviews returns HTTP 200');
    const pendingFound = pubRevListData1.data.items.some(
      (r) => r.public_id === createdReviewPublicId
    );
    assert(!pendingFound, 'Pending review is NOT exposed on public GET /reviews');

    // Validation on rating range
    const invalidRatingRes = await fetch(`${baseUrl}/api/v1/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Tester',
        rating: 6, // Invalid
        review_text: 'Too good',
      }),
    });
    assert(invalidRatingRes.status === 400, 'Rating > 5 rejected with HTTP 400');

    console.log('\n--- 6. Admin Review Moderation & Featured Flag ---');
    // Admin list reviews (shows pending)
    const adminRevListRes = await fetch(`${baseUrl}/api/v1/admin/reviews?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminRevListData = await adminRevListRes.json();
    assert(adminRevListRes.status === 200, 'GET /admin/reviews returns HTTP 200');
    const foundInAdmin = adminRevListData.data.items.some(
      (r) => r.public_id === createdReviewPublicId
    );
    assert(foundInAdmin, 'Pending review appears in admin review moderation queue');

    // Admin approve review
    const approveRevRes = await fetch(
      `${baseUrl}/api/v1/admin/reviews/${createdReviewPublicId}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      }
    );
    const approveRevData = await approveRevRes.json();
    assert(approveRevRes.status === 200, 'POST /reviews/:publicId/status approves review');
    assert(approveRevData.data.status === 'approved', 'Review status is now approved');

    // Verify it now appears on public reviews endpoint
    const pubRevListRes2 = await fetch(`${baseUrl}/api/v1/reviews?product_id=${testProduct.public_id}`);
    const pubRevListData2 = await pubRevListRes2.json();
    const approvedFound = pubRevListData2.data.items.some(
      (r) => r.public_id === createdReviewPublicId
    );
    assert(approvedFound, 'Approved review now appears in public reviews endpoint');

    // Admin set featured
    const featRes = await fetch(
      `${baseUrl}/api/v1/admin/reviews/${createdReviewPublicId}/featured`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ is_featured: true }),
      }
    );
    const featData = await featRes.json();
    assert(featRes.status === 200, 'POST /featured updates featured flag');
    assert(featData.data.is_featured === true, 'Review is marked featured');

    // Admin detail
    const revDetailRes = await fetch(`${baseUrl}/api/v1/admin/reviews/${createdReviewPublicId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const revDetailData = await revDetailRes.json();
    assert(revDetailRes.status === 200, 'GET /admin/reviews/:publicId returns HTTP 200');
    assert(revDetailData.data.product?.public_id === testProduct.public_id, 'Review product details resolved');

    console.log('\n--- 7. Audit Logging Verification ---');
    const galAudits = await AuditLog.query().where('action', 'like', '%GALLERY%');
    assert(galAudits.length >= 3, 'Multiple audit logs recorded for gallery actions');
    const revAudits = await AuditLog.query().where('action', 'like', '%REVIEW%');
    assert(revAudits.length >= 2, 'Multiple audit logs recorded for review moderation');

  } catch (err) {
    console.error('Unexpected test error in Step 11:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 11 test records ---');
    try {
      if (createdReviewPublicId) {
        await Review.query().where({ public_id: createdReviewPublicId }).delete();
      }
      if (createdGalleryPublicId) {
        const gal = await Gallery.query().where({ public_id: createdGalleryPublicId }).first();
        if (gal) {
          await GalleryImage.query().where({ gallery_id: gal.id }).delete();
          await Gallery.query().deleteById(gal.id);
        }
      }
      if (draftGalleryPublicId) {
        const dGal = await Gallery.query().where({ public_id: draftGalleryPublicId }).first();
        if (dGal) {
          await GalleryImage.query().where({ gallery_id: dGal.id }).delete();
          await Gallery.query().deleteById(dGal.id);
        }
      }
      if (testProduct) await Product.query().deleteById(testProduct.id);
      if (testCategory) await Category.query().deleteById(testCategory.id);
      if (customerUser) await User.query().deleteById(customerUser.id);
      if (adminUser) await User.query().deleteById(adminUser.id);
      console.log('Step 11 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 11 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStep11Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 11 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep11Tests;
