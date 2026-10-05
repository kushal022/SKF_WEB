// test-step11-business-settings.mjs
// Step 11 Business Settings API verification test

const BASE_URL = 'http://localhost:7000/api/v1';

async function runTests() {
  console.log('🧪 Starting Step 11 - Business Settings Integration Tests...\n');
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
    // 1. Authenticate as admin
    console.log('1. Authenticating as admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@skffurniture.com', password: '123456' })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken;
    assert(loginRes.status === 200 && Boolean(token), 'Admin login successful and accessToken retrieved');

    // 2. Fetch current settings (GET /admin/settings)
    console.log('\n2. Fetching current settings...');
    const getRes = await fetch(`${BASE_URL}/admin/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(getRes.status === 200, 'GET /admin/settings returned 200 OK');
    const settingsData = await getRes.json();
    const settings = settingsData.data?.settings || settingsData.data || settingsData;
    assert(Boolean(settings), 'Settings object is present');
    assert(typeof settings.site_name === 'string', `site_name is present: "${settings.site_name}"`);

    // 3. Unauthorized access check (no token)
    console.log('\n3. Testing unauthorized access protection...');
    const unauthRes = await fetch(`${BASE_URL}/admin/settings`);
    assert(unauthRes.status === 401, 'GET /admin/settings without token returned 401 Unauthorized');

    // 4. Update settings (PATCH /admin/settings)
    console.log('\n4. Updating settings with new values...');
    const updatedPayload = {
      site_name: 'SKF Stainless Steel Furniture',
      tagline: 'Premium Grade 304/316 Architectural & Modular Furniture',
      phone: '+91 98765 43210',
      whatsapp_number: '+91 98765 43210',
      email: 'sales@skffurniture.com',
      address: 'Plot No. 42, GIDC Industrial Estate, Ahmedabad, Gujarat 382445, India',
      business_hours: {
        schedule: 'Mon - Sat: 9:00 AM - 7:30 PM (Sunday Closed)'
      },
      social_links: {
        instagram: 'https://instagram.com/skffurniture',
        facebook: 'https://facebook.com/skffurniture',
        youtube: 'https://youtube.com/@skffurniture'
      }
    };

    const patchRes = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedPayload)
    });

    assert(patchRes.status === 200, 'PATCH /admin/settings returned 200 OK');
    const patchData = await patchRes.json();
    const updated = patchData.data?.settings || patchData.data || patchData;
    assert(updated.phone === '+91 98765 43210', 'Phone successfully updated');
    assert(updated.email === 'sales@skffurniture.com', 'Email successfully updated');
    assert(typeof updated.address === 'string' && updated.address.includes('Ahmedabad'), 'Address successfully updated');
    assert(updated.social_links?.instagram === 'https://instagram.com/skffurniture', 'Social links updated');

    // 5. Verify persistence via fresh GET
    console.log('\n5. Verifying persistence with fresh GET...');
    const verifyRes = await fetch(`${BASE_URL}/admin/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const verifyData = await verifyRes.json();
    const persistent = verifyData.data?.settings || verifyData.data || verifyData;
    assert(persistent.phone === '+91 98765 43210', 'Phone persisted after fresh fetch');
    assert(persistent.address.includes('382445'), 'Address persisted after fresh fetch');

    // 6. Test strict schema rejection for invalid/extra fields
    console.log('\n6. Testing schema validation...');
    const invalidRes = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ unsupported_field: 'illegal' })
    });
    assert(invalidRes.status === 400, 'PATCH with extra/unsupported fields returned 400 Bad Request (strict schema enforcement)');

  } catch (err) {
    console.error('Unexpected error during testing:', err);
    failed++;
  }

  console.log(`\n================================`);
  console.log(`Step 11 Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
