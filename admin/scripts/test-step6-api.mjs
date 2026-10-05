// Integration test for Step 6: Admin Custom Furniture Requests Management
const BASE_URL = 'http://localhost:7000/api/v1';

async function runTests() {
  console.log('--- Starting Step 6 Integration Tests ---');
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

  // 2. Submit Public Custom Furniture Request
  console.log('\n[2] Submit Public Custom Furniture Request');
  const publicRequestPayload = {
    product_type: 'executive_desk',
    width: 900,
    length: 2000,
    height: 760,
    dimension_unit: 'mm',
    material: 'SS 316',
    finish: 'hairline',
    quantity: 2,
    customer_name: 'Custom Integration Corp',
    phone: '+91 9887766554',
    email: 'custom@corp.com',
    city: 'Mumbai',
    requirement: 'Custom executive L-shaped stainless steel desk with integrated cable duct',
    estimated_amount: 45000,
    images: [
      {
        image_url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126',
        cloudinary_public_id: 'test/desk_1',
        sort_order: 0,
      },
    ],
  };

  const createRes = await fetch(`${BASE_URL}/custom-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(publicRequestPayload),
  });
  const createData = await createRes.json();
  assert(createRes.status === 201 && createData.data?.public_id, `Created custom request: ${createData.data?.public_id}`);
  const requestPublicId = createData.data?.public_id;

  // 3. Admin List Custom Requests
  console.log('\n[3] Admin List Custom Requests & Search');
  const listRes = await fetch(`${BASE_URL}/admin/custom-requests?page=1&limit=10`, {
    headers: authHeaders,
  });
  const listData = await listRes.json();
  assert(listRes.status === 200 && Array.isArray(listData.data?.items), 'Fetched admin custom requests list with pagination');

  // Search filter
  const searchRes = await fetch(`${BASE_URL}/admin/custom-requests?search=Custom%20Integration`, {
    headers: authHeaders,
  });
  const searchData = await searchRes.json();
  const searchFound = searchData.data?.items?.some((i) => i.public_id === requestPublicId);
  assert(searchRes.status === 200 && searchFound, 'Found created custom request via server-side search');

  // 4. Admin Get Custom Request Detail
  console.log('\n[4] Admin Get Custom Request Detail');
  const detailRes = await fetch(`${BASE_URL}/admin/custom-requests/${requestPublicId}`, {
    headers: authHeaders,
  });
  const detailData = await detailRes.json();
  const requestDetail = detailData.data;
  assert(
    detailRes.status === 200 && requestDetail?.customer_name === 'Custom Integration Corp',
    'Fetched custom request detail with customer snapshot'
  );
  assert(requestDetail?.status === 'new', 'Initial status is "new"');
  assert(Array.isArray(requestDetail?.images) && requestDetail.images.length === 1, 'Contains 1 attached reference image');
  assert(
    Array.isArray(requestDetail?.linked_enquiries) && requestDetail.linked_enquiries.length > 0,
    'Automatically linked to CRM enquiry'
  );

  // 5. Admin Update Custom Request Fields
  console.log('\n[5] Admin Update Custom Request Fields');
  const updateRes = await fetch(`${BASE_URL}/admin/custom-requests/${requestPublicId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      requirement: 'Updated requirement: Verified site dimensions and added power grommets.',
      estimated_amount: 48500,
    }),
  });
  const updateData = await updateRes.json();
  assert(
    updateRes.status === 200 && Number(updateData.data?.estimated_amount) === 48500,
    'Updated custom request requirement and estimated_amount'
  );

  // 6. Admin Status Lifecycle Transitions (new -> reviewing -> quoted -> approved -> completed)
  console.log('\n[6] Admin Status Lifecycle Transitions');
  // Transition new -> reviewing
  const revStatusRes = await fetch(`${BASE_URL}/admin/custom-requests/${requestPublicId}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'reviewing' }),
  });
  const revStatusData = await revStatusRes.json();
  assert(revStatusRes.status === 200 && revStatusData.data?.status === 'reviewing', 'Transitioned status: new -> reviewing');

  // Transition reviewing -> quoted
  const quotedStatusRes = await fetch(`${BASE_URL}/admin/custom-requests/${requestPublicId}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'quoted' }),
  });
  const quotedStatusData = await quotedStatusRes.json();
  assert(quotedStatusRes.status === 200 && quotedStatusData.data?.status === 'quoted', 'Transitioned status: reviewing -> quoted');

  // Transition quoted -> approved
  const appStatusRes = await fetch(`${BASE_URL}/admin/custom-requests/${requestPublicId}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'approved' }),
  });
  const appStatusData = await appStatusRes.json();
  assert(appStatusRes.status === 200 && appStatusData.data?.status === 'approved', 'Transitioned status: quoted -> approved');

  // Transition approved -> completed
  const compStatusRes = await fetch(`${BASE_URL}/admin/custom-requests/${requestPublicId}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'completed' }),
  });
  const compStatusData = await compStatusRes.json();
  assert(compStatusRes.status === 200 && compStatusData.data?.status === 'completed', 'Transitioned status: approved -> completed');

  // Test invalid transition from terminal state completed -> reviewing
  const invalidStatusRes = await fetch(`${BASE_URL}/admin/custom-requests/${requestPublicId}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'reviewing' }),
  });
  assert(
    invalidStatusRes.status === 400,
    'Backend correctly rejected invalid status transition from terminal "completed" state'
  );

  // 7. Custom Request Images CRUD
  console.log('\n[7] Custom Request Images CRUD');
  // List images
  const imagesListRes = await fetch(`${BASE_URL}/admin/custom-requests/${requestPublicId}/images`, {
    headers: authHeaders,
  });
  const imagesListData = await imagesListRes.json();
  assert(imagesListRes.status === 200 && Array.isArray(imagesListData.data), 'Fetched custom request images list');

  // Add image
  const addImageRes = await fetch(`${BASE_URL}/admin/custom-requests/${requestPublicId}/images`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7',
      cloudinary_public_id: 'test/desk_2',
      sort_order: 1,
    }),
  });
  const addImageData = await addImageRes.json();
  assert(addImageRes.status === 201 && addImageData.data?.public_id, 'Added second reference image');
  const addedImagePublicId = addImageData.data?.public_id;

  // Update image
  const updateImageRes = await fetch(
    `${BASE_URL}/admin/custom-requests/${requestPublicId}/images/${addedImagePublicId}`,
    {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ sort_order: 2 }),
    }
  );
  assert(updateImageRes.status === 200, 'Updated image sort_order');

  // Delete image
  const deleteImageRes = await fetch(
    `${BASE_URL}/admin/custom-requests/${requestPublicId}/images/${addedImagePublicId}`,
    {
      method: 'DELETE',
      headers: authHeaders,
    }
  );
  assert(deleteImageRes.status === 200, 'Deleted second reference image');

  // 8. Estimator Integration with Custom Request values
  console.log('\n[8] Estimator Integration with Custom Request values');
  const calcRes = await fetch(`${BASE_URL}/estimator/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_type: requestDetail.product_type,
      width: requestDetail.width || 900,
      length: requestDetail.length || 2000,
      height: requestDetail.height || 760,
      dimension_unit: requestDetail.dimension_unit || 'mm',
      material: requestDetail.material,
      finish: requestDetail.finish,
      quantity: requestDetail.quantity || 1,
    }),
  });
  const calcData = await calcRes.json();
  assert(
    calcRes.status === 200 && calcData.data?.total_estimate !== undefined,
    `Calculated live estimate for custom request: ₹${calcData.data?.total_estimate}`
  );

  console.log('\n======================================');
  console.log(`Total tests passed: ${passed}`);
  console.log(`Total tests failed: ${failed}`);
  console.log('======================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
