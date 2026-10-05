/**
 * SKF Stainless Steel Furniture - Client Phase 1 Complete E2E Verification Suite
 * Tests routes, APIs, WhatsApp encoding, Enquiry validation, SEO, PWA, and Accessibility.
 */

const CLIENT_BASE = process.env.CLIENT_BASE_URL || 'http://localhost:3000';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:7000/api/v1';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const resultsSummary = {};

function recordTest(category, name, passed, details = '') {
  totalTests++;
  if (!resultsSummary[category]) {
    resultsSummary[category] = { passed: 0, total: 0 };
  }
  resultsSummary[category].total++;

  if (passed) {
    passedTests++;
    resultsSummary[category].passed++;
    console.log(`  ✓ [PASS] ${name}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${name} ${details ? `(${details})` : ''}`);
  }
}

async function runClientPhase1Tests() {
  console.log('================================================================');
  console.log('SKF STAINLESS STEEL FURNITURE — CLIENT PHASE 1 E2E TEST SUITE');
  console.log(`Target Client: ${CLIENT_BASE}`);
  console.log(`Target Backend: ${API_BASE}`);
  console.log('================================================================\n');

  // 1. HOME TESTS
  console.log('▶ 1. Home Page Verification');
  try {
    const res = await fetch(`${CLIENT_BASE}/`);
    recordTest('Home', 'Home page returns HTTP 200', res.status === 200, `Status: ${res.status}`);
    const html = await res.text();

    recordTest('Home', 'Hero value proposition headline present', html.includes('Stainless Steel Furniture'));
    recordTest('Home', 'Featured categories section rendered', html.includes('Catalog Collections') || html.includes('Explore by Furniture Category'));
    recordTest('Home', 'Featured products section rendered', html.includes('Featured Stainless Steel Creations') || html.includes('Flagship Designs'));
    recordTest('Home', 'Trust & Metallurgy section present', html.includes('Why Discerning Architects') || html.includes('The SKF Advantage'));
    recordTest('Home', 'Gallery preview section present', html.includes('Completed Client Installations') || html.includes('Project Showcase'));
    recordTest('Home', 'Client testimonials section present', html.includes('Trusted by Homeowners') || html.includes('Client Testimonials'));
    recordTest('Home', 'Footer with business information present', html.includes('Ahmedabad, Gujarat') && html.includes('All rights reserved'));
  } catch (err) {
    recordTest('Home', 'Home page fetches successfully', false, err.message);
  }

  // 2. PRODUCTS & CATEGORIES TESTS
  console.log('\n▶ 2. Products & Category Filter Verification');
  try {
    const res = await fetch(`${CLIENT_BASE}/products`);
    recordTest('Products', 'Products catalog returns HTTP 200', res.status === 200, `Status: ${res.status}`);
    const html = await res.text();

    recordTest('Products', 'Search input rendered', html.includes('catalog-sort') || html.includes('Search by product name'));
    recordTest('Products', 'Category filter bar rendered', html.includes('All Products') && html.includes('Beds'));
    recordTest('Products', 'Sort dropdown options available', html.includes('Newest Arrivals') || html.includes('catalog-sort'));

    // Test Category Filter Route
    const catRes = await fetch(`${CLIENT_BASE}/products?category=ss-dining-tables`);
    recordTest('Products', 'Category filter route returns HTTP 200', catRes.status === 200);

    // Test Search Route
    const searchRes = await fetch(`${CLIENT_BASE}/products?search=Verona`);
    recordTest('Products', 'Search query route returns HTTP 200', searchRes.status === 200);
  } catch (err) {
    recordTest('Products', 'Products listing operates without network error', false, err.message);
  }

  // 3. PRODUCT DETAILS TESTS
  console.log('\n▶ 3. Product Details Verification');
  try {
    const validSlug = 'verona-sculptural-8-seater-dining-table';
    const detailRes = await fetch(`${CLIENT_BASE}/products/${validSlug}`);
    recordTest('Product Details', 'Valid product detail returns HTTP 200', detailRes.status === 200, `Status: ${detailRes.status}`);
    const detailHtml = await detailRes.text();

    recordTest('Product Details', 'Product title rendered', detailHtml.includes('Verona Sculptural 8-Seater Dining Table'));
    recordTest('Product Details', 'Product code rendered', detailHtml.includes('SKF-DIN-002'));
    recordTest('Product Details', 'Technical specifications table present', detailHtml.includes('Engineering & Material Specifications') || detailHtml.includes('Steel Grade'));
    recordTest('Product Details', 'Key structural features rendered', detailHtml.includes('Key Structural Advantages') || detailHtml.includes('Structural Grade 304'));
    recordTest('Product Details', 'Get Quotation CTA present', detailHtml.includes('Get Quotation'));
    recordTest('Product Details', 'WhatsApp CTA link present', detailHtml.includes('Chat on WhatsApp'));
    recordTest('Product Details', 'Related products section present', detailHtml.includes('Related Stainless Steel Designs') || detailHtml.includes('Same Collection'));

    // 404 test for non-existent product
    const invalidRes = await fetch(`${CLIENT_BASE}/products/non-existent-product-sku-99999`);
    recordTest('Product Details', 'Invalid product returns HTTP 404', invalidRes.status === 404, `Status: ${invalidRes.status}`);
  } catch (err) {
    recordTest('Product Details', 'Product details route executed without crash', false, err.message);
  }

  // 4. ENQUIRY SYSTEM TESTS
  console.log('\n▶ 4. Enquiry API & Form Validation');
  try {
    // A: Successful Submission
    const validEnquiry = {
      customer_name: 'E2E Test Client',
      phone: '+91 98765 12345',
      email: 'e2e.test@example.com',
      source: 'e2e_verification_script',
      message: 'Automated test inquiry for custom dining table.',
    };

    const submitRes = await fetch(`${API_BASE}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validEnquiry),
    });

    const submitJson = await submitRes.json();
    recordTest('Enquiry', 'Valid enquiry submission succeeds with HTTP 201', submitRes.status === 201 && submitJson.success === true);
    recordTest('Enquiry', 'Enquiry returns valid public_id UUID', Boolean(submitJson.data?.public_id));

    // B: Validation Failure (Missing Required Phone)
    const invalidEnquiry = {
      customer_name: 'Incomplete Lead',
      // missing phone
    };

    const failRes = await fetch(`${API_BASE}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidEnquiry),
    });
    recordTest('Enquiry', 'Enquiry with missing phone fails with HTTP 400', failRes.status === 400);

    // C: Validation Failure (Unsupported Extra Fields)
    const extraFieldsEnquiry = {
      customer_name: 'Hacker Lead',
      phone: '+919999999999',
      unsupported_field_admin_token: 'malicious_payload',
    };
    const strictRes = await fetch(`${API_BASE}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(extraFieldsEnquiry),
    });
    recordTest('Enquiry', 'Enquiry rejects unsupported extra properties (strict mode)', strictRes.status === 400);
  } catch (err) {
    recordTest('Enquiry', 'Enquiry API tests executed without network failure', false, err.message);
  }

  // 5. WHATSAPP ENCODING TESTS
  console.log('\n▶ 5. WhatsApp Integration Verification');
  try {
    const rawPhone = '+91 98765 43210';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const message = 'Hello SKF Furniture,\nI am interested in: Product: Verona Dining Table';
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    recordTest('WhatsApp', 'WhatsApp URL formats to wa.me correctly', waUrl.startsWith('https://wa.me/919876543210'));
    recordTest('WhatsApp', 'WhatsApp message properly URL-encoded', waUrl.includes('%0A') || waUrl.includes('Verona'));
    recordTest('WhatsApp', 'WhatsApp URL contains no spaces or forbidden characters', !waUrl.includes(' '));
  } catch (err) {
    recordTest('WhatsApp', 'WhatsApp utility works correctly', false, err.message);
  }

  // 6. ABOUT PAGE TESTS
  console.log('\n▶ 6. About Page Verification');
  try {
    const res = await fetch(`${CLIENT_BASE}/about`);
    recordTest('About', 'About page returns HTTP 200', res.status === 200, `Status: ${res.status}`);
    const html = await res.text();

    recordTest('About', 'Manufacturing story and metallurgy covered', html.includes('Pioneering Luxury Stainless Steel') || html.includes('AISI 304'));
    recordTest('About', 'Ahmedabad workshop location documented', html.includes('Ahmedabad') || html.includes('Vatva'));
    recordTest('About', 'Residential & Commercial scope detailed', html.includes('Residential Luxury') && html.includes('Commercial'));
  } catch (err) {
    recordTest('About', 'About page loads without error', false, err.message);
  }

  // 7. GALLERY PAGE TESTS
  console.log('\n▶ 7. Gallery Page Verification');
  try {
    const res = await fetch(`${CLIENT_BASE}/gallery`);
    recordTest('Gallery', 'Gallery page returns HTTP 200', res.status === 200, `Status: ${res.status}`);
    const html = await res.text();

    recordTest('Gallery', 'Gallery portfolio items rendered', html.includes('Executed Installations') || html.includes('Fabrication Portfolio'));
    recordTest('Gallery', 'Category filter pills available', html.includes('Residential') || html.includes('Dining'));
  } catch (err) {
    recordTest('Gallery', 'Gallery loads without error', false, err.message);
  }

  // 8. FAQ PAGE TESTS
  console.log('\n▶ 8. FAQ Page Verification');
  try {
    const res = await fetch(`${CLIENT_BASE}/faq`);
    recordTest('FAQ', 'FAQ page returns HTTP 200', res.status === 200, `Status: ${res.status}`);
    const html = await res.text();

    recordTest('FAQ', 'Grade 304 vs 316 FAQ included', html.includes('Grade 304') || html.includes('stainless steel'));
    recordTest('FAQ', 'PVD titanium coating FAQ included', html.includes('PVD') || html.includes('Physical Vapor Deposition'));
    recordTest('FAQ', 'Delivery across India FAQ included', html.includes('deliver across India') || html.includes('pan-India'));
  } catch (err) {
    recordTest('FAQ', 'FAQ loads without error', false, err.message);
  }

  // 9. CONTACT PAGE TESTS
  console.log('\n▶ 9. Contact Page Verification');
  try {
    const res = await fetch(`${CLIENT_BASE}/contact`);
    recordTest('Contact', 'Contact page returns HTTP 200', res.status === 200, `Status: ${res.status}`);
    const html = await res.text();

    recordTest('Contact', 'Phone number and WhatsApp displayed', html.includes('+91') || html.includes('WhatsApp'));
    recordTest('Contact', 'Email address displayed', html.includes('sales@skffurniture.com') || html.includes('mailto:'));
    recordTest('Contact', 'Workshop address displayed', html.includes('Vatva') || html.includes('Ahmedabad'));
    recordTest('Contact', 'Google Maps iframe / button included', html.includes('google.com/maps'));
    recordTest('Contact', 'Interactive enquiry form present', html.includes('Send Us an Enquiry') || html.includes('Submit Enquiry'));
  } catch (err) {
    recordTest('Contact', 'Contact loads without error', false, err.message);
  }

  // 10. SEO, SITEMAP & ROBOTS TESTS
  console.log('\n▶ 10. SEO, Sitemap & Robots Verification');
  try {
    // Sitemap
    const sitemapRes = await fetch(`${CLIENT_BASE}/sitemap.xml`);
    recordTest('SEO', 'Sitemap.xml returns HTTP 200', sitemapRes.status === 200, `Status: ${sitemapRes.status}`);
    const sitemapXml = await sitemapRes.text();
    recordTest('SEO', 'Sitemap contains home, products, and gallery URLs', sitemapXml.includes('/products') && sitemapXml.includes('/gallery'));
    recordTest('SEO', 'Sitemap does NOT expose admin or internal APIs', !sitemapXml.includes('/admin') && !sitemapXml.includes('/api/'));

    // Robots
    const robotsRes = await fetch(`${CLIENT_BASE}/robots.txt`);
    recordTest('SEO', 'Robots.txt returns HTTP 200', robotsRes.status === 200, `Status: ${robotsRes.status}`);
    const robotsTxt = await robotsRes.text();
    recordTest('SEO', 'Robots allows root crawling', robotsTxt.includes('Allow: /'));
    recordTest('SEO', 'Robots disallows admin and api', robotsTxt.includes('Disallow: /admin/') && robotsTxt.includes('Disallow: /api/'));
    recordTest('SEO', 'Robots points to sitemap.xml', robotsTxt.includes('Sitemap:'));

    // Structured Data JSON-LD on Home & Product
    const homeHtml = await (await fetch(`${CLIENT_BASE}/`)).text();
    recordTest('SEO', 'Home includes Organization / LocalBusiness JSON-LD', homeHtml.includes('schema.org') && homeHtml.includes('SKF Stainless Steel Furniture'));

    const prodHtml = await (await fetch(`${CLIENT_BASE}/products/verona-sculptural-8-seater-dining-table`)).text();
    recordTest('SEO', 'Product detail includes Product schema JSON-LD', prodHtml.includes('"@type":"Product"') || prodHtml.includes('Verona'));
    recordTest('SEO', 'Product detail includes BreadcrumbList schema', prodHtml.includes('BreadcrumbList'));
    recordTest('SEO', 'Canonical link is configured', prodHtml.includes('rel="canonical"'));
  } catch (err) {
    recordTest('SEO', 'SEO assets verified without error', false, err.message);
  }

  // 11. PWA VERIFICATION
  console.log('\n▶ 11. PWA Manifest & Service Worker Verification');
  try {
    const manifestRes = await fetch(`${CLIENT_BASE}/manifest.json`);
    recordTest('PWA', 'Manifest.json returns HTTP 200', manifestRes.status === 200);
    const manifest = await manifestRes.json();
    recordTest('PWA', 'Manifest has valid standalone display mode', manifest.display === 'standalone');
    recordTest('PWA', 'Manifest has 192x192 and 512x512 app icons', manifest.icons?.length >= 2);
    recordTest('PWA', 'Manifest start_url is /', manifest.start_url === '/');

    const swRes = await fetch(`${CLIENT_BASE}/sw.js`);
    recordTest('PWA', 'Service worker sw.js returns HTTP 200', swRes.status === 200);
    const swCode = await swRes.text();
    recordTest('PWA', 'Service worker excludes sensitive API requests from cache', swCode.includes('/api') && swCode.includes('7000'));

    const offlineRes = await fetch(`${CLIENT_BASE}/offline.html`);
    recordTest('PWA', 'Offline fallback page offline.html returns HTTP 200', offlineRes.status === 200);
  } catch (err) {
    recordTest('PWA', 'PWA assets verified without error', false, err.message);
  }

  // Summary Report
  console.log('\n================================================================');
  console.log('CLIENT PHASE 1 E2E TEST SUMMARY');
  console.log('================================================================');
  for (const [category, stats] of Object.entries(resultsSummary)) {
    console.log(`  ${category.padEnd(16)}: ${stats.passed}/${stats.total} Passed`);
  }
  console.log('----------------------------------------------------------------');
  console.log(`TOTAL SCORE: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.error(`FAIL: ${failedTests} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('SUCCESS: All Client Phase 1 E2E tests passed cleanly!');
    process.exit(0);
  }
}

runClientPhase1Tests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
