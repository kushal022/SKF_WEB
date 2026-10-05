// Integration test for Step 8: Customer Reviews Admin Management
const BASE_URL = 'http://localhost:7000/api/v1';

async function runTests() {
  console.log('--- Starting Step 8 Reviews Integration Tests ---');
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

  // 1. Admin Authentication
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

  // 2. Reviews List
  console.log('\n[2] Admin Reviews List');
  const listRes = await fetch(`${BASE_URL}/admin/reviews?page=1&limit=10`, {
    headers: authHeaders,
  });
  const listData = await listRes.json();
  assert(listRes.status === 200 && Array.isArray(listData.data?.items), 'Fetched admin reviews list');
  const initialTotal = listData.data?.pagination?.total ?? 0;
  console.log(`  Initial total reviews: ${initialTotal}`);

  // 3. Public Review Submission (Customer creates a review)
  console.log('\n[3] Public Review Submission');
  const timestamp = Date.now();
  const publicPayload = {
    customer_name: `Arjun Kapoor ${timestamp}`,
    rating: 5,
    review_text: 'Outstanding 304 stainless steel craftsmanship! The dining table with brushed gold accents exceeded all expectations.',
  };

  const submitRes = await fetch(`${BASE_URL}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(publicPayload),
  });
  const submitData = await submitRes.json();
  assert(submitRes.status === 201 && submitData.data?.public_id, `Public review submitted: ${submitData.data?.public_id}`);
  const reviewPublicId = submitData.data?.public_id;
  assert(submitData.data?.status === 'pending', 'Submitted review default status is pending moderation');

  // 4. Admin Fetch Detail
  console.log('\n[4] Admin Fetch Review Detail');
  const detailRes = await fetch(`${BASE_URL}/admin/reviews/${reviewPublicId}`, {
    headers: authHeaders,
  });
  const detailData = await detailRes.json();
  assert(
    detailRes.status === 200 && detailData.data?.public_id === reviewPublicId,
    `Admin fetched review detail for ${reviewPublicId}`
  );
  assert(detailData.data?.rating === 5, 'Review rating is 5 stars');
  assert(detailData.data?.is_featured === false, 'Review starts as not featured');

  // 5. Update Review Status -> Approved
  console.log('\n[5] Moderate Review: Approve');
  const approveRes = await fetch(`${BASE_URL}/admin/reviews/${reviewPublicId}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'approved' }),
  });
  const approveData = await approveRes.json();
  assert(approveRes.status === 200 && approveData.data?.status === 'approved', 'Review status updated to approved');

  // 6. Public Reviews Verification (Approved review visible publicly)
  console.log('\n[6] Public Reviews Verification');
  const publicListRes = await fetch(`${BASE_URL}/reviews`);
  const publicListData = await publicListRes.json();
  const isPresentPublicly = publicListData.data?.items?.some((r) => r.public_id === reviewPublicId);
  assert(publicListRes.status === 200 && isPresentPublicly, 'Approved review is now publicly visible');

  // 7. Toggle Featured State -> true
  console.log('\n[7] Set Review as Featured Showcase');
  const featureRes = await fetch(`${BASE_URL}/admin/reviews/${reviewPublicId}/featured`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ is_featured: true }),
  });
  const featureData = await featureRes.json();
  assert(featureRes.status === 200 && featureData.data?.is_featured === true, 'Review marked as featured showcase');

  // 8. Update Review Content (PATCH)
  console.log('\n[8] Update Review Content (PATCH)');
  const updatePayload = {
    customer_name: `Arjun Kapoor (Verified Architect) ${timestamp}`,
    rating: 5,
    review_text: 'Outstanding 304 stainless steel craftsmanship! The dining table with brushed gold accents exceeded all architectural specifications.',
  };
  const updateRes = await fetch(`${BASE_URL}/admin/reviews/${reviewPublicId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify(updatePayload),
  });
  const updateData = await updateRes.json();
  assert(
    updateRes.status === 200 &&
      updateData.data?.customer_name?.includes('Verified Architect'),
    'Review customer_name and text updated via PATCH'
  );

  // 9. Moderate Review: Reject
  console.log('\n[9] Moderate Review: Reject');
  const rejectRes = await fetch(`${BASE_URL}/admin/reviews/${reviewPublicId}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'rejected' }),
  });
  const rejectData = await rejectRes.json();
  assert(rejectRes.status === 200 && rejectData.data?.status === 'rejected', 'Review status updated to rejected');

  // 10. Verify Rejected Review is Hidden Publicly
  console.log('\n[10] Public Reviews Verification for Rejected Review');
  const publicAfterReject = await fetch(`${BASE_URL}/reviews`);
  const publicAfterRejectData = await publicAfterReject.json();
  const isPresentWhenRejected = publicAfterRejectData.data?.items?.some((r) => r.public_id === reviewPublicId);
  assert(!isPresentWhenRejected, 'Rejected review is hidden from public API');

  // 11. Admin Filters: Status, Rating, Search
  console.log('\n[11] Admin Filter Tests');
  const filterStatusRes = await fetch(`${BASE_URL}/admin/reviews?status=rejected`, {
    headers: authHeaders,
  });
  const filterStatusData = await filterStatusRes.json();
  const allRejected = filterStatusData.data?.items?.every((r) => r.status === 'rejected');
  assert(filterStatusRes.status === 200 && allRejected, 'Status filter "rejected" works accurately');

  const filterRatingRes = await fetch(`${BASE_URL}/admin/reviews?rating=5`, {
    headers: authHeaders,
  });
  const filterRatingData = await filterRatingRes.json();
  const allRating5 = filterRatingData.data?.items?.every((r) => r.rating === 5);
  assert(filterRatingRes.status === 200 && allRating5, 'Rating filter "5" works accurately');

  const searchRes = await fetch(`${BASE_URL}/admin/reviews?search=Verified+Architect`, {
    headers: authHeaders,
  });
  const searchData = await searchRes.json();
  assert(
    searchRes.status === 200 &&
      searchData.data?.items?.some((r) => r.public_id === reviewPublicId),
    'Search filter successfully found the review'
  );

  // 12. Delete Review
  console.log('\n[12] Delete Review');
  const deleteRes = await fetch(`${BASE_URL}/admin/reviews/${reviewPublicId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deleteData = await deleteRes.json();
  assert(deleteRes.status === 200 && deleteData.success, 'Review deleted successfully');

  // 13. Verify 404 after Deletion
  console.log('\n[13] Verify 404 After Deletion');
  const afterDeleteRes = await fetch(`${BASE_URL}/admin/reviews/${reviewPublicId}`, {
    headers: authHeaders,
  });
  assert(afterDeleteRes.status === 404, 'Deleted review returns 404 Not Found');

  // 14. Authentication Protection
  console.log('\n[14] Unauthorized Protection Check');
  const unauthRes = await fetch(`${BASE_URL}/admin/reviews`);
  assert(unauthRes.status === 401, 'Unauthenticated request to /admin/reviews correctly rejected with 401');

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
