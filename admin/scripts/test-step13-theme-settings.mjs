// test-step13-theme-settings.mjs
// Step 13 Theme & Website Settings Integration Tests

const BASE_URL = 'http://localhost:7000/api/v1';

async function runTests() {
  console.log('🧪 Starting Step 13 - Theme & Website Settings Integration Tests...\n');
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
    // =========================================================================
    // PART 1: WEBSITE SETTINGS TESTS
    // =========================================================================
    console.log('--- 1. Admin Authentication ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@skffurniture.com', password: '123456' }),
    });

    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken;
    assert(loginRes.status === 200 && Boolean(token), 'Admin login successful with accessToken');

    console.log('\n--- 2. Get Website Settings (GET /admin/settings) ---');
    const getSettingsRes = await fetch(`${BASE_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(getSettingsRes.status === 200, 'GET /admin/settings returned 200 OK');
    const getSettingsData = await getSettingsRes.json();
    const settings = getSettingsData.data?.settings;
    assert(Boolean(settings), 'Website settings object is present');
    assert(typeof settings.site_name === 'string', `site_name is present: "${settings.site_name}"`);

    console.log('\n--- 3. Update Website Settings (PATCH /admin/settings) ---');
    const updatedSettingsPayload = {
      site_name: 'SKF Luxury Stainless Steel Furniture',
      tagline: 'Precision 304/316 Architectural & Modular Craftsmanship',
      phone: '+91 98765 43210',
      whatsapp_number: '+91 98765 43210',
      email: 'sales@skffurniture.com',
      address: 'Plot No. 42, GIDC Industrial Estate, Phase 2, Vatva, Ahmedabad, Gujarat 382445, India',
      business_hours: {
        schedule: 'Mon – Sat: 9:00 AM – 7:30 PM (Sunday Closed)',
        monday: { isOpen: true, openTime: '09:00', closeTime: '19:30' },
        sunday: { isOpen: false, openTime: '10:00', closeTime: '17:00' },
      },
      social_links: {
        instagram: 'https://instagram.com/skffurniture',
        facebook: 'https://facebook.com/skffurniture',
        youtube: 'https://youtube.com/@skffurniture',
        linkedin: 'https://linkedin.com/company/skffurniture',
        website: 'https://skffurniture.com',
      },
      seo_defaults: {
        title: 'SKF Stainless Steel Furniture | Architectural Fabrication',
        meta_title: 'SKF Stainless Steel Furniture | Architectural Fabrication',
        description: 'Bespoke luxury 304/316 stainless steel dining tables, fixtures, and modular kitchens.',
        keywords: 'stainless steel furniture, architectural steel, luxury dining table',
      },
    };

    const patchSettingsRes = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedSettingsPayload),
    });
    assert(patchSettingsRes.status === 200, 'PATCH /admin/settings returned 200 OK');
    const patchSettingsData = await patchSettingsRes.json();
    const patched = patchSettingsData.data?.settings;
    assert(patched.site_name === 'SKF Luxury Stainless Steel Furniture', 'Updated site_name persists');
    assert(patched.phone === '+91 98765 43210', 'Updated phone persists');
    assert(patched.social_links?.instagram === 'https://instagram.com/skffurniture', 'Social links updated');

    console.log('\n--- 4. Verify Updated Website Settings via Fresh GET ---');
    const verifySettingsRes = await fetch(`${BASE_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifySettingsData = await verifySettingsRes.json();
    const persisted = verifySettingsData.data?.settings;
    assert(persisted.site_name === 'SKF Luxury Stainless Steel Furniture', 'site_name verified via fresh GET');
    assert(persisted.address.includes('Ahmedabad'), 'address verified via fresh GET');
    assert(Boolean(persisted.business_hours?.schedule), 'business_hours verified via fresh GET');

    console.log('\n--- 5. Website Settings Validation (Strict & Email) ---');
    const invalidEmailRes = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    assert(invalidEmailRes.status === 400, 'PATCH /admin/settings with invalid email returned 400 Bad Request');

    const strictRejectRes = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: 9999, invalid_field: 'attack' }),
    });
    assert(strictRejectRes.status === 400, 'Strict schema rejects arbitrary or internal id fields');

    console.log('\n--- 6. Unauthorized Website Settings Access ---');
    const unauthGetSettingsRes = await fetch(`${BASE_URL}/admin/settings`);
    assert(unauthGetSettingsRes.status === 401, 'GET /admin/settings without token returned 401 Unauthorized');

    const unauthPatchSettingsRes = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_name: 'Hacked' }),
    });
    assert(unauthPatchSettingsRes.status === 401, 'PATCH /admin/settings without token returned 401 Unauthorized');

    console.log('\n--- 7. Public Website Settings Endpoint ---');
    const pubSettingsRes = await fetch(`${BASE_URL}/settings/public`);
    assert(pubSettingsRes.status === 200, 'GET /settings/public returned 200 OK');
    const pubSettingsData = await pubSettingsRes.json();
    const pubSettings = pubSettingsData.data?.settings;
    assert(Boolean(pubSettings?.site_name), 'Public settings contains site_name');
    assert(pubSettings.id === undefined, 'Public settings does not expose internal ID');
    assert(pubSettings.active_theme_id === undefined, 'Public settings does not expose internal active_theme_id');

    // =========================================================================
    // PART 2: THEME & APPEARANCE TESTS
    // =========================================================================
    console.log('\n--- 8. Get Public Active Theme (GET /theme/public) ---');
    const pubThemeRes = await fetch(`${BASE_URL}/theme/public`);
    assert(pubThemeRes.status === 200, 'GET /theme/public returned 200 OK');
    const pubThemeData = await pubThemeRes.json();
    const initialActiveTheme = pubThemeData.data?.theme;
    assert(Boolean(initialActiveTheme), 'Public active theme object is present');
    assert(Boolean(initialActiveTheme.primary_color), `Public active theme has primary_color: ${initialActiveTheme.primary_color}`);
    assert(initialActiveTheme.id === undefined, 'Public active theme does not expose internal ID');
    assert(initialActiveTheme.created_by === undefined, 'Public active theme does not expose created_by');

    console.log('\n--- 9. Get Admin Themes (GET /admin/theme) ---');
    const adminThemesRes = await fetch(`${BASE_URL}/admin/theme`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(adminThemesRes.status === 200, 'GET /admin/theme returned 200 OK');
    const adminThemesData = await adminThemesRes.json();
    const themeList = adminThemesData.data?.themes;
    assert(Array.isArray(themeList), 'Admin themes response is an array');

    console.log('\n--- 10. Get Theme Presets (GET /admin/theme-presets) ---');
    const presetsRes = await fetch(`${BASE_URL}/admin/theme-presets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(presetsRes.status === 200, 'GET /admin/theme-presets returned 200 OK');
    const presetsData = await presetsRes.json();
    assert(Array.isArray(presetsData.data?.presets), 'Theme presets response is an array');

    console.log('\n--- 11. Create & Update Theme Draft ---');
    const uniqueThemeName = `Step13 Test Theme ${Date.now()}`;
    const createThemeRes = await fetch(`${BASE_URL}/admin/theme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: uniqueThemeName,
        primary_color: '#0f172a',
        secondary_color: '#475569',
        accent_color: '#0284c7',
        background_color: '#f8fafc',
        surface_color: '#ffffff',
        text_color: '#0f172a',
        muted_text_color: '#64748b',
        border_color: '#e2e8f0',
        heading_font: 'Outfit, sans-serif',
        body_font: 'Plus Jakarta Sans, sans-serif',
        border_radius: '12px',
        button_style: 'rounded',
        card_style: 'elevated',
        status: 'draft',
      }),
    });
    assert(createThemeRes.status === 201, 'POST /admin/theme created draft returned 201 Created');
    const createThemeData = await createThemeRes.json();
    const createdTheme = createThemeData.data?.theme;
    assert(Boolean(createdTheme?.public_id), 'Created theme has public_id');
    assert(createdTheme.status === 'draft', 'Created theme status is draft');
    assert(createdTheme.version === 1, 'Initial theme version is 1');

    // Update the draft
    const updateDraftRes = await fetch(`${BASE_URL}/admin/theme/${createdTheme.public_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        accent_color: '#38bdf8',
        border_radius: '16px',
      }),
    });
    assert(updateDraftRes.status === 200, 'PATCH /admin/theme/:publicId updated draft returned 200 OK');
    const updateDraftData = await updateDraftRes.json();
    const updatedDraft = updateDraftData.data?.theme;
    assert(updatedDraft.accent_color === '#38bdf8', 'Updated accent_color is #38bdf8');
    assert(updatedDraft.version === 2, 'Theme version incremented to 2 on update');

    console.log('\n--- 12. Verify Draft by Public ID (GET /admin/theme/:publicId) ---');
    const getThemeRes = await fetch(`${BASE_URL}/admin/theme/${createdTheme.public_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(getThemeRes.status === 200, 'GET /admin/theme/:publicId returned 200 OK');
    const getThemeData = await getThemeRes.json();
    assert(getThemeData.data?.theme?.border_radius === '16px', 'border_radius verified as 16px');

    console.log('\n--- 13. Publish Theme (POST /admin/theme/:publicId/publish) ---');
    const publishRes = await fetch(`${BASE_URL}/admin/theme/${createdTheme.public_id}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(publishRes.status === 200, 'POST /admin/theme/:publicId/publish returned 200 OK');
    const publishData = await publishRes.json();
    const published = publishData.data?.theme;
    assert(published.status === 'published', 'Published theme status changed to "published"');
    assert(Boolean(published.published_at), 'Published theme has published_at timestamp');
    assert(published.version === 3, 'Theme version incremented to 3 upon publish');

    console.log('\n--- 14. Verify Live Active Theme Reflects Published Theme ---');
    const verifyPubRes = await fetch(`${BASE_URL}/theme/public`);
    const verifyPubData = await verifyPubRes.json();
    const activeTheme = verifyPubData.data?.theme;
    assert(activeTheme.public_id === createdTheme.public_id, 'Active public theme public_id matches published theme');
    assert(activeTheme.accent_color === '#38bdf8', 'Active public theme accent_color is #38bdf8');
    assert(activeTheme.border_radius === '16px', 'Active public theme border_radius is 16px');

    console.log('\n--- 15. Unauthorized Theme Access Protection ---');
    const unauthThemeList = await fetch(`${BASE_URL}/admin/theme`);
    assert(unauthThemeList.status === 401, 'GET /admin/theme without token returned 401');

    const unauthThemePatch = await fetch(`${BASE_URL}/admin/theme/${createdTheme.public_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primary_color: '#000000' }),
    });
    assert(unauthThemePatch.status === 401, 'PATCH /admin/theme/:publicId without token returned 401');

    const unauthPublish = await fetch(`${BASE_URL}/admin/theme/${createdTheme.public_id}/publish`, {
      method: 'POST',
    });
    assert(unauthPublish.status === 401, 'POST /admin/theme/:publicId/publish without token returned 401');

    console.log('\n--- 16. Theme Schema Validation & Rejection ---');
    const invalidColorRes = await fetch(`${BASE_URL}/admin/theme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Invalid Color Theme',
        primary_color: 'this-is-not-a-valid-hex-code-because-it-exceeds-max-length',
      }),
    });
    assert(invalidColorRes.status === 400, 'POST /admin/theme with invalid color length returned 400 Bad Request');

    const strictThemeRes = await fetch(`${BASE_URL}/admin/theme/${createdTheme.public_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        forbidden_column: 'malicious',
      }),
    });
    assert(strictThemeRes.status === 400, 'PATCH /admin/theme rejects unauthorized/unknown columns');

    console.log('\n--- 17. Theme Presets Apply & Rollback Verification ---');
    // Create a temporary preset to test apply
    const createPresetRes = await fetch(`${BASE_URL}/admin/theme-presets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `Champagne Test ${Date.now()}`,
        description: 'Test Champagne Gold Preset',
        theme_config: {
          primary_color: '#1a1a1a',
          secondary_color: '#d4af37',
          accent_color: '#ffd700',
        },
      }),
    });
    assert(createPresetRes.status === 201, 'POST /admin/theme-presets returned 201 Created');
    const createPresetData = await createPresetRes.json();
    const preset = createPresetData.data?.preset;
    assert(Boolean(preset?.public_id), 'Theme preset created with public_id');

    // Apply preset to the theme
    const applyPresetRes = await fetch(`${BASE_URL}/admin/theme-presets/${preset.public_id}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        theme_public_id: createdTheme.public_id,
      }),
    });
    assert(applyPresetRes.status === 200, 'POST /admin/theme-presets/:publicId/apply returned 200 OK');
    const applyPresetData = await applyPresetRes.json();
    assert(applyPresetData.data?.theme?.secondary_color === '#d4af37', 'Preset applied secondary_color #d4af37 to target theme');

  } catch (err) {
    console.error('Unexpected error in Step 13 tests:', err);
    failed++;
  }

  console.log('\n================================');
  console.log(`Step 13 Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
