// verify-settings-cleanup.mjs
// Verification of admin sidebar navigation and settings routing cleanup

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminSrcDir = path.resolve(__dirname, '../src');

console.log('🔍 Running verification for Admin Settings Navigation Cleanup...\n');

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

// 1. Verify AdminLayout.tsx navigation items
console.log('1. Verifying AdminLayout.tsx Sidebar Navigation...');
const adminLayoutPath = path.join(adminSrcDir, 'layouts/AdminLayout.tsx');
assert(fs.existsSync(adminLayoutPath), 'AdminLayout.tsx exists');
const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf-8');

assert(
  adminLayoutContent.includes("name: 'Settings'") && adminLayoutContent.includes("path: '/admin/settings'"),
  "Sidebar contains unified 'Settings' item with path '/admin/settings'"
);
assert(
  !adminLayoutContent.includes("name: 'Business Settings'"),
  "Sidebar does NOT contain duplicate 'Business Settings' navigation item"
);
assert(
  !adminLayoutContent.includes("name: 'Website Settings'"),
  "Sidebar does NOT contain separate 'Website Settings' item (unified into 'Settings')"
);
assert(
  adminLayoutContent.includes("name: 'Theme & Appearance'"),
  "Sidebar preserves 'Theme & Appearance'"
);
assert(
  adminLayoutContent.includes("name: 'Notifications'"),
  "Sidebar preserves 'Notifications'"
);
assert(
  adminLayoutContent.includes("name: 'Security & Audit'"),
  "Sidebar preserves 'Security & Audit'"
);
assert(
  adminLayoutContent.includes("icon: <Settings className="),
  "Sidebar Settings entry uses lucide Settings icon"
);

// 2. Verify router/index.tsx routes
console.log('\n2. Verifying Router Configuration (router/index.tsx)...');
const routerPath = path.join(adminSrcDir, 'app/router/index.tsx');
assert(fs.existsSync(routerPath), 'router/index.tsx exists');
const routerContent = fs.readFileSync(routerPath, 'utf-8');

assert(
  routerContent.includes('<Route path="settings" element={<WebsiteSettingsPage />} />'),
  "Route 'settings' renders WebsiteSettingsPage"
);
assert(
  routerContent.includes('<Route path="settings/website" element={<WebsiteSettingsPage />} />'),
  "Route 'settings/website' renders WebsiteSettingsPage"
);
assert(
  routerContent.includes('<Route path="settings/business" element={<Navigate to="/admin/settings" replace />} />'),
  "Route 'settings/business' redirects to '/admin/settings'"
);
assert(
  routerContent.includes('<Route path="/settings/business" element={<Navigate to="/admin/settings" replace />} />'),
  "Route '/settings/business' redirects to '/admin/settings'"
);
assert(
  routerContent.includes('<Route path="theme" element={<ThemePage />} />'),
  "Theme route is preserved"
);
assert(
  routerContent.includes('<Route path="notifications" element={<NotificationCenterPage />} />'),
  "Notifications route is preserved"
);

// 3. Verify SettingsPage.tsx implementation
console.log('\n3. Verifying SettingsPage.tsx Component...');
const settingsPagePath = path.join(adminSrcDir, 'features/settings/pages/SettingsPage.tsx');
assert(fs.existsSync(settingsPagePath), 'SettingsPage.tsx component exists');
const settingsPageContent = fs.readFileSync(settingsPagePath, 'utf-8');

assert(
  settingsPageContent.includes('WebsiteSettingsPage'),
  'SettingsPage cleanly references WebsiteSettingsPage'
);
assert(
  !settingsPageContent.includes('tab-business-settings'),
  'SettingsPage has NO separate business settings tab controls'
);

// 4. Verify Component Preservation
console.log('\n4. Verifying Component Preservation...');
const websiteSettingsPath = path.join(adminSrcDir, 'features/settings/pages/WebsiteSettingsPage.tsx');
assert(fs.existsSync(websiteSettingsPath), 'WebsiteSettingsPage.tsx file is present');

const websiteSettingsContent = fs.readFileSync(websiteSettingsPath, 'utf-8');
assert(
  websiteSettingsContent.includes('export function WebsiteSettingsPage') &&
    websiteSettingsContent.includes('export default WebsiteSettingsPage'),
  'WebsiteSettingsPage exports and implementation remain intact'
);

console.log(`\n========================================`);
console.log(`Verification Summary: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
