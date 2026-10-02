const app = require('./src/app');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Quotation = require('./src/models/Quotation');
const QuotationItem = require('./src/models/QuotationItem');
const Order = require('./src/models/Order');
const OrderItem = require('./src/models/OrderItem');
const OrderStatusLog = require('./src/models/OrderStatusLog');
const AuditLog = require('./src/models/AuditLog');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function runStep13Tests() {
  console.log('====================================================');
  console.log('STEP 13: ORDERS API VERIFICATION');
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
      console.log(`Step 13 test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  const uniqueId = Date.now();
  const testPassword = 'Password@Step13Test';
  const hashedPassword = await hashPassword(testPassword);

  const customerEmail = `cust_step13_${uniqueId}@example.com`;
  const adminEmail = `admin_step13_${uniqueId}@example.com`;

  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;
  let testCategory;
  let testProduct;
  let acceptedQuotation;
  let draftQuotation;

  let directOrderPublicId;
  let convertedOrderPublicId;
  let addedOrderItemPublicId;

  try {
    console.log('--- 1. Seed Accounts, Product & Quotations ---');
    customerUser = await User.query().insert({
      name: 'Step13 Customer',
      email: customerEmail,
      password_hash: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    adminUser = await User.query().insert({
      name: 'Step13 Admin',
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
      name: 'SS Dining Tables',
      slug: `ss-dining-tables-${uniqueId}`,
      is_active: true,
    });

    testProduct = await Product.query().insert({
      name: 'SS Premium Dining Set 6-Seater',
      slug: `ss-premium-dining-${uniqueId}`,
      product_code: `DS-${uniqueId}`,
      category_id: testCategory.id,
      status: 'published',
    });
    assert(Boolean(testProduct?.public_id), 'Product created');

    // Create an accepted quotation with items
    acceptedQuotation = await Quotation.query().insert({
      public_id: require('crypto').randomUUID(),
      quotation_number: `SKF-QT-${new Date().getFullYear()}-990001`,
      customer_name: 'Dr. Alok Verma',
      customer_phone: '+919876500001',
      customer_email: 'alok.verma@example.com',
      subtotal: 55000,
      customization_amount: 0,
      transport_amount: 2000,
      installation_amount: 1500,
      discount_amount: 2500,
      tax_amount: 9000,
      total_amount: 65000,
      status: 'accepted',
      notes: 'Deliver to 4th floor penthouse',
    });

    await QuotationItem.query().insert({
      public_id: require('crypto').randomUUID(),
      quotation_id: acceptedQuotation.id,
      product_id: testProduct.id,
      description: 'Custom 6-Seater SS Table with Marble Inlay',
      quantity: 1,
      unit_price: 55000,
      customization_amount: 0,
      discount_amount: 0,
      line_total: 55000,
    });

    // Create a draft quotation (not accepted)
    draftQuotation = await Quotation.query().insert({
      public_id: require('crypto').randomUUID(),
      quotation_number: `SKF-QT-${new Date().getFullYear()}-990002`,
      customer_name: 'Unconfirmed Client',
      customer_phone: '+919876500002',
      subtotal: 10000,
      total_amount: 10000,
      status: 'draft',
    });

    console.log('\n--- 2. Direct Order Creation & Financial Calculations ---');
    const createDirectRes = await fetch(`${baseUrl}/api/v1/admin/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        customer_name: 'Sunil Shinde',
        customer_phone: '+919422001122',
        customer_email: 'sunil.shinde@example.com',
        notes: 'Ground floor bungalow delivery',
        discount_amount: 1000,
        tax_amount: 3600,
        shipping_amount: 1500,
        installation_amount: 1000,
        items: [
          {
            product_public_id: testProduct.public_id,
            description: 'SS 304 Dining Table',
            quantity: 2,
            unit_price: 10000,
            metadata: { color: 'silver' },
          },
        ],
      }),
    });

    const createDirectData = await createDirectRes.json();
    assert(createDirectRes.status === 201, 'POST /admin/orders direct creation returns HTTP 201');
    const directOrder = createDirectData.data?.order;
    directOrderPublicId = directOrder?.public_id;
    assert(Boolean(directOrderPublicId), 'Direct order has public_id');
    assert(Boolean(directOrder?.order_number), `Order number generated: ${directOrder?.order_number}`);
    assert(directOrder?.status === 'pending', 'Initial order status is pending');
    assert(directOrder?.id === undefined, 'Internal database ID is NOT exposed');

    // Calculations:
    // Subtotal: 2 * 10000 = 20000
    // Total: 20000 - 1000 (discount) + 3600 (tax) + 1500 (shipping) + 1000 (installation) = 25100
    assert(directOrder?.subtotal === 20000, 'Direct order subtotal calculated: 20000');
    assert(directOrder?.total_amount === 25100, 'Direct order total_amount calculated: 25100');

    console.log('\n--- 3. Quotation to Order Conversion ---');
    // Reject conversion if quotation is draft
    const rejectDraftRes = await fetch(`${baseUrl}/api/v1/admin/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        quotation_public_id: draftQuotation.public_id,
      }),
    });
    assert(rejectDraftRes.status === 400, 'Non-accepted quotation conversion rejected with HTTP 400');

    // Convert accepted quotation
    const convertRes = await fetch(`${baseUrl}/api/v1/admin/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        quotation_public_id: acceptedQuotation.public_id,
      }),
    });
    const convertData = await convertRes.json();
    assert(convertRes.status === 201, 'POST /admin/orders quotation conversion returns HTTP 201');
    const convertedOrder = convertData.data?.order;
    convertedOrderPublicId = convertedOrder?.public_id;
    assert(convertedOrder?.customer_name === 'Dr. Alok Verma', 'Customer snapshot preserved from quotation');
    assert(convertedOrder?.customer_phone === '+919876500001', 'Customer phone preserved from quotation');
    assert(convertedOrder?.shipping_amount === 2000, 'Shipping amount copied from quotation transport_amount');
    assert(convertedOrder?.total_amount === 65000, 'Total amount matches quotation total_amount: 65000');
    assert(convertedOrder?.quotation?.public_id === acceptedQuotation.public_id, 'Quotation reference linked');
    assert(convertedOrder?.items?.length === 1, 'Order items copied from quotation items');

    // Duplicate conversion protection
    const dupConvertRes = await fetch(`${baseUrl}/api/v1/admin/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        quotation_public_id: acceptedQuotation.public_id,
      }),
    });
    assert(dupConvertRes.status === 409, 'Duplicate quotation conversion rejected with HTTP 409 Conflict');

    console.log('\n--- 4. Admin Order List & Filters ---');
    const listRes = await fetch(`${baseUrl}/api/v1/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, 'GET /admin/orders returns HTTP 200');
    assert(listData.data?.pagination?.total >= 2, 'Contains seeded orders');

    // Filter by status
    const statusFilterRes = await fetch(`${baseUrl}/api/v1/admin/orders?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statusFilterData = await statusFilterRes.json();
    assert(statusFilterData.data.items.every((o) => o.status === 'pending'), 'Status filter works');

    // Search filter
    const searchRes = await fetch(`${baseUrl}/api/v1/admin/orders?search=Verma`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchData = await searchRes.json();
    assert(searchData.data.items.some((o) => o.customer_name.includes('Verma')), 'Search by customer name works');

    console.log('\n--- 5. Get Order By Public ID ---');
    const getRes = await fetch(`${baseUrl}/api/v1/admin/orders/${directOrderPublicId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getData = await getRes.json();
    assert(getRes.status === 200, 'GET /admin/orders/:publicId returns HTTP 200');
    assert(getData.data?.order?.public_id === directOrderPublicId, 'Order publicId matches');
    assert(getData.data?.order?.payment_summary !== undefined, 'Payment summary included');
    assert(getData.data?.order?.payment_summary?.pending_amount === 25100, 'Pending amount matches total when unpaid');
    assert(getData.data?.order?.status_logs?.length >= 1, 'Initial status log present');

    console.log('\n--- 6. Order Status Lifecycle Transitions ---');
    // pending -> confirmed
    const toConfirmedRes = await fetch(`${baseUrl}/api/v1/admin/orders/${directOrderPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'confirmed', comment: 'Advance received and specs finalized' }),
    });
    const toConfirmedData = await toConfirmedRes.json();
    assert(toConfirmedRes.status === 200, 'Status transition pending -> confirmed HTTP 200');
    assert(toConfirmedData.data?.order?.status === 'confirmed', 'Status is now confirmed');

    // confirmed -> manufacturing
    const toMfgRes = await fetch(`${baseUrl}/api/v1/admin/orders/${directOrderPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'manufacturing', comment: 'Laser cutting and welding started' }),
    });
    assert(toMfgRes.status === 200, 'confirmed -> manufacturing HTTP 200');

    // manufacturing -> ready
    const toReadyRes = await fetch(`${baseUrl}/api/v1/admin/orders/${directOrderPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ready', comment: 'Quality inspection passed, ready for dispatch' }),
    });
    assert(toReadyRes.status === 200, 'manufacturing -> ready HTTP 200');

    // ready -> dispatched
    const toDispRes = await fetch(`${baseUrl}/api/v1/admin/orders/${directOrderPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'dispatched', comment: 'Dispatched via SKF Logistics Truck #MH12-3456' }),
    });
    assert(toDispRes.status === 200, 'ready -> dispatched HTTP 200');

    // dispatched -> delivered
    const toDelivRes = await fetch(`${baseUrl}/api/v1/admin/orders/${directOrderPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'delivered', comment: 'Client signed delivery note' }),
    });
    const toDelivData = await toDelivRes.json();
    assert(toDelivRes.status === 200, 'dispatched -> delivered HTTP 200');
    assert(toDelivData.data?.order?.status === 'delivered', 'Order status is delivered');

    // delivered is terminal: attempting delivered -> pending should fail
    const invalidTermRes = await fetch(`${baseUrl}/api/v1/admin/orders/${directOrderPublicId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'pending', comment: 'Illegal rewind' }),
    });
    assert(invalidTermRes.status === 400, 'Invalid transition from delivered rejected with HTTP 400');

    // Delivered order cannot be updated
    const updateDelivRes = await fetch(`${baseUrl}/api/v1/admin/orders/${directOrderPublicId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ customer_name: 'Cannot modify delivered order' }),
    });
    assert(updateDelivRes.status === 400, 'Modifying delivered order rejected with HTTP 400');

    console.log('\n--- 7. Order Items Management (on active order) ---');
    // Add item to convertedOrder (status: pending)
    const addItemRes = await fetch(`${baseUrl}/api/v1/admin/orders/${convertedOrderPublicId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        description: 'SS Footrest Bar attachment',
        quantity: 1,
        unit_price: 3000,
      }),
    });
    const addItemData = await addItemRes.json();
    assert(addItemRes.status === 201, 'POST /admin/orders/:publicId/items returns HTTP 201');
    const orderWithItem = addItemData.data?.order;
    assert(orderWithItem?.items?.length === 2, 'Order has 2 items now');
    assert(orderWithItem?.total_amount === 68000, 'Order total updated with added item (65000 + 3000 = 68000)');
    addedOrderItemPublicId = orderWithItem.items.find((i) => i.description === 'SS Footrest Bar attachment')?.public_id;
    assert(Boolean(addedOrderItemPublicId), 'Added order item has public_id');

    // Update order item
    const updateItemRes = await fetch(
      `${baseUrl}/api/v1/admin/orders/${convertedOrderPublicId}/items/${addedOrderItemPublicId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          quantity: 2, // 2 * 3000 = 6000 (diff +3000)
        }),
      }
    );
    const updateItemData = await updateItemRes.json();
    assert(updateItemRes.status === 200, 'PATCH order item returns HTTP 200');
    assert(updateItemData.data?.order?.total_amount === 71000, 'Order total updated to 71000');

    // Delete order item
    const deleteItemRes = await fetch(
      `${baseUrl}/api/v1/admin/orders/${convertedOrderPublicId}/items/${addedOrderItemPublicId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const deleteItemData = await deleteItemRes.json();
    assert(deleteItemRes.status === 200, 'DELETE order item returns HTTP 200');
    assert(deleteItemData.data?.order?.total_amount === 65000, 'Order total reverted to 65000');

    console.log('\n--- 8. Authorization & Audit Logs ---');
    const nonAdminRes = await fetch(`${baseUrl}/api/v1/admin/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(nonAdminRes.status === 403, 'Non-admin rejected from orders API with HTTP 403');

    const orderAuditLogs = await AuditLog.query().where('entity_type', 'Order');
    assert(orderAuditLogs.length >= 5, 'Multiple order mutation audit logs recorded');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Step 13 test records ---');
    try {
      if (directOrderPublicId) {
        const o = await Order.query().where('public_id', directOrderPublicId).first();
        if (o) {
          await OrderItem.query().where('order_id', o.id).delete();
          await OrderStatusLog.query().where('order_id', o.id).delete();
          await Order.query().deleteById(o.id);
        }
      }
      if (convertedOrderPublicId) {
        const o = await Order.query().where('public_id', convertedOrderPublicId).first();
        if (o) {
          await OrderItem.query().where('order_id', o.id).delete();
          await OrderStatusLog.query().where('order_id', o.id).delete();
          await Order.query().deleteById(o.id);
        }
      }
      if (acceptedQuotation) {
        await QuotationItem.query().where('quotation_id', acceptedQuotation.id).delete();
        await Quotation.query().deleteById(acceptedQuotation.id);
      }
      if (draftQuotation) await Quotation.query().deleteById(draftQuotation.id);
      if (testProduct) await Product.query().deleteById(testProduct.id);
      if (testCategory) await Category.query().deleteById(testCategory.id);
      if (customerUser) await User.query().deleteById(customerUser.id);
      if (adminUser) await User.query().deleteById(adminUser.id);
      console.log('Step 13 test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
  }

  console.log('\n====================================================');
  console.log(`STEP 13 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStep13Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Step 13 test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runStep13Tests;
