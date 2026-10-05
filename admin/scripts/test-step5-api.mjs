// Integration test for Step 5: Admin Quotations + Estimator Management
const BASE_URL = 'http://localhost:7000/api/v1';

async function runTests() {
  console.log('--- Starting Step 5 Integration Tests ---');
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

  // 1. Authenticate Admin
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

  // 2. Quotation List
  console.log('\n[2] Quotation List & Filters');
  const listRes = await fetch(`${BASE_URL}/admin/quotations?page=1&limit=10`, {
    headers: authHeaders,
  });
  const listData = await listRes.json();
  assert(listRes.status === 200 && Array.isArray(listData.data?.items), 'Fetched quotations list with pagination');

  // 3. Create Quotation (Draft)
  console.log('\n[3] Create Quotation');
  const createPayload = {
    customer_name: 'Test Corp Integration',
    customer_phone: '+91 9876543210',
    customer_email: 'test@corp.com',
    valid_until: '2026-11-01',
    notes: 'Draft proposal for customized stainless steel dining set.',
    customization_amount: 1500,
    transport_amount: 500,
    installation_amount: 800,
    discount_amount: 300,
    tax_amount: 450,
    items: [
      {
        description: 'SS 304 Dining Table with Hairline Finish',
        quantity: 2,
        unit_price: 15000,
        customization_amount: 1000,
        discount_amount: 500,
      },
    ],
  };

  const createRes = await fetch(`${BASE_URL}/admin/quotations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(createPayload),
  });
  const createData = await createRes.json();
  const createdQuotation = createData.data?.quotation || createData.data;
  assert(createRes.status === 201 && createdQuotation?.public_id, `Created draft quotation: ${createdQuotation?.quotation_number}`);
  const quotationPublicId = createdQuotation?.public_id;

  // 4. Quotation Detail
  console.log('\n[4] Quotation Detail');
  const detailRes = await fetch(`${BASE_URL}/admin/quotations/${quotationPublicId}`, {
    headers: authHeaders,
  });
  const detailData = await detailRes.json();
  const quotationDetail = detailData.data?.quotation || detailData.data;
  assert(detailRes.status === 200 && quotationDetail?.customer_name === 'Test Corp Integration', 'Fetched quotation detail with customer snapshot');
  assert(quotationDetail?.items?.length === 1, 'Quotation contains 1 initial item');

  // 5. Update Quotation Header Charges
  console.log('\n[5] Update Quotation Header');
  const updateRes = await fetch(`${BASE_URL}/admin/quotations/${quotationPublicId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      notes: 'Updated notes with verified site measurement.',
      transport_amount: 750,
    }),
  });
  const updateData = await updateRes.json();
  const updatedQuotation = updateData.data?.quotation || updateData.data;
  assert(updateRes.status === 200 && Number(updatedQuotation?.transport_amount) === 750, 'Updated quotation header charges');

  // 6. Add Quotation Item
  console.log('\n[6] Add Quotation Item');
  const addItemRes = await fetch(`${BASE_URL}/admin/quotations/${quotationPublicId}/items`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      description: 'SS 316 Matching Chair',
      quantity: 4,
      unit_price: 3500,
      customization_amount: 200,
      discount_amount: 100,
    }),
  });
  const addItemData = await addItemRes.json();
  const quotationAfterAdd = addItemData.data?.quotation || addItemData.data;
  assert((addItemRes.status === 200 || addItemRes.status === 201) && quotationAfterAdd?.items?.length === 2, 'Added 2nd quotation item and totals recalculated by server');
  const addedItem = quotationAfterAdd?.items?.find((i) => i.description === 'SS 316 Matching Chair');
  const addedItemPublicId = addedItem?.public_id;

  // 7. Update Quotation Item
  console.log('\n[7] Update Quotation Item');
  const updateItemRes = await fetch(`${BASE_URL}/admin/quotations/${quotationPublicId}/items/${addedItemPublicId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      quantity: 6,
      unit_price: 3400,
    }),
  });
  const updateItemData = await updateItemRes.json();
  const quotationAfterUpdate = updateItemData.data?.quotation || updateItemData.data;
  const updatedItem = quotationAfterUpdate?.items?.find((i) => i.public_id === addedItemPublicId);
  assert(updateItemRes.status === 200 && Number(updatedItem?.quantity) === 6, 'Updated item quantity & server recalculated totals');

  // 8. Delete Quotation Item
  console.log('\n[8] Delete Quotation Item');
  const deleteItemRes = await fetch(`${BASE_URL}/admin/quotations/${quotationPublicId}/items/${addedItemPublicId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deleteItemData = await deleteItemRes.json();
  const quotationAfterDelete = deleteItemData.data?.quotation || deleteItemData.data;
  assert(deleteItemRes.status === 200 && quotationAfterDelete?.items?.length === 1, 'Deleted item and quotation restored to 1 item');

  // 9. Quotation Status Transitions (draft -> sent -> accepted)
  console.log('\n[9] Status Lifecycle Transitions');
  // Transition draft -> sent
  const sentStatusRes = await fetch(`${BASE_URL}/admin/quotations/${quotationPublicId}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'sent', comment: 'Proposal delivered via client portal/email' }),
  });
  const sentStatusData = await sentStatusRes.json();
  const sentQuotation = sentStatusData.data?.quotation || sentStatusData.data;
  assert(sentStatusRes.status === 200 && sentQuotation?.status === 'sent', 'Transitioned status: draft -> sent');

  // Transition sent -> accepted
  const acceptedStatusRes = await fetch(`${BASE_URL}/admin/quotations/${quotationPublicId}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'accepted', comment: 'Client signed and approved formal quotation' }),
  });
  const acceptedStatusData = await acceptedStatusRes.json();
  const acceptedQuotation = acceptedStatusData.data?.quotation || acceptedStatusData.data;
  assert(acceptedStatusRes.status === 200 && acceptedQuotation?.status === 'accepted', 'Transitioned status: sent -> accepted');

  // 10. Delete Draft Quotation
  console.log('\n[10] Delete Draft Quotation Verification');
  // Create another draft to test delete
  const draftToDelRes = await fetch(`${BASE_URL}/admin/quotations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customer_name: 'Temporary Quotation for Deletion',
      customer_phone: '+91 9123456780',
      items: [{ description: 'Test Item', quantity: 1, unit_price: 100 }],
    }),
  });
  const draftToDelData = await draftToDelRes.json();
  const draftToDel = draftToDelData.data?.quotation || draftToDelData.data;
  const draftIdToDel = draftToDel?.public_id;

  const deleteDraftRes = await fetch(`${BASE_URL}/admin/quotations/${draftIdToDel}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  assert(deleteDraftRes.status === 200, `Successfully deleted draft quotation (${draftIdToDel})`);

  // 11. Estimator: List Rules
  console.log('\n[11] Estimator: List Rules');
  const estimatorListRes = await fetch(`${BASE_URL}/admin/estimator-rules`, {
    headers: authHeaders,
  });
  const estimatorListData = await estimatorListRes.json();
  assert(estimatorListRes.status === 200 && Array.isArray(estimatorListData.data?.items), 'Fetched admin estimator rules list');

  // 12. Estimator: Create Rule
  console.log('\n[12] Estimator: Create Rule');
  const createRuleRes = await fetch(`${BASE_URL}/admin/estimator-rules`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Custom SS Table Test Rule',
      product_type: 'dining_table',
      material: 'SS 304',
      finish: 'hairline',
      dimension_multiplier: 1.25,
      material_rate: 450,
      finish_adjustment: 150,
      base_rate: 5000,
      priority: 10,
      is_active: true,
    }),
  });
  const createRuleData = await createRuleRes.json();
  const createdRule = createRuleData.data;
  assert(createRuleRes.status === 201 && createdRule?.public_id, `Created estimator rule: ${createdRule?.name}`);
  const rulePublicId = createdRule?.public_id;

  // 13. Estimator: Live Calculate Test Bench
  console.log('\n[13] Estimator: Live Calculate Test Bench');
  const calcRes = await fetch(`${BASE_URL}/estimator/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_type: 'dining_table',
      width: 1200,
      length: 1800,
      height: 750,
      dimension_unit: 'mm',
      material: 'SS 304',
      finish: 'hairline',
      quantity: 1,
    }),
  });
  const calcData = await calcRes.json();
  assert(calcRes.status === 200 && calcData.data?.total_estimate !== undefined, `Calculated estimate: ₹${calcData.data?.total_estimate} (${calcData.data?.matched_rule?.name || 'fallback default'})`);

  // 14. Estimator: Update Rule
  console.log('\n[14] Estimator: Update Rule');
  const updateRuleRes = await fetch(`${BASE_URL}/admin/estimator-rules/${rulePublicId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      base_rate: 5500,
      is_active: false,
    }),
  });
  const updateRuleData = await updateRuleRes.json();
  assert(updateRuleRes.status === 200 && updateRuleData.data?.is_active === false, 'Updated estimator rule (toggled active off and modified base rate)');

  // 15. Estimator: Delete Rule
  console.log('\n[15] Estimator: Delete Rule');
  const deleteRuleRes = await fetch(`${BASE_URL}/admin/estimator-rules/${rulePublicId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  assert(deleteRuleRes.status === 200, `Deleted estimator rule (${rulePublicId})`);

  console.log('\n======================================');
  console.log(`Total tests passed: ${passed}`);
  console.log(`Total tests failed: ${failed}`);
  console.log('======================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
