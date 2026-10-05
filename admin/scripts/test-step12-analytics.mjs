// test-step12-analytics.mjs
// Step 12 Basic Analytics API verification test

const BASE_URL = 'http://localhost:7000/api/v1';

async function runTests() {
  console.log('🧪 Starting Step 12 - Basic Analytics Integration Tests...\n');
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

  try {
    // 1. Authenticate
    console.log('1. Authenticating as admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@skffurniture.com', password: '123456' }),
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken;
    assert(loginRes.status === 200 && Boolean(token), 'Admin login returned 200 with accessToken');
    const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // 2. Fetch dashboard summary
    console.log('\n2. Fetching dashboard summary...');
    const summaryRes = await fetch(`${BASE_URL}/admin/dashboard/summary`, { headers: authHeaders });
    assert(summaryRes.status === 200, 'GET /admin/dashboard/summary returned 200 OK');

    const summaryData = await summaryRes.json();
    const summary = summaryData.data;
    assert(Boolean(summary), 'Summary object is present in response');

    // 3. Validate top-level aggregate keys exist
    console.log('\n3. Validating aggregate key structure...');
    assert('users' in summary, 'summary.users aggregate is present');
    assert('products' in summary, 'summary.products aggregate is present');
    assert('enquiries' in summary, 'summary.enquiries aggregate is present');
    assert('customRequests' in summary, 'summary.customRequests aggregate is present');
    assert('quotations' in summary, 'summary.quotations aggregate is present');

    // 4. Validate numeric fields
    console.log('\n4. Validating numeric aggregate values...');
    assert(typeof summary.users?.total === 'number', `users.total is a number (${summary.users?.total})`);
    assert(typeof summary.products?.total === 'number', `products.total is a number (${summary.products?.total})`);
    assert(typeof summary.products?.published === 'number', `products.published is a number (${summary.products?.published})`);
    assert(typeof summary.enquiries?.total === 'number', `enquiries.total is a number (${summary.enquiries?.total})`);
    assert(typeof summary.enquiries?.new === 'number', `enquiries.new is a number (${summary.enquiries?.new})`);
    assert(typeof summary.quotations?.total === 'number', `quotations.total is a number (${summary.quotations?.total})`);
    assert(typeof summary.quotations?.sent === 'number', `quotations.sent is a number (${summary.quotations?.sent})`);
    assert(typeof summary.quotations?.accepted === 'number', `quotations.accepted is a number (${summary.quotations?.accepted})`);

    // 5. Verify new > total doesn't happen (sanity check)
    console.log('\n5. Sanity checking aggregate relationships...');
    assert(summary.enquiries.new <= summary.enquiries.total, 'enquiries.new <= enquiries.total');
    assert(summary.quotations.accepted <= summary.quotations.total, 'quotations.accepted <= quotations.total');
    assert(summary.products.published <= summary.products.total, 'products.published <= products.total');

    // 6. Unauthorized access check
    console.log('\n6. Testing unauthorized access protection...');
    const unauthRes = await fetch(`${BASE_URL}/admin/dashboard/summary`);
    assert(unauthRes.status === 401, 'GET /admin/dashboard/summary without token returned 401');

    // 7. Print summary for visibility
    console.log('\n📊 Dashboard Summary Snapshot:');
    console.log(`   Users (total/active): ${summary.users.total} / ${summary.users.active}`);
    console.log(`   Products (total/published/draft): ${summary.products.total} / ${summary.products.published} / ${summary.products.draft}`);
    console.log(`   Enquiries (total/new): ${summary.enquiries.total} / ${summary.enquiries.new}`);
    console.log(`   Quotations (total/sent/accepted): ${summary.quotations.total} / ${summary.quotations.sent} / ${summary.quotations.accepted}`);
    console.log(`   Custom Requests (total/new): ${summary.customRequests.total} / ${summary.customRequests.new}`);

  } catch (err) {
    console.error('Unexpected error during testing:', err);
    failed++;
  }

  console.log(`\n================================`);
  console.log(`Step 12 Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
