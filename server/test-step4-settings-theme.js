const express = require('express');
const app = require('./src/app');
const config = require('./src/config');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Session = require('./src/models/Session');
const WebsiteSetting = require('./src/models/WebsiteSetting');
const ThemeSetting = require('./src/models/ThemeSetting');
const ThemePreset = require('./src/models/ThemePreset');
const AuditLog = require('./src/models/AuditLog');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep4Tests() {
  console.log('====================================================');
  console.log('STEP 4: WEBSITE SETTINGS + DYNAMIC THEME VERIFICATION');
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
      console.log(`Step 4 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step4Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step4_${uniqueId}@example.com`;
  const adminEmail = `admin_step4_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;

  const createdThemeIds = [];
  const createdPresetIds = [];
  const createdAuditIds = [];

  try {
    console.log('--- 1. Seed Accounts & Authenticate ---');
    customerUser = await User.query().insert({
      name: 'Step4 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step4 Admin',
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
    assert(customerToken, 'Customer authenticated successfully');

    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: testPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.accessToken;
    assert(adminToken, 'Admin authenticated successfully');

    // 2. Public Settings Endpoint
    console.log('\n--- 2. Public Settings Endpoint Tests ---');
    const pubSetRes = await fetch(`${baseUrl}/api/v1/settings/public`);
    assert(pubSetRes.status === 200, 'GET /api/v1/settings/public returns HTTP 200');
    const pubSetData = await pubSetRes.json();
    assert(pubSetData.success === true, 'Public settings returns success: true');
    assert(pubSetData.data?.settings !== undefined, 'Public settings contains settings object');
    assert(pubSetData.data?.settings?.site_name !== undefined, 'Public settings contains site_name');
    assert(pubSetData.data?.settings?.id === undefined, 'Public settings does NOT expose internal ID');
    assert(pubSetData.data?.settings?.active_theme_id === undefined, 'Public settings does NOT expose internal active_theme_id');

    // 3. Admin Settings Authorization & Updates
    console.log('\n--- 3. Admin Settings Access & Mutation Tests ---');
    const unauthSetRes = await fetch(`${baseUrl}/api/v1/admin/settings`);
    assert(unauthSetRes.status === 401, 'Unauthenticated GET /api/v1/admin/settings returns HTTP 401');

    const custSetRes = await fetch(`${baseUrl}/api/v1/admin/settings`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custSetRes.status === 403, 'Customer GET /api/v1/admin/settings returns HTTP 403');

    const adminSetRes = await fetch(`${baseUrl}/api/v1/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminSetRes.status === 200, 'Admin GET /api/v1/admin/settings returns HTTP 200');
    const adminSetData = await adminSetRes.json();
    assert(adminSetData.data?.settings?.public_id !== undefined, 'Admin settings exposes public_id');

    // Update Settings
    const updateSetRes = await fetch(`${baseUrl}/api/v1/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        site_name: 'SKF Luxury Stainless Steel',
        phone: '+91 98765 43210',
        whatsapp_number: '+91 98765 43210',
        tagline: 'Precision Engineered Stainless Steel',
      }),
    });
    assert(updateSetRes.status === 200, 'Admin PATCH /api/v1/admin/settings returns HTTP 200');
    const updateSetData = await updateSetRes.json();
    assert(updateSetData.data?.settings?.site_name === 'SKF Luxury Stainless Steel', 'Updated site_name persists');
    assert(updateSetData.data?.settings?.phone === '+91 98765 43210', 'Updated phone persists');

    // Verify Audit Log for Settings update
    const setAudit = await AuditLog.query().where({ action: 'UPDATE_WEBSITE_SETTINGS' }).orderBy('created_at', 'desc').first();
    assert(setAudit && setAudit.user_id === adminUser.id, 'Audit log created for UPDATE_WEBSITE_SETTINGS');
    if (setAudit) createdAuditIds.push(setAudit.id);

    // Verify Strict Schema Rejection
    const strictRejectRes = await fetch(`${baseUrl}/api/v1/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: 99999,
        site_name: 'Hacked',
      }),
    });
    assert(strictRejectRes.status === 400, 'Strict validator rejects modification of internal id field');

    // 4. Admin Theme Management Tests
    console.log('\n--- 4. Theme Settings Management Tests ---');
    const getThemesRes = await fetch(`${baseUrl}/api/v1/admin/theme`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(getThemesRes.status === 200, 'GET /api/v1/admin/theme returns HTTP 200');
    const getThemesData = await getThemesRes.json();
    assert(Array.isArray(getThemesData.data?.themes), 'Admin theme list is an array');

    // Create Theme
    const createThemeRes = await fetch(`${baseUrl}/api/v1/admin/theme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Platinum Modern Steel',
        primary_color: '#0f172a',
        secondary_color: '#e2e8f0',
        accent_color: '#38bdf8',
        background_color: '#ffffff',
        surface_color: '#f8fafc',
        text_color: '#0f172a',
        heading_font: 'Outfit, sans-serif',
        body_font: 'Plus Jakarta Sans, sans-serif',
        border_radius: '12px',
        status: 'draft',
      }),
    });
    assert(createThemeRes.status === 201, 'POST /api/v1/admin/theme returns HTTP 201');
    const createThemeData = await createThemeRes.json();
    const createdTheme = createThemeData.data?.theme;
    assert(createdTheme && createdTheme.public_id, 'Created theme has public_id');
    assert(createdTheme.status === 'draft', 'New theme status defaults to draft');
    createdThemeIds.push(createdTheme.public_id);

    // Verify Theme Create Audit
    const themeCreateAudit = await AuditLog.query().where({ action: 'CREATE_THEME' }).orderBy('created_at', 'desc').first();
    assert(themeCreateAudit && themeCreateAudit.user_id === adminUser.id, 'Audit log created for CREATE_THEME');
    if (themeCreateAudit) createdAuditIds.push(themeCreateAudit.id);

    // Update Theme
    const updateThemeRes = await fetch(`${baseUrl}/api/v1/admin/theme/${createdTheme.public_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        accent_color: '#0284c7',
        border_radius: '16px',
      }),
    });
    assert(updateThemeRes.status === 200, 'PATCH /api/v1/admin/theme/:publicId returns HTTP 200');
    const updateThemeData = await updateThemeRes.json();
    assert(updateThemeData.data?.theme?.accent_color === '#0284c7', 'Updated theme accent_color persists');
    assert(updateThemeData.data?.theme?.version === 2, 'Theme version incremented on update');

    // Publish Theme
    const pubThemeRes = await fetch(`${baseUrl}/api/v1/admin/theme/${createdTheme.public_id}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(pubThemeRes.status === 200, 'POST /api/v1/admin/theme/:publicId/publish returns HTTP 200');
    const pubThemeData = await pubThemeRes.json();
    assert(pubThemeData.data?.theme?.status === 'published', 'Published theme status is published');
    assert(pubThemeData.data?.theme?.published_at !== null, 'Published theme has published_at timestamp');

    // Verify Theme Publish Audit
    const themePubAudit = await AuditLog.query().where({ action: 'PUBLISH_THEME' }).orderBy('created_at', 'desc').first();
    assert(themePubAudit && themePubAudit.user_id === adminUser.id, 'Audit log created for PUBLISH_THEME');
    if (themePubAudit) createdAuditIds.push(themePubAudit.id);

    // 5. Public Active Theme Endpoint
    console.log('\n--- 5. Public Active Theme Endpoint Tests ---');
    const publicThemeRes = await fetch(`${baseUrl}/api/v1/theme/public`);
    assert(publicThemeRes.status === 200, 'GET /api/v1/theme/public returns HTTP 200');
    const publicThemeData = await publicThemeRes.json();
    assert(publicThemeData.data?.theme?.public_id === createdTheme.public_id, 'Public theme matches published theme');
    assert(publicThemeData.data?.theme?.primary_color === '#0f172a', 'Public theme returns correct primary_color');
    assert(publicThemeData.data?.theme?.id === undefined, 'Public theme does NOT expose internal ID');
    assert(publicThemeData.data?.theme?.created_by === undefined, 'Public theme does NOT expose created_by');

    // 6. Theme Presets Management Tests
    console.log('\n--- 6. Theme Presets Management Tests ---');
    const getPresetsRes = await fetch(`${baseUrl}/api/v1/admin/theme-presets`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(getPresetsRes.status === 200, 'GET /api/v1/admin/theme-presets returns HTTP 200');
    const getPresetsData = await getPresetsRes.json();
    assert(Array.isArray(getPresetsData.data?.presets), 'Presets list is an array');

    // Create Preset
    const createPresetRes = await fetch(`${baseUrl}/api/v1/admin/theme-presets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Industrial Chrome Minimal',
        description: 'Clean brushed steel aesthetic for luxury showrooms',
        theme_config: {
          primary_color: '#18181b',
          secondary_color: '#71717a',
          accent_color: '#e4e4e7',
          background_color: '#09090b',
          surface_color: '#27272a',
          text_color: '#fafafa',
          heading_font: 'Cinzel, serif',
          body_font: 'Inter, sans-serif',
          border_radius: '4px',
        },
        is_system: true,
      }),
    });
    assert(createPresetRes.status === 201, 'POST /api/v1/admin/theme-presets returns HTTP 201');
    const createPresetData = await createPresetRes.json();
    const createdPreset = createPresetData.data?.preset;
    assert(createdPreset && createdPreset.public_id, 'Created preset has public_id');
    assert(createdPreset.is_system === true, 'Preset is_system flag is true');
    createdPresetIds.push(createdPreset.public_id);

    // Apply Preset to Theme
    const applyPresetRes = await fetch(
      `${baseUrl}/api/v1/admin/theme-presets/${createdPreset.public_id}/apply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          theme_public_id: createdTheme.public_id,
        }),
      }
    );
    assert(applyPresetRes.status === 200, 'POST /api/v1/admin/theme-presets/:publicId/apply returns HTTP 200');
    const applyPresetData = await applyPresetRes.json();
    assert(applyPresetData.data?.theme?.primary_color === '#18181b', 'Preset config applied to theme primary_color');

    // Verify Apply Preset Audit
    const applyAudit = await AuditLog.query().where({ action: 'APPLY_THEME_PRESET' }).orderBy('created_at', 'desc').first();
    assert(applyAudit && applyAudit.user_id === adminUser.id, 'Audit log created for APPLY_THEME_PRESET');
    if (applyAudit) createdAuditIds.push(applyAudit.id);

  } catch (err) {
    console.error('Unexpected error in Step 4 tests:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 4 test records ---');
    try {
      if (createdPresetIds.length > 0) {
        await ThemePreset.query().whereIn('public_id', createdPresetIds).delete();
      }
      if (createdThemeIds.length > 0) {
        await WebsiteSetting.query().patch({ active_theme_id: null });
        await ThemeSetting.query().whereIn('public_id', createdThemeIds).delete();
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
      console.log('Step 4 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr);
    }

    if (testServer) {
      testServer.close();
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  runStep4Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 4 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep4Tests;
