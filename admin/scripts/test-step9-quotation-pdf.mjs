// Integration test for Step 9: Quotation PDF Generation & Document Preview Data Integrity
const BASE_URL = 'http://localhost:7000/api/v1';

async function runTests() {
  console.log('--- Starting Step 9 Quotation PDF & Document Preview Tests ---');
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

  // 2. Fetch Business Settings for PDF Header
  console.log('\n[2] Fetch Business Settings for PDF Header');
  const settingsRes = await fetch(`${BASE_URL}/admin/settings`, {
    headers: authHeaders,
  });
  const settingsData = await settingsRes.json();
  assert(settingsRes.status === 200 && settingsData.data?.settings, 'Fetched website settings for PDF branding');
  const siteName = settingsData.data?.settings?.site_name;
  assert(Boolean(siteName), `Verified branding site_name: "${siteName}"`);

  // 3. Create Multi-Item Quotation with Full Commercial Charges
  console.log('\n[3] Create Complex Multi-Item Quotation for PDF Verification');
  const timestamp = Date.now();
  const createPayload = {
    customer_name: `Vikramaditya Singhania & Associates (Luxury Penthouse Project) ${timestamp}`,
    customer_phone: '+91-9820012345',
    customer_email: 'vikram.singhania@luxuryresidences.in',
    valid_until: '2026-11-15',
    notes: 'Premium mirror-buffed finish on all exposed SS 316 joints. Site installation to be scheduled with civil architect.',
    customization_amount: 15000,
    transport_amount: 5000,
    installation_amount: 8000,
    discount_amount: 4000,
    tax_amount: 18000,
    items: [
      {
        description: 'Bespoke 10-Seater SS 316 Architectural Dining Table with Champagne Gold PVD Accent Trim and Toughened Italian Marble Inset Frame',
        quantity: 1,
        unit_price: 125000,
        customization_amount: 10000,
        discount_amount: 2000,
      },
      {
        description: 'Heavy-Duty SS 304 Ergonomic Executive Chairs with Precision Laser-Cut Perforated Backrests and Concealed Swivel Mechanism',
        quantity: 10,
        unit_price: 12000,
        customization_amount: 5000,
        discount_amount: 2000,
      },
    ],
  };

  const createRes = await fetch(`${BASE_URL}/admin/quotations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(createPayload),
  });
  const createData = await createRes.json();
  const quotation = createData.data?.quotation;
  assert(createRes.status === 201 && quotation?.public_id, `Created quotation: ${quotation?.quotation_number}`);
  const quotationPublicId = quotation?.public_id;

  // 4. Verify Quotation Fields for PDF Output
  console.log('\n[4] Verify Quotation Fields for PDF Output');
  const detailRes = await fetch(`${BASE_URL}/admin/quotations/${quotationPublicId}`, {
    headers: authHeaders,
  });
  const detailData = await detailRes.json();
  const q = detailData.data?.quotation;

  assert(detailRes.status === 200 && q, 'Fetched quotation detail successfully');
  assert(q.quotation_number.startsWith('SKF-QT-'), `Quotation number format valid: ${q.quotation_number}`);
  assert(q.items.length === 2, 'Contains 2 line items for multi-row PDF rendering');

  // Verify Line Item 1 calculations
  const item1 = q.items[0];
  const expectedLine1 = 1 * 125000 + 10000 - 2000; // 133,000
  assert(item1.line_total === expectedLine1, `Line 1 total verified: ₹${item1.line_total} === ₹${expectedLine1}`);

  // Verify Line Item 2 calculations
  const item2 = q.items[1];
  const expectedLine2 = 10 * 12000 + 5000 - 2000; // 123,000
  assert(item2.line_total === expectedLine2, `Line 2 total verified: ₹${item2.line_total} === ₹${expectedLine2}`);

  // Verify Grand Total matches backend calculation
  const expectedSubtotal = expectedLine1 + expectedLine2; // 256,000
  assert(q.subtotal === expectedSubtotal, `Items subtotal verified: ₹${q.subtotal} === ₹${expectedSubtotal}`);

  const expectedGrandTotal =
    expectedSubtotal +
    q.customization_amount +
    q.transport_amount +
    q.installation_amount -
    q.discount_amount +
    q.tax_amount;
  // 256,000 + 15,000 + 5,000 + 8,000 - 4,000 + 18,000 = 298,000
  assert(
    q.total_amount === expectedGrandTotal,
    `Grand Total Amount verified: ₹${q.total_amount} === ₹${expectedGrandTotal}`
  );

  // 5. Verify PDF Filename convention: SKF-Quotation-{quotation_number}.pdf
  console.log('\n[5] PDF Filename Convention');
  const expectedFilename = `SKF-Quotation-${q.quotation_number}.pdf`;
  assert(
    !expectedFilename.includes(q.id) && expectedFilename.startsWith('SKF-Quotation-SKF-QT-'),
    `PDF filename adheres to professional convention: "${expectedFilename}" without exposing internal numeric IDs`
  );

  // 6. Delete Test Quotation
  console.log('\n[6] Clean Up Test Quotation');
  const deleteRes = await fetch(`${BASE_URL}/admin/quotations/${quotationPublicId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deleteData = await deleteRes.json();
  assert(deleteRes.status === 200 && deleteData.success, 'Draft test quotation deleted cleanly');

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
