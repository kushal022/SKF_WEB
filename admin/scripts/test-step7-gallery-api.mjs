// Integration test for Step 7: Gallery Admin Management
const BASE_URL = 'http://localhost:7000/api/v1';

async function runTests() {
  console.log('--- Starting Step 7 Gallery Integration Tests ---');
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

  // 1. Authenticate Admin
  console.log('\n[1] Admin Authentication');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@skffurniture.com', password: '123456' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  assert(loginRes.status === 200 && Boolean(token), 'Admin login succeeded and accessToken received');
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Gallery List
  console.log('\n[2] Gallery List');
  const listRes = await fetch(`${BASE_URL}/admin/galleries?page=1&limit=10`, {
    headers: authHeaders,
  });
  const listData = await listRes.json();
  assert(listRes.status === 200 && Array.isArray(listData.data?.items), 'Fetched admin galleries list');

  // 3. Create Gallery Project
  console.log('\n[3] Create Gallery Project');
  const testSlug = `test-luxury-penthouse-dining-${Date.now()}`;
  const createPayload = {
    title: 'Luxury Stainless Steel Penthouse Dining Showcase',
    slug: testSlug,
    category: 'residential',
    description: 'High-grade mirror finish 316 stainless steel bespoke dining suite designed for luxury residences.',
    status: 'draft',
  };

  const createRes = await fetch(`${BASE_URL}/admin/galleries`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(createPayload),
  });
  const createData = await createRes.json();
  assert(createRes.status === 201 && createData.data?.public_id, `Created gallery showcase: ${createData.data?.public_id}`);
  const galleryPublicId = createData.data?.public_id;

  // 4. Get Gallery Detail
  console.log('\n[4] Get Gallery Detail');
  const detailRes = await fetch(`${BASE_URL}/admin/galleries/${galleryPublicId}`, {
    headers: authHeaders,
  });
  const detailData = await detailRes.json();
  assert(
    detailRes.status === 200 && detailData.data?.title === 'Luxury Stainless Steel Penthouse Dining Showcase',
    'Retrieved gallery detail matching title and slug'
  );
  assert(detailData.data?.status === 'draft', 'Initial status is "draft"');

  // 5. Update Gallery Project
  console.log('\n[5] Update Gallery Project');
  const updateRes = await fetch(`${BASE_URL}/admin/galleries/${galleryPublicId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      description: 'Updated architectural description with grade 316 specifications.',
    }),
  });
  const updateData = await updateRes.json();
  assert(
    updateRes.status === 200 && updateData.data?.description.includes('grade 316 specifications'),
    'Updated gallery showcase description'
  );

  // 6. Publish Gallery
  console.log('\n[6] Publish Gallery Project');
  const publishRes = await fetch(`${BASE_URL}/admin/galleries/${galleryPublicId}/publish`, {
    method: 'POST',
    headers: authHeaders,
  });
  const publishData = await publishRes.json();
  assert(publishRes.status === 200 && publishData.data?.status === 'published', 'Gallery status transitioned to "published"');

  // 7. Archive Gallery
  console.log('\n[7] Archive Gallery Project');
  const archiveRes = await fetch(`${BASE_URL}/admin/galleries/${galleryPublicId}/archive`, {
    method: 'POST',
    headers: authHeaders,
  });
  const archiveData = await archiveRes.json();
  assert(archiveRes.status === 200 && archiveData.data?.status === 'archived', 'Gallery status transitioned to "archived"');

  // 8. Search & Category Filters
  console.log('\n[8] Search & Filters');
  const searchRes = await fetch(`${BASE_URL}/admin/galleries?search=Penthouse&category=residential`, {
    headers: authHeaders,
  });
  const searchData = await searchRes.json();
  const found = searchData.data?.items?.some((i) => i.public_id === galleryPublicId);
  assert(searchRes.status === 200 && found, 'Found created gallery via search and category filters');

  // 9. Gallery Images CRUD
  console.log('\n[9] Gallery Images CRUD');
  // Add image 1
  const addImg1Res = await fetch(`${BASE_URL}/admin/galleries/${galleryPublicId}/images`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
      cloudinary_public_id: 'test/penthouse_front',
      alt_text: 'Penthouse Dining Front View',
      sort_order: 0,
    }),
  });
  const addImg1Data = await addImg1Res.json();
  assert(addImg1Res.status === 201 && addImg1Data.data?.public_id, 'Added first gallery image');

  // Add image 2
  const addImg2Res = await fetch(`${BASE_URL}/admin/galleries/${galleryPublicId}/images`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace',
      cloudinary_public_id: 'test/penthouse_detail',
      alt_text: 'Penthouse Detail Joint',
      sort_order: 1,
    }),
  });
  const addImg2Data = await addImg2Res.json();
  assert(addImg2Res.status === 201 && addImg2Data.data?.public_id, 'Added second gallery image');
  const img2PublicId = addImg2Data.data?.public_id;

  // List images
  const listImgsRes = await fetch(`${BASE_URL}/admin/galleries/${galleryPublicId}/images`, {
    headers: authHeaders,
  });
  const listImgsData = await listImgsRes.json();
  assert(listImgsRes.status === 200 && listImgsData.data?.length === 2, 'Listed 2 gallery images');

  // Update image 2
  const updateImg2Res = await fetch(
    `${BASE_URL}/admin/galleries/${galleryPublicId}/images/${img2PublicId}`,
    {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        alt_text: 'Updated Alt Text For Weld Detail',
        sort_order: 5,
      }),
    }
  );
  const updateImg2Data = await updateImg2Res.json();
  assert(
    updateImg2Res.status === 200 && updateImg2Data.data?.alt_text === 'Updated Alt Text For Weld Detail',
    'Updated gallery image alt_text and sort_order'
  );

  // Delete image 2
  const deleteImg2Res = await fetch(
    `${BASE_URL}/admin/galleries/${galleryPublicId}/images/${img2PublicId}`,
    {
      method: 'DELETE',
      headers: authHeaders,
    }
  );
  assert(deleteImg2Res.status === 200, 'Deleted second gallery image');

  // Verify remaining images count is 1
  const checkImgsRes = await fetch(`${BASE_URL}/admin/galleries/${galleryPublicId}/images`, {
    headers: authHeaders,
  });
  const checkImgsData = await checkImgsRes.json();
  assert(checkImgsRes.status === 200 && checkImgsData.data?.length === 1, 'Verified 1 gallery image remains');

  // 10. Delete Gallery Project
  console.log('\n[10] Delete Gallery Project');
  const deleteRes = await fetch(`${BASE_URL}/admin/galleries/${galleryPublicId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  assert(deleteRes.status === 200, `Deleted gallery project: ${galleryPublicId}`);

  console.log('\n======================================');
  console.log(`Total Step 7 tests passed: ${passed}`);
  console.log(`Total Step 7 tests failed: ${failed}`);
  console.log('======================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal Step 7 test error:', err);
  process.exit(1);
});
