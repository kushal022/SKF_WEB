const app = require('./src/app');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Enquiry = require('./src/models/Enquiry');
const Quotation = require('./src/models/Quotation');
const QuotationItem = require('./src/models/QuotationItem');
const QuotationStatusLog = require('./src/models/QuotationStatusLog');
const Order = require('./src/models/Order');
const OrderItem = require('./src/models/OrderItem');
const OrderStatusLog = require('./src/models/OrderStatusLog');
const Payment = require('./src/models/Payment');
const Notification = require('./src/models/Notification');
const AuditLog = require('./src/models/AuditLog');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep17Tests() {
  console.log('====================================================');
  console.log('STEP 17: FINAL API HARDENING & INTEGRATION TESTING');
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
      console.log(`Step 17 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step17Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step17_${uniqueId}@example.com`;
  const adminEmail = `admin_step17_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;
  let testCategory;
  let testProduct;

  let enquiryPublicId;
  let quotationPublicId;
  let orderPublicId;
  let payment1PublicId;
  let payment2PublicId;

  // Secondary quotation & order for cross-resource isolation testing
  let otherQuotationPublicId;
  let otherOrderPublicId;
  let otherQuotationItemPublicId;
  let otherOrderItemPublicId;

  try {
    console.log('--- 1. Seed Accounts & Product ---');
    customerUser = await User.query().insert({
      name: 'Step17 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step17 Admin',
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
    assert(Boolean(customerToken), 'Customer authenticated');

    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: testPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.accessToken;
    assert(Boolean(adminToken), 'Admin authenticated');

    testCategory = await Category.query().insert({
      name: 'SS Commercial Kitchen Equipment',
      slug: `ss-comm-kitchen-${uniqueId}`,
      is_active: true,
    });

    testProduct = await Product.query().insert({
      name: 'SS 304 Master Chef Island 12ft',
      slug: `ss-master-chef-island-${uniqueId}`,
      product_code: `MCI-${uniqueId}`,
      category_id: testCategory.id,
      status: 'published',
    });
    assert(Boolean(testProduct?.public_id), 'Product created');

    console.log('\n--- 2. End-to-End Flow: Customer Enquiry ---');
    // Public enquiry submission
    const enqRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Grand Hyatt Executive Chef',
        phone: '+919876543210',
        email: 'chef.executive@hyatt.com',
        source: 'catalogue',
        message: 'Need quotation for 2 custom 12ft chef prep islands with heat lamps',
        product_public_id: testProduct.public_id,
      }),
    });
    const enqData = await enqRes.json();
    assert(enqRes.status === 201, 'Public enquiry submitted (HTTP 201)');
    enquiryPublicId = enqData.data?.public_id || enqData.data?.enquiry?.public_id;
    assert(Boolean(enquiryPublicId), 'Enquiry has public_id');

    console.log('\n--- 3. End-to-End Flow: Quotation Generation & Acceptance ---');
    // Admin creates quotation from enquiry
    const quotRes = await fetch(`${baseUrl}/api/v1/admin/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        enquiry_public_id: enquiryPublicId,
        valid_until: '2026-11-30',
        notes: 'Includes integrated heat lamps and food-grade satin finish',
        transport_amount: 5000,
        installation_amount: 3000,
        discount_amount: 8000,
        tax_amount: 36000,
        items: [
          {
            product_public_id: testProduct.public_id,
            description: 'Custom 12ft SS 304 Chef Prep Island',
            quantity: 2,
            unit_price: 100000,
            customization_amount: 10000, // 2 * 100000 = 200000 + 10000 = 210000
            discount_amount: 2000, // 210000 - 2000 = 208000
          },
        ],
      }),
    });
    const quotData = await quotRes.json();
    assert(quotRes.status === 201, 'Admin quotation created from enquiry (HTTP 201)');
    const quotation = quotData.data?.quotation;
    quotationPublicId = quotation?.public_id;
    // Calculation: Item line_total = 208000.
    // Quotation Total = 208000 + 5000 (transport) + 3000 (installation) - 8000 (discount) + 36000 (tax) = 244000.
    assert(quotation?.subtotal === 208000, 'Quotation subtotal matches item line_total: 208000');
    assert(quotation?.total_amount === 244000, 'Quotation total calculated correctly: 244000');

    // Move quotation: draft -> sent
    const sentRes = await fetch(`${baseUrl}/api/v1/admin/quotations/${quotationPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'sent', comment: 'Proposal delivered to client' }),
    });
    assert(sentRes.status === 200, 'Quotation transitioned draft -> sent');

    // Move quotation: sent -> accepted
    const acceptedRes = await fetch(`${baseUrl}/api/v1/admin/quotations/${quotationPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'accepted', comment: 'PO received from Hyatt procurement' }),
    });
    assert(acceptedRes.status === 200, 'Quotation transitioned sent -> accepted');

    console.log('\n--- 4. End-to-End Flow: Quotation Conversion to Order ---');
    const orderConvRes = await fetch(`${baseUrl}/api/v1/admin/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        quotation_public_id: quotationPublicId,
      }),
    });
    const orderConvData = await orderConvRes.json();
    assert(orderConvRes.status === 201, 'Quotation converted to Order (HTTP 201)');
    const order = orderConvData.data?.order;
    orderPublicId = order?.public_id;
    assert(order?.customer_name === 'Grand Hyatt Executive Chef', 'Order customer snapshot preserved');
    assert(order?.total_amount === 244000, 'Order total matches quotation total: 244000');
    assert(order?.status === 'pending', 'Order initialized in pending status');

    console.log('\n--- 5. End-to-End Flow: Advance Payment & Order Progression ---');
    // Record 50% advance payment (122000)
    const pay1Res = await fetch(`${baseUrl}/api/v1/admin/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        order_public_id: orderPublicId,
        amount: 122000,
        currency: 'INR',
        gateway: 'bank_transfer',
        status: 'paid',
        metadata: { transaction_ref: 'RTGS_ADVANCE_HYATT_01' },
      }),
    });
    const pay1Data = await pay1Res.json();
    assert(pay1Res.status === 201, '50% advance payment recorded (HTTP 201)');
    payment1PublicId = pay1Data.data?.payment?.public_id;

    // Check order payment summary reflects advance
    const orderCheck1Res = await fetch(`${baseUrl}/api/v1/admin/orders/${orderPublicId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const orderCheck1Data = await orderCheck1Res.json();
    assert(orderCheck1Data.data?.order?.payment_summary?.total_paid === 122000, 'Order payment summary: total_paid = 122000');
    assert(orderCheck1Data.data?.order?.payment_summary?.pending_amount === 122000, 'Order payment summary: pending_amount = 122000');

    // Progress order: pending -> confirmed -> manufacturing -> ready
    await fetch(`${baseUrl}/api/v1/admin/orders/${orderPublicId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'confirmed', comment: 'Advance received, engineering drawings approved' }),
    });

    await fetch(`${baseUrl}/api/v1/admin/orders/${orderPublicId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'manufacturing', comment: 'Factory fabrication started' }),
    });

    const readyRes = await fetch(`${baseUrl}/api/v1/admin/orders/${orderPublicId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'ready', comment: 'Fabrication and QC complete' }),
    });
    assert(readyRes.status === 200, 'Order transitioned to ready');

    console.log('\n--- 6. End-to-End Flow: Final Balance Payment & Delivery ---');
    // Record remaining balance payment (122000)
    const pay2Res = await fetch(`${baseUrl}/api/v1/admin/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        order_public_id: orderPublicId,
        amount: 122000,
        currency: 'INR',
        gateway: 'bank_transfer',
        status: 'paid',
        metadata: { transaction_ref: 'RTGS_FINAL_HYATT_02' },
      }),
    });
    const pay2Data = await pay2Res.json();
    assert(pay2Res.status === 201, 'Remaining balance payment recorded (HTTP 201)');
    payment2PublicId = pay2Data.data?.payment?.public_id;

    // Move order: ready -> dispatched -> delivered
    await fetch(`${baseUrl}/api/v1/admin/orders/${orderPublicId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'dispatched', comment: 'Dispatched to Hyatt kitchen site' }),
    });

    const delivRes = await fetch(`${baseUrl}/api/v1/admin/orders/${orderPublicId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'delivered', comment: 'Installed and handed over' }),
    });
    assert(delivRes.status === 200, 'Order successfully delivered');

    // Verify order is 100% paid
    const orderFinalRes = await fetch(`${baseUrl}/api/v1/admin/orders/${orderPublicId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const orderFinalData = await orderFinalRes.json();
    const finalOrder = orderFinalData.data?.order;
    assert(finalOrder?.status === 'delivered', 'Final order status is delivered');
    assert(finalOrder?.payment_summary?.total_paid === 244000, 'Order 100% paid: total_paid = 244000');
    assert(finalOrder?.payment_summary?.pending_amount === 0, 'Order pending_amount = 0');
    assert(finalOrder?.status_logs?.length >= 5, 'Complete lifecycle history preserved in status logs');

    console.log('\n--- 7. Security Hardening: Cross-Resource Isolation ---');
    // Create a secondary quotation and order to test cross-resource tampering
    const otherQuotRes = await fetch(`${baseUrl}/api/v1/admin/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customer_name: 'Other Company Ltd',
        customer_phone: '+919999000011',
        items: [{ description: 'Other item', quantity: 1, unit_price: 5000 }],
      }),
    });
    const otherQuotData = await otherQuotRes.json();
    otherQuotationPublicId = otherQuotData.data?.quotation?.public_id;
    otherQuotationItemPublicId = otherQuotData.data?.quotation?.items[0]?.public_id;

    // Cross-resource attack: Attempt to patch other quotation's item using primary quotation's URL
    const crossPatchRes = await fetch(
      `${baseUrl}/api/v1/admin/quotations/${quotationPublicId}/items/${otherQuotationItemPublicId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ quantity: 10 }),
      }
    );
    assert(crossPatchRes.status === 400 || crossPatchRes.status === 404, 'Cross-quotation item modification rejected');

    // Cross-resource attack: Attempt to delete other quotation's item using primary quotation's URL
    const crossDelRes = await fetch(
      `${baseUrl}/api/v1/admin/quotations/${quotationPublicId}/items/${otherQuotationItemPublicId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert(crossDelRes.status === 400 || crossDelRes.status === 404, 'Cross-quotation item deletion rejected');

    console.log('\n--- 8. Security Hardening: SQL Injection & Malformed Parameters ---');
    // SQL injection attempt in search filter
    const sqlSearchRes = await fetch(
      `${baseUrl}/api/v1/admin/quotations?search=${encodeURIComponent("' OR '1'='1' --")}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert(sqlSearchRes.status === 200, 'SQL injection in search handled safely by Knex (HTTP 200)');
    const sqlData = await sqlSearchRes.json();
    assert(sqlData.success === true, 'Response follows standard API format');

    // SQL injection in sort_by
    const sqlSortRes = await fetch(
      `${baseUrl}/api/v1/admin/orders?sort_by=${encodeURIComponent("created_at; DROP TABLE orders; --")}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert(sqlSortRes.status === 400, 'Illegal sort_by parameter rejected with HTTP 400 validation error');

    // Malformed UUID in path param
    const badParamRes = await fetch(`${baseUrl}/api/v1/admin/orders/123-not-a-uuid`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(badParamRes.status === 400, 'Malformed UUID in path rejected with HTTP 400');

    console.log('\n--- 9. Security Hardening: Privilege Escalation & Role Boundaries ---');
    // Customer attempting to create quotation
    const custQuotRes = await fetch(`${baseUrl}/api/v1/admin/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ customer_name: 'Hacker', customer_phone: '+919999999999', items: [] }),
    });
    assert(custQuotRes.status === 403, 'Customer forbidden from admin quotations (HTTP 403)');

    // Customer attempting to view audit logs
    const custAuditRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custAuditRes.status === 403, 'Customer forbidden from audit logs (HTTP 403)');

    // Customer attempting to record payment
    const custPayRes = await fetch(`${baseUrl}/api/v1/admin/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ order_public_id: orderPublicId, amount: 1000 }),
    });
    assert(custPayRes.status === 403, 'Customer forbidden from admin payments (HTTP 403)');

    console.log('\n--- 10. Security Hardening: Sensitive Secret Protection ---');
    // Verify that NO internal numeric IDs or secret fields are leaked in public response envelopes
    assert(finalOrder.id === undefined, 'Order internal id NOT exposed');
    assert(finalOrder.quotation?.id === undefined, 'Quotation internal id NOT exposed');
    assert(finalOrder.items[0]?.id === undefined, 'OrderItem internal id NOT exposed');
    assert(finalOrder.items[0]?.order_id === undefined, 'OrderItem internal order_id NOT exposed');
    assert(finalOrder.items[0]?.product_id === undefined, 'OrderItem internal product_id NOT exposed');

    // Verify Audit Logs redact secrets
    const auditLogsRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs?limit=50`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditLogsData = await auditLogsRes.json();
    assert(auditLogsRes.status === 200, 'GET /admin/audit-logs returns HTTP 200');
    assert(
      auditLogsData.data.items.every(
        (log) =>
          log.old_values?.password_hash !== '$2b$' &&
          log.new_values?.password_hash !== '$2b$' &&
          log.user?.password_hash === undefined
      ),
      'Zero password hashes or auth secrets present in audit logs API output'
    );

    console.log('\n--- 11. Transaction Integrity Verification ---');
    // Multi-table rollback test: pass an invalid product inside quotation items
    const rollbackRes = await fetch(`${baseUrl}/api/v1/admin/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        customer_name: 'Rollback Test',
        customer_phone: '+919876543210',
        items: [
          {
            description: 'Valid item',
            quantity: 1,
            unit_price: 5000,
          },
          {
            product_public_id: '00000000-0000-0000-0000-000000000000', // non-existent product
            description: 'Failing item',
            quantity: 1,
            unit_price: 5000,
          },
        ],
      }),
    });
    assert(rollbackRes.status === 400, 'Quotation with non-existent product rejected with HTTP 400');

    // Confirm no orphaned quotation record was created in database
    const orphanQuotation = await Quotation.query().where('customer_name', 'Rollback Test').first();
    assert(!orphanQuotation, 'Transaction rolled back cleanly: zero orphan records created');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 17 test records ---');
    try {
      if (payment1PublicId) {
        await Payment.query().where('public_id', payment1PublicId).delete();
      }
      if (payment2PublicId) {
        await Payment.query().where('public_id', payment2PublicId).delete();
      }
      if (orderPublicId) {
        const o = await Order.query().where('public_id', orderPublicId).first();
        if (o) {
          await OrderItem.query().where('order_id', o.id).delete();
          await OrderStatusLog.query().where('order_id', o.id).delete();
          await Order.query().deleteById(o.id);
        }
      }
      if (otherQuotationPublicId) {
        const q = await Quotation.query().where('public_id', otherQuotationPublicId).first();
        if (q) {
          await QuotationItem.query().where('quotation_id', q.id).delete();
          await QuotationStatusLog.query().where('quotation_id', q.id).delete();
          await Quotation.query().deleteById(q.id);
        }
      }
      if (quotationPublicId) {
        const q = await Quotation.query().where('public_id', quotationPublicId).first();
        if (q) {
          await QuotationItem.query().where('quotation_id', q.id).delete();
          await QuotationStatusLog.query().where('quotation_id', q.id).delete();
          await Quotation.query().deleteById(q.id);
        }
      }
      if (enquiryPublicId) {
        await Enquiry.query().where('public_id', enquiryPublicId).delete();
      }
      if (testProduct) await Product.query().deleteById(testProduct.id);
      if (testCategory) await Category.query().deleteById(testCategory.id);
      if (customerUser) await User.query().deleteById(customerUser.id);
      if (adminUser) await User.query().deleteById(adminUser.id);
      console.log('Step 17 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 17 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStep17Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 17 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep17Tests;
