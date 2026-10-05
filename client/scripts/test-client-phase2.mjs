/**
 * SKF Stainless Steel Furniture - Client Phase 2 Master Verification Suite
 * Tests Custom Furniture, Estimator, Enquiry improvements, Gallery enhancements,
 * Reviews, Customer Quotation Experience, Security/SEO, and B2B exclusion.
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

async function runClientPhase2Tests() {
  console.log('================================================================');
  console.log('SKF STAINLESS STEEL FURNITURE — CLIENT PHASE 2 TEST SUITE');
  console.log(`Target Client: ${CLIENT_BASE}`);
  console.log(`Target Backend: ${API_BASE}`);
  console.log('================================================================\n');

  // 1. CUSTOM FURNITURE FLOW (P2.1)
  console.log('▶ 1. Custom Furniture Flow (/custom-furniture)');
  try {
    const res = await fetch(`${CLIENT_BASE}/custom-furniture`);
    recordTest('Custom Furniture', 'Custom Furniture page returns HTTP 200', res.status === 200, `Status: ${res.status}`);
    const html = await res.text();

    recordTest('Custom Furniture', 'Page header and bespoke fabrication headline present', html.includes('Bespoke Stainless Steel Furniture'));
    recordTest('Custom Furniture', 'Furniture type options rendered', html.includes('Dining Table') && html.includes('Console Table'));
    recordTest('Custom Furniture', 'Dimensional input fields rendered', html.includes('Length') && html.includes('Width') && html.includes('Height'));
    recordTest('Custom Furniture', 'Steel grade options rendered', html.includes('SS 304') && html.includes('SS 316'));
    recordTest('Custom Furniture', 'Surface finish chips rendered', html.includes('Brushed Hairline') && html.includes('PVD Titanium Gold'));
    recordTest('Custom Furniture', 'Reference design image section present', html.includes('Reference Design') || html.includes('Reference Image'));
    recordTest('Custom Furniture', 'Contact and delivery inputs rendered', html.includes('Full Name') && html.includes('Phone Number'));
    recordTest('Custom Furniture', 'Submit custom request button present', html.includes('Submit Custom Furniture Request'));

    // Test with Pre-filled URL query parameters
    const prefillRes = await fetch(`${CLIENT_BASE}/custom-furniture?type=Dining%20Table&w=900&l=1800&h=750&unit=mm&estimate=24000`);
    recordTest('Custom Furniture', 'Prefilled query param route returns HTTP 200', prefillRes.status === 200);
    const prefillHtml = await prefillRes.text();
    recordTest('Custom Furniture', 'Estimator prefill notice rendered', prefillHtml.includes('Pre-filled from Cost Estimator') || prefillHtml.includes('Estimated Base'));

    // Test Backend API Submission: POST /api/v1/custom-requests
    const postPayload = {
      product_type: 'Dining Table',
      width: 900,
      length: 1800,
      height: 750,
      dimension_unit: 'mm',
      material: 'Grade 304 Stainless Steel',
      finish: 'Brushed Hairline Satin',
      quantity: 1,
      customer_name: 'Phase 2 Test User',
      phone: '+91 98765 00002',
      email: 'phase2.test@skffurniture.com',
      city: 'Ahmedabad',
      requirement: 'Custom TIG welded dining frame for 12mm glass top.',
    };

    const submitRes = await fetch(`${API_BASE}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postPayload),
    });

    recordTest('Custom Furniture', 'API submission succeeds with HTTP 201', submitRes.status === 201, `Status: ${submitRes.status}`);
    const submitJson = await submitRes.json();
    recordTest('Custom Furniture', 'API returns valid public_id UUID', Boolean(submitJson?.data?.public_id));
    recordTest('Custom Furniture', 'API persists correct product_type', submitJson?.data?.product_type === 'Dining Table');

    // Test Validation: missing required customer_name
    const invalidRes = await fetch(`${API_BASE}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_type: 'Dining Table', phone: '+91 98765 00000' }),
    });
    recordTest('Custom Furniture', 'API rejects request without customer_name (HTTP 400)', invalidRes.status === 400);
  } catch (err) {
    recordTest('Custom Furniture', 'Custom furniture suite executed without network crash', false, err.message);
  }

  // 2. ESTIMATOR FLOW (P2.2)
  console.log('\n▶ 2. Estimator Flow (/estimator)');
  try {
    const res = await fetch(`${CLIENT_BASE}/estimator`);
    recordTest('Estimator', 'Estimator page returns HTTP 200', res.status === 200, `Status: ${res.status}`);
    const html = await res.text();

    recordTest('Estimator', 'Estimator headline rendered', html.includes('Cost Estimator') || html.includes('Price Estimator'));
    recordTest('Estimator', 'Dimension controls rendered', html.includes('Length') && html.includes('Width'));
    recordTest('Estimator', 'Unit selector rendered', html.includes('mm') && html.includes('inches'));
    recordTest('Estimator', 'Estimated Price label rendered', html.includes('Estimated Price'));
    recordTest('Estimator', 'Legal pricing disclaimer rendered', html.includes('Final pricing may vary based on customization') || html.includes('automated estimate for reference only'));
    recordTest('Estimator', 'Official Quote CTA present', html.includes('Get Official Quotation') || html.includes('Get Quote'));
    recordTest('Estimator', 'Submit as Custom Request CTA present', html.includes('Submit as Custom Request'));
    recordTest('Estimator', 'Discuss on WhatsApp CTA present', html.includes('WhatsApp'));

    // Test Backend API: GET /api/v1/estimator/rules
    const rulesRes = await fetch(`${API_BASE}/estimator/rules`);
    recordTest('Estimator', 'API GET /estimator/rules returns HTTP 200', rulesRes.status === 200);
    const rulesJson = await rulesRes.json();
    recordTest('Estimator', 'API rules data is an array', Array.isArray(rulesJson?.data));

    // Test Backend API: POST /api/v1/estimator/calculate
    const calcRes = await fetch(`${API_BASE}/estimator/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_type: 'Dining Table',
        width: 900,
        length: 1800,
        height: 750,
        dimension_unit: 'mm',
        material: 'SS 304',
        finish: 'Brushed Satin',
        quantity: 1,
      }),
    });

    recordTest('Estimator', 'API calculate returns HTTP 200', calcRes.status === 200);
    const calcJson = await calcRes.json();
    recordTest('Estimator', 'API response includes is_estimate: true flag', calcJson?.data?.is_estimate === true);
    recordTest('Estimator', 'API response includes total_estimate > 0', typeof calcJson?.data?.total_estimate === 'number' && calcJson.data.total_estimate > 0);
    recordTest('Estimator', 'API response includes disclaimer', typeof calcJson?.data?.disclaimer === 'string');
    recordTest('Estimator', 'API response includes currency INR', calcJson?.data?.currency === 'INR');
  } catch (err) {
    recordTest('Estimator', 'Estimator flow executed without crash', false, err.message);
  }

  // 3. ENQUIRY IMPROVEMENTS (P2.4)
  console.log('\n▶ 3. Enquiry / Lead Improvements');
  try {
    // General enquiry
    const generalRes = await fetch(`${API_BASE}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Anil Ambani',
        phone: '+91 98200 11111',
        email: 'anil@reliance.in',
        source: 'general',
        message: 'Requesting updated product catalog.',
      }),
    });
    recordTest('Enquiry', 'General enquiry submitted successfully (HTTP 201)', generalRes.status === 201);

    // Custom furniture enquiry
    const customEnqRes = await fetch(`${API_BASE}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Gautam Adani',
        phone: '+91 98240 22222',
        email: 'gautam@adani.in',
        source: 'custom_furniture',
        message: 'Inquiring about 10-seater banquet tables in SS 316.',
      }),
    });
    recordTest('Enquiry', 'Custom furniture enquiry submitted successfully (HTTP 201)', customEnqRes.status === 201);

    // Estimator enquiry
    const estEnqRes = await fetch(`${API_BASE}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Ratan Tata',
        phone: '+91 98210 33333',
        source: 'estimator',
        message: 'Inquiring about estimated price for Bed Frame suite.',
      }),
    });
    recordTest('Enquiry', 'Estimator enquiry submitted successfully (HTTP 201)', estEnqRes.status === 201);

    // Validation: missing phone number
    const badPhoneRes = await fetch(`${API_BASE}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Nobody',
      }),
    });
    recordTest('Enquiry', 'Enquiry with missing phone fails validation (HTTP 400)', badPhoneRes.status === 400);
  } catch (err) {
    recordTest('Enquiry', 'Enquiry improvements executed without crash', false, err.message);
  }

  // 4. GALLERY ENHANCEMENTS (P2.5)
  console.log('\n▶ 4. Gallery Enhancements (/gallery)');
  try {
    const res = await fetch(`${CLIENT_BASE}/gallery`);
    recordTest('Gallery', 'Gallery page returns HTTP 200', res.status === 200);
    const html = await res.text();

    recordTest('Gallery', 'Category filter pills rendered', html.includes('Residential') && html.includes('Commercial'));
    recordTest('Gallery', 'Custom Order header CTA present', html.includes('Custom Order') || html.includes('Custom Furniture'));
    recordTest('Gallery', 'Custom Furniture Studio conversion banner present', html.includes('Have a Bespoke Vision') || html.includes('Custom Furniture Studio'));
    recordTest('Gallery', 'Instant Cost Estimator CTA present in gallery', html.includes('Instant Cost Estimator') || html.includes('Estimator'));
    recordTest('Gallery', 'Lightbox and enlarge controls present', html.includes('Maximize2') || html.includes('Enlarge') || html.includes('Photos'));

    // Check Public Gallery API: GET /api/v1/galleries
    const apiRes = await fetch(`${API_BASE}/galleries`);
    recordTest('Gallery', 'API GET /galleries returns HTTP 200', apiRes.status === 200);
    const apiJson = await apiRes.json();
    recordTest('Gallery', 'API returns items array with published items', Array.isArray(apiJson?.data?.items));
  } catch (err) {
    recordTest('Gallery', 'Gallery verification executed without crash', false, err.message);
  }

  // 5. REVIEWS ENHANCEMENTS (P2.5)
  console.log('\n▶ 5. Reviews Enhancements');
  try {
    const res = await fetch(`${CLIENT_BASE}/`);
    recordTest('Reviews', 'Home page with verified reviews returns HTTP 200', res.status === 200);
    const html = await res.text();

    recordTest('Reviews', 'Client Testimonials section headline rendered', html.includes('Trusted by Homeowners &amp; Architects') || html.includes('Trusted by Homeowners'));
    recordTest('Reviews', 'Write a Review button present', html.includes('Write a Review'));
    recordTest('Reviews', 'Want furniture like this? conversion card rendered', html.includes('Want furniture like this?'));
    recordTest('Reviews', 'Commission Bespoke Furniture CTA present', html.includes('Commission Your Own Bespoke') || html.includes('Custom Request'));

    // Test API: GET /api/v1/reviews
    const revRes = await fetch(`${API_BASE}/reviews`);
    recordTest('Reviews', 'API GET /reviews returns HTTP 200', revRes.status === 200);
    const revJson = await revRes.json();
    recordTest('Reviews', 'API returns approved reviews array', Array.isArray(revJson?.data?.items) && revJson.data.items.length > 0);

    // Test API: POST /api/v1/reviews (Customer submits review)
    const newRevRes = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Priya Sharma (Interior Designer)',
        rating: 5,
        review_text: 'Ordered custom SS 304 console tables with fluted gold PVD legs. Exemplary fabrication quality and packaging.',
      }),
    });
    recordTest('Reviews', 'Public review submission succeeds (HTTP 201)', newRevRes.status === 201);
  } catch (err) {
    recordTest('Reviews', 'Reviews verification executed without crash', false, err.message);
  }

  // 6. CUSTOMER QUOTATION EXPERIENCE (P2.6)
  console.log('\n▶ 6. Customer Quotation Experience (/quotation/[id])');
  try {
    // Valid Sent Quotation: 91fac6bb-e97a-416b-821a-1d6bbb42d270
    const sentPublicId = '91fac6bb-e97a-416b-821a-1d6bbb42d270';
    const quoteRes = await fetch(`${CLIENT_BASE}/quotation/${sentPublicId}`);
    recordTest('Quotations', 'Public quotation route returns HTTP 200', quoteRes.status === 200, `Status: ${quoteRes.status}`);

    // API: GET /api/v1/quotations/:publicId
    const apiQuoteRes = await fetch(`${API_BASE}/quotations/${sentPublicId}`);
    recordTest('Quotations', 'API GET quotation returns HTTP 200', apiQuoteRes.status === 200);
    const apiQuoteJson = await apiQuoteRes.json();
    const qData = apiQuoteJson?.data?.quotation;

    recordTest('Quotations', 'API quotation has quotation_number', Boolean(qData?.quotation_number));
    recordTest('Quotations', 'API quotation has customer_name', Boolean(qData?.customer_name));
    recordTest('Quotations', 'API quotation has total_amount > 0', typeof qData?.total_amount === 'number' && qData.total_amount > 0);
    recordTest('Quotations', 'API quotation has itemized line items', Array.isArray(qData?.items) && qData.items.length > 0);
    recordTest('Quotations', 'API quotation has sent status', qData?.status === 'sent');

    // Test Draft Quotation Access Protection: 4bdde49b-007f-4e5c-a6fd-9f999a8dcb84
    const draftPublicId = '4bdde49b-007f-4e5c-a6fd-9f999a8dcb84';
    const draftRes = await fetch(`${API_BASE}/quotations/${draftPublicId}`);
    recordTest('Quotations', 'Draft quotation is forbidden from public access (HTTP 403)', draftRes.status === 403);

    // Security & Privacy Verification
    const robotsRes = await fetch(`${CLIENT_BASE}/robots.txt`);
    const robotsTxt = await robotsRes.text();
    recordTest('Quotations', 'Robots.txt disallows /quotation/ to protect private customer data', robotsTxt.includes('/quotation/'));

    const sitemapRes = await fetch(`${CLIENT_BASE}/sitemap.xml`);
    const sitemapXml = await sitemapRes.text();
    recordTest('Quotations', 'Sitemap does NOT leak confidential quotation URLs', !sitemapXml.includes('/quotation/'));
    recordTest('Quotations', 'Sitemap includes new /custom-furniture page', sitemapXml.includes('/custom-furniture'));
    recordTest('Quotations', 'Sitemap includes new /estimator page', sitemapXml.includes('/estimator'));
  } catch (err) {
    recordTest('Quotations', 'Quotation verification executed without crash', false, err.message);
  }

  // 7. B2B / TRADE EXCLUSION (OUT OF SCOPE VERIFICATION)
  console.log('\n▶ 7. B2B / Trade Out of Scope Verification');
  try {
    const b2bRes = await fetch(`${CLIENT_BASE}/b2b`);
    recordTest('Scope Verification', 'Client /b2b route does not exist (HTTP 404)', b2bRes.status === 404, `Status: ${b2bRes.status}`);

    const tradeRes = await fetch(`${CLIENT_BASE}/trade`);
    recordTest('Scope Verification', 'Client /trade route does not exist (HTTP 404)', tradeRes.status === 404, `Status: ${tradeRes.status}`);
  } catch (err) {
    recordTest('Scope Verification', 'Scope checks executed cleanly', false, err.message);
  }

  // SUMMARY & SCORECARD
  console.log('\n================================================================');
  console.log('CLIENT PHASE 2 E2E TEST SUMMARY');
  console.log('================================================================');
  for (const [cat, data] of Object.entries(resultsSummary)) {
    const pad = cat.padEnd(20, ' ');
    console.log(`  ${pad}: ${data.passed}/${data.total} Passed`);
  }
  console.log('----------------------------------------------------------------');
  console.log(`TOTAL SCORE: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.error(`FAILURE: ${failedTests} tests failed in Client Phase 2 suite.`);
    process.exit(1);
  } else {
    console.log('SUCCESS: All Client Phase 2 integration tests passed cleanly!');
    process.exit(0);
  }
}

runClientPhase2Tests();
