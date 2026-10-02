const app = require('./src/app');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Order = require('./src/models/Order');
const OrderItem = require('./src/models/OrderItem');
const Payment = require('./src/models/Payment');
const AuditLog = require('./src/models/AuditLog');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep14Tests() {
  console.log('====================================================');
  console.log('STEP 14: PAYMENTS API VERIFICATION');
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
      console.log(`Step 14 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step14Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step14_${uniqueId}@example.com`;
  const adminEmail = `admin_step14_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;
  let testOrder;
  let cancelledOrder;

  let createdPaymentPublicId;
  let pendingPaymentPublicId;

  try {
    console.log('--- 1. Seed Accounts & Orders ---');
    customerUser = await User.query().insert({
      name: 'Step14 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step14 Admin',
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

    // Create an active test order
    testOrder = await Order.query().insert({
      public_id: require('crypto').randomUUID(),
      order_number: `SKF-ORD-${new Date().getFullYear()}-880001`,
      customer_name: 'Vikramaditya Industries',
      customer_phone: '+919876001122',
      customer_email: 'vikram@industries.com',
      subtotal: 100000,
      total_amount: 100000,
      status: 'confirmed',
    });

    await OrderItem.query().insert({
      public_id: require('crypto').randomUUID(),
      order_id: testOrder.id,
      description: 'Industrial SS Exhaust Hood',
      quantity: 2,
      unit_price: 50000,
      line_total: 100000,
    });
    assert(Boolean(testOrder?.public_id), 'Active test order created');

    // Create a cancelled order
    cancelledOrder = await Order.query().insert({
      public_id: require('crypto').randomUUID(),
      order_number: `SKF-ORD-${new Date().getFullYear()}-880002`,
      customer_name: 'Cancelled Project Ltd',
      customer_phone: '+919876003344',
      subtotal: 20000,
      total_amount: 20000,
      status: 'cancelled',
    });
    assert(Boolean(cancelledOrder?.public_id), 'Cancelled test order created');

    console.log('\n--- 2. Create Payment Record & Validation ---');
    // Reject payment on cancelled order
    const rejectCancelledRes = await fetch(`${baseUrl}/api/v1/admin/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        order_public_id: cancelledOrder.public_id,
        amount: 5000,
      }),
    });
    assert(rejectCancelledRes.status === 400, 'Payment for cancelled order rejected with HTTP 400');

    // Reject payment with negative or zero amount
    const rejectZeroRes = await fetch(`${baseUrl}/api/v1/admin/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        order_public_id: testOrder.public_id,
        amount: 0,
      }),
    });
    assert(rejectZeroRes.status === 400, 'Zero amount payment rejected with HTTP 400');

    // Create a paid payment record (advance: 40000)
    const createPaidRes = await fetch(`${baseUrl}/api/v1/admin/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        order_public_id: testOrder.public_id,
        amount: 40000,
        currency: 'INR',
        gateway: 'bank_transfer',
        status: 'paid',
        metadata: { utr: 'NEFT12345678', bank: 'HDFC Bank' },
      }),
    });
    const createPaidData = await createPaidRes.json();
    assert(createPaidRes.status === 201, 'POST /admin/payments returns HTTP 201');
    const createdPayment = createPaidData.data?.payment;
    createdPaymentPublicId = createdPayment?.public_id;
    assert(Boolean(createdPaymentPublicId), 'Payment record has public_id');
    assert(Boolean(createdPayment?.payment_reference), `Generated payment_reference: ${createdPayment?.payment_reference}`);
    assert(createdPayment?.status === 'paid', 'Payment status is paid');
    assert(Boolean(createdPayment?.paid_at), 'paid_at timestamp set automatically on paid status');
    assert(createdPayment?.id === undefined, 'Internal ID is NOT exposed');

    // Create a pending payment record
    const createPendingRes = await fetch(`${baseUrl}/api/v1/admin/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        order_public_id: testOrder.public_id,
        amount: 60000,
        currency: 'INR',
        gateway: 'cashfree',
        status: 'pending',
      }),
    });
    const createPendingData = await createPendingRes.json();
    assert(createPendingRes.status === 201, 'POST /admin/payments pending returns HTTP 201');
    pendingPaymentPublicId = createPendingData.data?.payment?.public_id;
    assert(Boolean(pendingPaymentPublicId), 'Pending payment created');

    console.log('\n--- 3. Get Payment By Public ID ---');
    const getPaymentRes = await fetch(`${baseUrl}/api/v1/admin/payments/${createdPaymentPublicId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getPaymentData = await getPaymentRes.json();
    assert(getPaymentRes.status === 200, 'GET /admin/payments/:publicId returns HTTP 200');
    assert(getPaymentData.data?.payment?.public_id === createdPaymentPublicId, 'Payment public_id matches');
    assert(getPaymentData.data?.payment?.order?.order_number === testOrder.order_number, 'Linked order summary populated');
    assert(getPaymentData.data?.payment?.order?.total_amount === 100000, 'Order total matches');

    console.log('\n--- 4. List Payments & Filters ---');
    const listRes = await fetch(`${baseUrl}/api/v1/admin/payments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, 'GET /admin/payments returns HTTP 200');
    assert(listData.data?.pagination?.total >= 2, 'Total payments >= 2');

    // Filter by status=paid
    const filterPaidRes = await fetch(`${baseUrl}/api/v1/admin/payments?status=paid`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const filterPaidData = await filterPaidRes.json();
    assert(filterPaidData.data.items.every((p) => p.status === 'paid'), 'Filter by status=paid works');

    // Filter by gateway=cashfree
    const filterGwRes = await fetch(`${baseUrl}/api/v1/admin/payments?gateway=cashfree`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const filterGwData = await filterGwRes.json();
    assert(filterGwData.data.items.some((p) => p.gateway === 'cashfree'), 'Filter by gateway works');

    // Filter by order_public_id
    const filterOrderRes = await fetch(`${baseUrl}/api/v1/admin/payments?order_public_id=${testOrder.public_id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const filterOrderData = await filterOrderRes.json();
    assert(filterOrderData.data.items.length >= 2, 'Filter by order public ID works');

    console.log('\n--- 5. Payment Status Transitions ---');
    // pending -> paid on pendingPayment
    const markPaidRes = await fetch(`${baseUrl}/api/v1/admin/payments/${pendingPaymentPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'paid',
        gateway_payment_id: 'cf_pay_998877',
      }),
    });
    const markPaidData = await markPaidRes.json();
    assert(markPaidRes.status === 200, 'POST status pending -> paid returns HTTP 200');
    assert(markPaidData.data?.payment?.status === 'paid', 'Status is now paid');
    assert(Boolean(markPaidData.data?.payment?.paid_at), 'paid_at timestamp recorded');
    assert(markPaidData.data?.payment?.gateway_payment_id === 'cf_pay_998877', 'gateway_payment_id saved');

    // paid -> partially_refunded
    const refundRes = await fetch(`${baseUrl}/api/v1/admin/payments/${pendingPaymentPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'partially_refunded',
        failure_reason: 'Client requested cancellation of accessory item',
        metadata: { refund_amount: 10000 },
      }),
    });
    const refundData = await refundRes.json();
    assert(refundRes.status === 200, 'POST status paid -> partially_refunded returns HTTP 200');
    assert(refundData.data?.payment?.status === 'partially_refunded', 'Status is partially_refunded');

    // partially_refunded -> refunded
    const fullRefundRes = await fetch(`${baseUrl}/api/v1/admin/payments/${pendingPaymentPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'refunded',
        failure_reason: 'Remaining amount refunded',
      }),
    });
    assert(fullRefundRes.status === 200, 'partially_refunded -> refunded returns HTTP 200');

    // Invalid transition: refunded -> pending (rejected)
    const invalidTransRes = await fetch(`${baseUrl}/api/v1/admin/payments/${pendingPaymentPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'pending',
      }),
    });
    assert(invalidTransRes.status === 400, 'Invalid transition from refunded rejected with HTTP 400');

    console.log('\n--- 6. Update Payment Metadata ---');
    const updateRes = await fetch(`${baseUrl}/api/v1/admin/payments/${createdPaymentPublicId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        gateway_payment_id: 'HDFC_TXN_00112233',
        metadata: { verified_by: 'Accountant Sunil' },
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'PATCH /admin/payments/:publicId returns HTTP 200');
    assert(updateData.data?.payment?.gateway_payment_id === 'HDFC_TXN_00112233', 'gateway_payment_id updated');

    console.log('\n--- 7. Order Payment Summary Integration ---');
    const orderRes = await fetch(`${baseUrl}/api/v1/admin/orders/${testOrder.public_id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 200, 'GET /admin/orders/:publicId returns HTTP 200');
    const summary = orderData.data?.order?.payment_summary;
    assert(summary !== undefined, 'Payment summary present on order');
    assert(summary?.total_paid === 40000, 'Order payment summary accurately calculates total_paid = 40000');
    assert(summary?.pending_amount === 60000, 'Order payment summary accurately calculates pending_amount = 60000');

    console.log('\n--- 8. Authorization & Audit Logs ---');
    const custRes = await fetch(`${baseUrl}/api/v1/admin/payments`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custRes.status === 403, 'Non-admin rejected from payments API with HTTP 403');

    const paymentAuditLogs = await AuditLog.query().where('entity_type', 'Payment');
    assert(paymentAuditLogs.length >= 4, 'Multiple payment mutation audit logs recorded');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 14 test records ---');
    try {
      if (testOrder) {
        await Payment.query().where('order_id', testOrder.id).delete();
        await OrderItem.query().where('order_id', testOrder.id).delete();
        await Order.query().deleteById(testOrder.id);
      }
      if (cancelledOrder) {
        await Payment.query().where('order_id', cancelledOrder.id).delete();
        await Order.query().deleteById(cancelledOrder.id);
      }
      if (customerUser) await User.query().deleteById(customerUser.id);
      if (adminUser) await User.query().deleteById(adminUser.id);
      console.log('Step 14 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 14 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStep14Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 14 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep14Tests;
