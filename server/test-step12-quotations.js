const app = require('./src/app');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Enquiry = require('./src/models/Enquiry');
const B2BAccount = require('./src/models/B2BAccount');
const Quotation = require('./src/models/Quotation');
const QuotationItem = require('./src/models/QuotationItem');
const QuotationStatusLog = require('./src/models/QuotationStatusLog');
const AuditLog = require('./src/models/AuditLog');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep12Tests() {
  console.log('====================================================');
  console.log('STEP 12: QUOTATIONS API VERIFICATION');
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

  await new Promise((resolve) => {
    testServer = app.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Step 12 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step12Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step12_${uniqueId}@example.com`;
  const adminEmail = `admin_step12_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;
  let testCategory;
  let testProduct;
  let testEnquiry;
  let testB2BAccount;

  let directQuotationPublicId;
  let enquiryQuotationPublicId;
  let b2bQuotationPublicId;
  let addedItemPublicId;

  try {
    console.log('--- 1. Seed Accounts, Product, Enquiry, B2B Account ---');
    customerUser = await User.query().insert({
      name: 'Step12 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step12 Admin',
      email: adminEmail,
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    // Login customer
    const custLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerEmail, password: testPassword }),
    });
    const custLoginData = await custLoginRes.json();
    customerToken = custLoginData.data?.accessToken;
    assert(Boolean(customerToken), 'Customer authenticated');

    // Login admin
    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: testPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.accessToken;
    assert(Boolean(adminToken), 'Admin authenticated');

    // Create Category & Product
    testCategory = await Category.query().insert({
      name: 'SS Commercial Kitchen',
      slug: `ss-commercial-kitchen-${uniqueId}`,
      is_active: true,
    });

    testProduct = await Product.query().insert({
      name: 'SS 304 Work Table Heavy Duty',
      slug: `ss-304-work-table-${uniqueId}`,
      product_code: `WT-${uniqueId}`,
      category_id: testCategory.id,
      status: 'published',
    });
    assert(Boolean(testProduct?.public_id), 'Test product created');

    // Create Enquiry
    testEnquiry = await Enquiry.query().insert({
      customer_name: 'Hotel Oberoi Project',
      phone: '+919876543210',
      email: 'procurement@oberoi.com',
      source: 'web_form',
      message: 'Need 10 custom tables for kitchen expansion',
      product_id: testProduct.id,
      status: 'new',
    });
    assert(Boolean(testEnquiry?.public_id), 'Test enquiry created');

    // Create B2B Account
    testB2BAccount = await B2BAccount.query().insert({
      company_name: 'Apex Kitchen Equipments Ltd',
      contact_name: 'Rajesh Mehta',
      email: `apex_${uniqueId}@example.com`,
      phone: '+919988776655',
      business_type: 'contractor',
      verification_status: 'approved',
    });
    assert(Boolean(testB2BAccount?.public_id), 'Test B2B account created');

    console.log('\n--- 2. Direct Quotation Creation & Financial Calculations ---');
    // POST /admin/quotations
    const createDirectRes = await fetch(`${baseUrl}/api/v1/admin/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        customer_name: 'Metro Hospitals SS Counters',
        customer_phone: '+919123456789',
        customer_email: 'facilities@metrohospital.org',
        valid_until: '2026-12-31',
        notes: 'Fabricated with matte brush finish 304 food-grade',
        customization_amount: 500,
        transport_amount: 1200,
        installation_amount: 800,
        discount_amount: 300,
        tax_amount: 1800,
        items: [
          {
            product_public_id: testProduct.public_id,
            description: 'Custom SS 304 Island Prep Table 8x4 ft',
            quantity: 2,
            unit_price: 15000,
            customization_amount: 2000,
            discount_amount: 1000,
            metadata: { finish: 'brushed', grade: '304' },
          },
          {
            description: 'Custom Undercounter Storage Rack',
            quantity: 3,
            unit_price: 4000,
            customization_amount: 500,
            discount_amount: 200,
          },
        ],
      }),
    });

    const createDirectData = await createDirectRes.json();
    assert(createDirectRes.status === 201, 'POST /admin/quotations returns HTTP 201');
    const createdQuotation = createDirectData.data?.quotation;
    directQuotationPublicId = createdQuotation?.public_id;
    assert(Boolean(directQuotationPublicId), 'Quotation has public_id');
    assert(Boolean(createdQuotation?.quotation_number), `Quotation number assigned: ${createdQuotation?.quotation_number}`);
    assert(createdQuotation?.status === 'draft', 'Initial status is draft');
    assert(createdQuotation?.id === undefined, 'Internal ID is NOT exposed');

    // Verify Server-Side Calculations:
    // Item 1: (2 * 15000) = 30000 + 2000 - 1000 = 31000
    // Item 2: (3 * 4000) = 12000 + 500 - 200 = 12300
    // Subtotal = 31000 + 12300 = 43300
    // Header customization: 500
    // Header transport: 1200
    // Header installation: 800
    // Header discount: 300
    // Header tax: 1800
    // Total = 43300 + 500 + 1200 + 800 - 300 + 1800 = 47300
    const item1 = createdQuotation.items[0];
    const item2 = createdQuotation.items[1];
    assert(item1.line_total === 31000, 'Item 1 line_total calculated accurately: 31000');
    assert(item2.line_total === 12300, 'Item 2 line_total calculated accurately: 12300');
    assert(createdQuotation.subtotal === 43300, 'Quotation subtotal calculated accurately: 43300');
    assert(createdQuotation.total_amount === 47300, 'Quotation total_amount calculated accurately: 47300');

    console.log('\n--- 3. Quotation from Enquiry ---');
    const createEnqRes = await fetch(`${baseUrl}/api/v1/admin/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        enquiry_public_id: testEnquiry.public_id,
        items: [
          {
            product_public_id: testProduct.public_id,
            description: '10x Custom Work Tables for Oberoi Kitchen',
            quantity: 10,
            unit_price: 12000,
          },
        ],
      }),
    });
    const createEnqData = await createEnqRes.json();
    assert(createEnqRes.status === 201, 'POST /admin/quotations from enquiry returns HTTP 201');
    const enqQuotation = createEnqData.data?.quotation;
    enquiryQuotationPublicId = enqQuotation?.public_id;
    assert(enqQuotation?.customer_name === 'Hotel Oberoi Project', 'Customer snapshot populated from enquiry');
    assert(enqQuotation?.customer_phone === '+919876543210', 'Phone populated from enquiry');
    assert(enqQuotation?.enquiry?.public_id === testEnquiry.public_id, 'Enquiry relation resolved');
    assert(enqQuotation?.total_amount === 120000, 'Total calculated correctly: 120000');

    console.log('\n--- 4. Quotation for B2B Account ---');
    const createB2bRes = await fetch(`${baseUrl}/api/v1/admin/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        b2b_account_public_id: testB2BAccount.public_id,
        items: [
          {
            description: 'B2B Wholesale SS Fabrication lot',
            quantity: 1,
            unit_price: 250000,
            discount_amount: 25000,
          },
        ],
      }),
    });
    const createB2bData = await createB2bRes.json();
    assert(createB2bRes.status === 201, 'POST /admin/quotations for B2B returns HTTP 201');
    const b2bQuotation = createB2bData.data?.quotation;
    b2bQuotationPublicId = b2bQuotation?.public_id;
    assert(b2bQuotation?.b2b_account?.company_name === 'Apex Kitchen Equipments Ltd', 'B2B account relation resolved');
    assert(b2bQuotation?.total_amount === 225000, 'B2B quotation total calculated: 225000');

    console.log('\n--- 5. Admin Quotation List & Filters ---');
    const listRes = await fetch(`${baseUrl}/api/v1/admin/quotations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, 'GET /admin/quotations returns HTTP 200');
    assert(Array.isArray(listData.data?.items), 'Returns items array');
    assert(listData.data?.pagination?.total >= 3, 'Contains seeded quotations');

    // Filter by status=draft
    const filterRes = await fetch(`${baseUrl}/api/v1/admin/quotations?status=draft`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const filterData = await filterRes.json();
    assert(filterRes.status === 200, 'Filtered query returns HTTP 200');
    assert(filterData.data.items.every((q) => q.status === 'draft'), 'All returned items have status draft');

    // Filter by search
    const searchRes = await fetch(`${baseUrl}/api/v1/admin/quotations?search=Oberoi`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchData = await searchRes.json();
    assert(searchData.data.items.some((q) => q.customer_name.includes('Oberoi')), 'Search matches customer name');

    console.log('\n--- 6. Get Quotation By Public ID ---');
    const getRes = await fetch(`${baseUrl}/api/v1/admin/quotations/${directQuotationPublicId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getData = await getRes.json();
    assert(getRes.status === 200, 'GET /admin/quotations/:publicId returns HTTP 200');
    assert(getData.data?.quotation?.public_id === directQuotationPublicId, 'Quotation publicId matches');
    assert(getData.data?.quotation?.items?.length === 2, 'Contains 2 quotation items');
    assert(getData.data?.quotation?.status_logs?.length >= 1, 'Contains initial status log');

    console.log('\n--- 7. Quotation Items Management ---');
    // Add item
    const addItemRes = await fetch(`${baseUrl}/api/v1/admin/quotations/${directQuotationPublicId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        description: 'Extra SS Splash Guard 4x1 ft',
        quantity: 2,
        unit_price: 1500,
        customization_amount: 0,
        discount_amount: 0,
      }),
    });
    const addItemData = await addItemRes.json();
    assert(addItemRes.status === 201, 'POST /admin/quotations/:publicId/items returns HTTP 201');
    const updatedWithItem = addItemData.data?.quotation;
    assert(updatedWithItem?.items?.length === 3, 'Quotation now has 3 items');
    // Previous total: 47300 + (2 * 1500 = 3000) = 50300
    assert(updatedWithItem?.total_amount === 50300, 'Quotation total recalculated accurately to 50300');
    addedItemPublicId = updatedWithItem.items.find((i) => i.description === 'Extra SS Splash Guard 4x1 ft')?.public_id;
    assert(Boolean(addedItemPublicId), 'Added item has public_id');

    // Update item
    const updateItemRes = await fetch(
      `${baseUrl}/api/v1/admin/quotations/${directQuotationPublicId}/items/${addedItemPublicId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          quantity: 4, // 4 * 1500 = 6000 (diff: +3000)
        }),
      }
    );
    const updateItemData = await updateItemRes.json();
    assert(updateItemRes.status === 200, 'PATCH item returns HTTP 200');
    assert(updateItemData.data?.quotation?.total_amount === 53300, 'Total updated after item quantity change: 53300');

    // Delete item
    const deleteItemRes = await fetch(
      `${baseUrl}/api/v1/admin/quotations/${directQuotationPublicId}/items/${addedItemPublicId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const deleteItemData = await deleteItemRes.json();
    assert(deleteItemRes.status === 200, 'DELETE item returns HTTP 200');
    assert(deleteItemData.data?.quotation?.total_amount === 47300, 'Total reverted to 47300 after item deletion');

    console.log('\n--- 8. Quotation Status Lifecycle & Logs ---');
    // draft -> sent
    const toSentRes = await fetch(`${baseUrl}/api/v1/admin/quotations/${directQuotationPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'sent', comment: 'Emailed official proposal to client' }),
    });
    const toSentData = await toSentRes.json();
    assert(toSentRes.status === 200, 'POST status draft -> sent returns HTTP 200');
    assert(toSentData.data?.quotation?.status === 'sent', 'Status is now sent');

    // sent -> accepted
    const toAcceptedRes = await fetch(`${baseUrl}/api/v1/admin/quotations/${directQuotationPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'accepted', comment: 'Client signed and approved quotation' }),
    });
    const toAcceptedData = await toAcceptedRes.json();
    assert(toAcceptedRes.status === 200, 'POST status sent -> accepted returns HTTP 200');
    assert(toAcceptedData.data?.quotation?.status === 'accepted', 'Status is now accepted');
    assert(toAcceptedData.data?.quotation?.status_logs?.length >= 3, 'Status logs contain creation, sent, accepted');

    // Invalid transition: accepted -> draft (rejected)
    const invalidTransRes = await fetch(`${baseUrl}/api/v1/admin/quotations/${directQuotationPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'draft', comment: 'Trying invalid move back to draft' }),
    });
    assert(invalidTransRes.status === 400, 'Invalid status transition accepted -> draft rejected with HTTP 400');

    // Accepted quotation cannot have items modified
    const modifyAcceptedRes = await fetch(`${baseUrl}/api/v1/admin/quotations/${directQuotationPublicId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ customer_name: 'Attempt change on accepted' }),
    });
    assert(modifyAcceptedRes.status === 400, 'Modification on accepted quotation rejected with HTTP 400');

    console.log('\n--- 9. Delete Quotation Rules ---');
    // Cannot delete accepted quotation
    const delAcceptedRes = await fetch(`${baseUrl}/api/v1/admin/quotations/${directQuotationPublicId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(delAcceptedRes.status === 400, 'Deleting accepted quotation rejected with HTTP 400');

    // Can delete draft quotation (b2bQuotation is draft)
    const delDraftRes = await fetch(`${baseUrl}/api/v1/admin/quotations/${b2bQuotationPublicId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(delDraftRes.status === 200, 'DELETE draft quotation returns HTTP 200');

    const getDeletedRes = await fetch(`${baseUrl}/api/v1/admin/quotations/${b2bQuotationPublicId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(getDeletedRes.status === 404, 'Deleted quotation returns HTTP 404');

    console.log('\n--- 10. Authorization & Security Checks ---');
    // Customer cannot access admin quotations
    const custAccessRes = await fetch(`${baseUrl}/api/v1/admin/quotations`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custAccessRes.status === 403, 'Non-admin user rejected from admin quotations with HTTP 403');

    // Unauthenticated rejected
    const noAuthRes = await fetch(`${baseUrl}/api/v1/admin/quotations`);
    assert(noAuthRes.status === 401, 'Unauthenticated request rejected with HTTP 401');

    // Negative unit price rejected
    const negPriceRes = await fetch(`${baseUrl}/api/v1/admin/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        customer_name: 'Test Neg',
        customer_phone: '+919999999999',
        items: [
          {
            description: 'Item',
            quantity: 1,
            unit_price: -50,
          },
        ],
      }),
    });
    assert(negPriceRes.status === 400, 'Negative unit price rejected with HTTP 400');

    // Check Audit Logs recorded
    const quotationAuditLogs = await AuditLog.query().where('entity_type', 'Quotation');
    assert(quotationAuditLogs.length >= 4, 'Multiple quotation mutation audit logs recorded');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 12 test records ---');
    try {
      if (directQuotationPublicId) {
        const q = await Quotation.query().where('public_id', directQuotationPublicId).first();
        if (q) {
          await QuotationItem.query().where('quotation_id', q.id).delete();
          await QuotationStatusLog.query().where('quotation_id', q.id).delete();
          await Quotation.query().deleteById(q.id);
        }
      }
      if (enquiryQuotationPublicId) {
        const q = await Quotation.query().where('public_id', enquiryQuotationPublicId).first();
        if (q) {
          await QuotationItem.query().where('quotation_id', q.id).delete();
          await QuotationStatusLog.query().where('quotation_id', q.id).delete();
          await Quotation.query().deleteById(q.id);
        }
      }
      if (testEnquiry) await Enquiry.query().deleteById(testEnquiry.id);
      if (testB2BAccount) await B2BAccount.query().deleteById(testB2BAccount.id);
      if (testProduct) await Product.query().deleteById(testProduct.id);
      if (testCategory) await Category.query().deleteById(testCategory.id);
      if (customerUser) await User.query().deleteById(customerUser.id);
      if (adminUser) await User.query().deleteById(adminUser.id);
      console.log('Step 12 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 12 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStep12Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 12 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep12Tests;
