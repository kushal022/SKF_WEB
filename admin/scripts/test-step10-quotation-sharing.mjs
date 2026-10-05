// Integration test for Step 10: Quotation Sharing & Client Approval
const BASE_URL = 'http://localhost:7000/api/v1';

async function runTests() {
  console.log('--- Starting Step 10 Quotation Sharing & Approval Tests ---');
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

  // 2. Create Quotation in Draft Status
  console.log('\n[2] Create Test Quotation');
  const timestamp = Date.now();
  const createPayload = {
    customer_name: `Arun Mehra (Villa Project) ${timestamp}`,
    customer_phone: '+91-9811223344',
    customer_email: 'arun.mehra@example.com',
    valid_until: '2026-11-20',
    notes: 'Confidential admin note regarding fabrication margins.',
    customization_amount: 5000,
    transport_amount: 2500,
    tax_amount: 9000,
    items: [
      {
        description: 'Bespoke SS 304 Kitchen Island Countertop with Seamless Welded Sink Basin',
        quantity: 1,
        unit_price: 65000,
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

  // 3. Security: Public Access to Draft Quotation Must Be Rejected (403 Forbidden)
  console.log('\n[3] Security Check: Draft Quotation Public Access');
  const publicDraftRes = await fetch(`${BASE_URL}/quotations/${quotationPublicId}`);
  assert(
    publicDraftRes.status === 403,
    'Unpublished draft quotation is strictly forbidden for public access (HTTP 403)'
  );

  // 4. Admin Transitions Quotation to 'sent'
  console.log('\n[4] Transition Quotation to "sent"');
  const sendRes = await fetch(`${BASE_URL}/admin/quotations/${quotationPublicId}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'sent', comment: 'Shared with customer via digital portal' }),
  });
  const sendData = await sendRes.json();
  assert(sendRes.status === 200 && sendData.data?.quotation?.status === 'sent', 'Quotation status updated to "sent"');

  // 5. Public Access to 'sent' Quotation (No Admin JWT)
  console.log('\n[5] Public Access to Sent Quotation');
  const publicSentRes = await fetch(`${BASE_URL}/quotations/${quotationPublicId}`);
  const publicSentData = await publicSentRes.json();
  const publicQuote = publicSentData.data?.quotation;

  assert(publicSentRes.status === 200 && publicQuote, 'Customer successfully accessed quotation without admin JWT');
  assert(publicQuote.quotation_number === quotation.quotation_number, 'Quotation numbers match');
  assert(publicQuote.total_amount === quotation.total_amount, 'Total amounts match');
  assert(!publicQuote.status_logs, 'Internal admin status logs are NOT exposed to public view');
  assert(!publicQuote.created_by, 'Internal admin user ID / email are NOT exposed to public view');

  // 6. Customer Action: Accept Quotation via Public API
  console.log('\n[6] Customer Acceptance via Public API');
  const acceptRes = await fetch(`${BASE_URL}/quotations/${quotationPublicId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const acceptData = await acceptRes.json();
  assert(acceptRes.status === 200, 'Customer acceptance request succeeded with HTTP 200');
  assert(
    acceptData.data?.quotation?.status === 'accepted',
    'Quotation status successfully transitioned to "accepted"'
  );

  // 7. Verify Idempotency of Acceptance
  console.log('\n[7] Verify Idempotency of Acceptance');
  const secondAcceptRes = await fetch(`${BASE_URL}/quotations/${quotationPublicId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const secondAcceptData = await secondAcceptRes.json();
  assert(
    secondAcceptRes.status === 200 && secondAcceptData.data?.quotation?.status === 'accepted',
    'Repeated acceptance is gracefully handled and remains in accepted state'
  );

  // 8. Customer Action: Test Rejection on Another Quotation
  console.log('\n[8] Customer Rejection Flow');
  const create2Res = await fetch(`${BASE_URL}/admin/quotations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      ...createPayload,
      customer_name: `Reject Test Customer ${timestamp}`,
    }),
  });
  const quote2 = (await create2Res.json()).data?.quotation;
  const quote2PublicId = quote2.public_id;

  // Transition to sent
  await fetch(`${BASE_URL}/admin/quotations/${quote2PublicId}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'sent' }),
  });

  // Customer rejects
  const rejectRes = await fetch(`${BASE_URL}/quotations/${quote2PublicId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Project postponed by client' }),
  });
  const rejectData = await rejectRes.json();
  assert(rejectRes.status === 200, 'Customer rejection request succeeded with HTTP 200');
  assert(
    rejectData.data?.quotation?.status === 'rejected',
    'Quotation status successfully transitioned to "rejected"'
  );

  // 9. Clean up test quotations (Admin transitions back to draft or deletes)
  console.log('\n[9] Clean Up Test Quotations');
  // Transition rejected back to draft to delete
  await fetch(`${BASE_URL}/admin/quotations/${quote2PublicId}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'draft' }),
  });
  const delete2 = await fetch(`${BASE_URL}/admin/quotations/${quote2PublicId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  assert(delete2.status === 200, 'Cleaned up second test quotation');

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
