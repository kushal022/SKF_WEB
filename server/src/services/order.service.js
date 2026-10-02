const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderStatusLog = require('../models/OrderStatusLog');
const Quotation = require('../models/Quotation');
const QuotationItem = require('../models/QuotationItem');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const auditService = require('./audit.service');

const VALID_ORDER_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['manufacturing', 'cancelled'],
  manufacturing: ['ready', 'cancelled'],
  ready: ['dispatched', 'cancelled'],
  dispatched: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const roundCurrency = (val) => {
  const num = Number(val) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

const calculateOrderItemAmounts = (item) => {
  const quantity = Math.max(0.01, roundCurrency(item.quantity || 1));
  const unitPrice = Math.max(0, roundCurrency(item.unit_price || 0));
  const lineTotal = roundCurrency(quantity * unitPrice);

  return {
    quantity,
    unit_price: unitPrice,
    line_total: lineTotal,
  };
};

const calculateOrderTotals = (items, headerAmounts = {}) => {
  let subtotal = 0;
  for (const item of items) {
    const lineTotal = Number(item.line_total) || 0;
    subtotal = roundCurrency(subtotal + lineTotal);
  }

  const discountAmount = Math.max(0, roundCurrency(headerAmounts.discount_amount ?? 0));
  const taxAmount = Math.max(0, roundCurrency(headerAmounts.tax_amount ?? 0));
  const shippingAmount = Math.max(0, roundCurrency(headerAmounts.shipping_amount ?? 0));
  const installationAmount = Math.max(0, roundCurrency(headerAmounts.installation_amount ?? 0));

  const totalAmount = Math.max(
    0,
    roundCurrency(subtotal - discountAmount + taxAmount + shippingAmount + installationAmount)
  );

  return {
    subtotal,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    shipping_amount: shippingAmount,
    installation_amount: installationAmount,
    total_amount: totalAmount,
  };
};

const generateOrderNumber = async (trx = null) => {
  const year = new Date().getFullYear();
  const prefix = `SKF-ORD-${year}-`;

  const lastRecord = await Order.query(trx)
    .where('order_number', 'like', `${prefix}%`)
    .orderBy('id', 'desc')
    .first();

  let nextSeq = 1;
  if (lastRecord && lastRecord.order_number) {
    const parts = lastRecord.order_number.split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsed)) {
      nextSeq = parsed + 1;
    }
  }

  let candidate = `${prefix}${String(nextSeq).padStart(6, '0')}`;
  let exists = await Order.query(trx).where('order_number', candidate).first();

  while (exists) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(6, '0')}`;
    exists = await Order.query(trx).where('order_number', candidate).first();
  }

  return candidate;
};

const sanitizeOrderItem = (item) => {
  if (!item) return null;
  return {
    public_id: item.public_id,
    description: item.description,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    line_total: Number(item.line_total),
    metadata: item.metadata || null,
    product: item.product
      ? {
          public_id: item.product.public_id,
          name: item.product.name,
          slug: item.product.slug,
          product_code: item.product.product_code,
        }
      : null,
    created_at: item.created_at,
  };
};

const sanitizeOrderStatusLog = (log) => {
  if (!log) return null;
  return {
    public_id: log.public_id,
    from_status: log.from_status,
    to_status: log.to_status,
    comment: log.comment,
    changed_by: log.changedBy
      ? {
          public_id: log.changedBy.public_id,
          name: log.changedBy.name,
          email: log.changedBy.email,
        }
      : null,
    created_at: log.created_at,
  };
};

const sanitizeOrder = (order) => {
  if (!order) return null;

  // Calculate payment summary if payments are available
  let totalPaid = 0;
  const paymentList = [];
  if (Array.isArray(order.payments)) {
    for (const p of order.payments) {
      if (p.status === 'paid') {
        totalPaid = roundCurrency(totalPaid + Number(p.amount));
      }
      paymentList.push({
        public_id: p.public_id,
        payment_reference: p.payment_reference,
        amount: Number(p.amount),
        currency: p.currency,
        gateway: p.gateway || null,
        status: p.status,
        paid_at: p.paid_at || null,
        created_at: p.created_at,
      });
    }
  }

  const orderTotal = Number(order.total_amount);
  const pendingAmount = Math.max(0, roundCurrency(orderTotal - totalPaid));

  return {
    public_id: order.public_id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_email: order.customer_email || null,
    subtotal: Number(order.subtotal),
    discount_amount: Number(order.discount_amount),
    tax_amount: Number(order.tax_amount),
    shipping_amount: Number(order.shipping_amount),
    installation_amount: Number(order.installation_amount),
    total_amount: orderTotal,
    status: order.status,
    notes: order.notes || null,
    quotation: order.quotation
      ? {
          public_id: order.quotation.public_id,
          quotation_number: order.quotation.quotation_number,
          status: order.quotation.status,
          total_amount: Number(order.quotation.total_amount),
        }
      : null,
    items: Array.isArray(order.items) ? order.items.map(sanitizeOrderItem) : [],
    status_logs: Array.isArray(order.statusLogs) ? order.statusLogs.map(sanitizeOrderStatusLog) : [],
    payment_summary: {
      total_amount: orderTotal,
      total_paid: totalPaid,
      pending_amount: pendingAmount,
      payments: paymentList,
    },
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
};

const listOrders = async (queryParams) => {
  const { page, limit, offset } = parsePagination(queryParams);
  const {
    search,
    status,
    customer,
    quotation_public_id,
    from_date,
    to_date,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = queryParams;

  const query = Order.query()
    .withGraphFetched('[quotation, items.[product], payments]')
    .orderBy(sort_by, sort_order.toLowerCase());

  if (status) {
    query.where('orders.status', status);
  }

  if (search) {
    query.where((q) => {
      q.where('orders.order_number', 'like', `%${search}%`)
        .orWhere('orders.customer_name', 'like', `%${search}%`)
        .orWhere('orders.customer_email', 'like', `%${search}%`)
        .orWhere('orders.customer_phone', 'like', `%${search}%`);
    });
  }

  if (customer) {
    query.where((q) => {
      q.where('orders.customer_name', 'like', `%${customer}%`)
        .orWhere('orders.customer_email', 'like', `%${customer}%`)
        .orWhere('orders.customer_phone', 'like', `%${customer}%`);
    });
  }

  if (quotation_public_id) {
    const quot = await Quotation.query().where('public_id', quotation_public_id).first();
    if (quot) {
      query.where('orders.quotation_id', quot.id);
    } else {
      query.whereRaw('1 = 0');
    }
  }

  if (from_date) {
    query.where('orders.created_at', '>=', `${from_date} 00:00:00`);
  }

  if (to_date) {
    query.where('orders.created_at', '<=', `${to_date} 23:59:59`);
  }

  const totalQuery = query.clone().clearOrder().count('* as count').first();
  const [totalRes, items] = await Promise.all([totalQuery, query.offset(offset).limit(limit)]);

  const total = parseInt(totalRes?.count || 0, 10);
  const sanitizedItems = items.map(sanitizeOrder);

  return formatPaginatedResponse({
    items: sanitizedItems,
    total,
    page,
    limit,
  });
};

const getOrderByPublicId = async (publicId) => {
  const order = await Order.query()
    .where('public_id', publicId)
    .withGraphFetched('[quotation, items.[product], payments, statusLogs(orderByCreated).[changedBy]]')
    .first();

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  return sanitizeOrder(order);
};

const createOrder = async (data, req) => {
  // Option A: Convert from accepted quotation
  if (data.quotation_public_id) {
    const quotation = await Quotation.query()
      .where('public_id', data.quotation_public_id)
      .withGraphFetched('items')
      .first();

    if (!quotation) {
      throw ApiError.notFound('Referenced quotation not found');
    }

    if (quotation.status !== 'accepted') {
      throw ApiError.badRequest(
        `Only accepted quotations can be converted to orders. Current status: '${quotation.status}'`
      );
    }

    // Duplicate conversion check
    const existingOrder = await Order.query().where('quotation_id', quotation.id).first();
    if (existingOrder) {
      throw ApiError.conflict('An order has already been created from this quotation');
    }

    const quotationItems = quotation.items || [];
    if (quotationItems.length === 0) {
      throw ApiError.badRequest('Cannot create order from quotation with no items');
    }

    const result = await Order.transaction(async (trx) => {
      const orderNumber = await generateOrderNumber(trx);

      let initialSubtotal = 0;
      for (const item of quotationItems) {
        initialSubtotal = roundCurrency(initialSubtotal + Number(item.line_total));
      }

      const order = await Order.query(trx).insert({
        public_id: crypto.randomUUID(),
        order_number: orderNumber,
        quotation_id: quotation.id,
        customer_name: quotation.customer_name,
        customer_phone: quotation.customer_phone,
        customer_email: quotation.customer_email || null,
        subtotal: initialSubtotal,
        discount_amount: quotation.discount_amount,
        tax_amount: quotation.tax_amount,
        shipping_amount: quotation.transport_amount,
        installation_amount: quotation.installation_amount,
        total_amount: quotation.total_amount,
        status: 'pending',
        notes: quotation.notes || null,
      });

      for (const item of quotationItems) {
        await OrderItem.query(trx).insert({
          public_id: crypto.randomUUID(),
          order_id: order.id,
          product_id: item.product_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          metadata: {
            ...item.metadata,
            customization_amount: item.customization_amount,
            discount_amount: item.discount_amount,
          },
        });
      }

      await OrderStatusLog.query(trx).insert({
        public_id: crypto.randomUUID(),
        order_id: order.id,
        changed_by: req?.user?.id || null,
        from_status: null,
        to_status: 'pending',
        comment: `Order converted from quotation ${quotation.quotation_number}`,
      });

      await auditService.logRequestAction(
        req,
        {
          action: 'ORDER_CONVERT_QUOTATION',
          entityType: 'Order',
          entityId: order.id,
          newValues: {
            order_number: order.order_number,
            quotation_number: quotation.quotation_number,
            total_amount: order.total_amount,
            status: 'pending',
          },
        },
        trx
      );

      return order;
    });

    return getOrderByPublicId(result.public_id);
  }

  // Option B: Direct order creation
  if (!data.customer_name || !data.customer_phone || !data.items || data.items.length === 0) {
    throw ApiError.badRequest('Direct order creation requires customer_name, customer_phone, and at least one item');
  }

  const resolvedItems = [];
  for (const item of data.items) {
    let productId = null;
    if (item.product_public_id) {
      const product = await Product.query().where('public_id', item.product_public_id).first();
      if (!product) {
        throw ApiError.badRequest(`Product with ID ${item.product_public_id} not found`);
      }
      productId = product.id;
    }

    const calculated = calculateOrderItemAmounts(item);
    resolvedItems.push({
      public_id: crypto.randomUUID(),
      product_id: productId,
      description: item.description.trim(),
      quantity: calculated.quantity,
      unit_price: calculated.unit_price,
      line_total: calculated.line_total,
      metadata: item.metadata || null,
    });
  }

  const totals = calculateOrderTotals(resolvedItems, {
    discount_amount: data.discount_amount,
    tax_amount: data.tax_amount,
    shipping_amount: data.shipping_amount,
    installation_amount: data.installation_amount,
  });

  const result = await Order.transaction(async (trx) => {
    const orderNumber = await generateOrderNumber(trx);

    const order = await Order.query(trx).insert({
      public_id: crypto.randomUUID(),
      order_number: orderNumber,
      quotation_id: null,
      customer_name: data.customer_name.trim(),
      customer_phone: data.customer_phone.trim(),
      customer_email: data.customer_email?.trim() || null,
      subtotal: totals.subtotal,
      discount_amount: totals.discount_amount,
      tax_amount: totals.tax_amount,
      shipping_amount: totals.shipping_amount,
      installation_amount: totals.installation_amount,
      total_amount: totals.total_amount,
      status: 'pending',
      notes: data.notes?.trim() || null,
    });

    for (const item of resolvedItems) {
      await OrderItem.query(trx).insert({
        ...item,
        order_id: order.id,
      });
    }

    await OrderStatusLog.query(trx).insert({
      public_id: crypto.randomUUID(),
      order_id: order.id,
      changed_by: req?.user?.id || null,
      from_status: null,
      to_status: 'pending',
      comment: 'Direct order created',
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'ORDER_CREATE',
        entityType: 'Order',
        entityId: order.id,
        newValues: {
          order_number: order.order_number,
          total_amount: totals.total_amount,
          status: 'pending',
          item_count: resolvedItems.length,
        },
      },
      trx
    );

    return order;
  });

  return getOrderByPublicId(result.public_id);
};

const updateOrder = async (publicId, data, req) => {
  const order = await Order.query().where('public_id', publicId).first();
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    throw ApiError.badRequest(`Cannot modify order with status '${order.status}'`);
  }

  const items = await OrderItem.query().where('order_id', order.id);

  const headerAmounts = {
    discount_amount: data.discount_amount !== undefined ? data.discount_amount : order.discount_amount,
    tax_amount: data.tax_amount !== undefined ? data.tax_amount : order.tax_amount,
    shipping_amount: data.shipping_amount !== undefined ? data.shipping_amount : order.shipping_amount,
    installation_amount:
      data.installation_amount !== undefined ? data.installation_amount : order.installation_amount,
  };

  const totals = calculateOrderTotals(items, headerAmounts);

  const patchData = {
    subtotal: totals.subtotal,
    discount_amount: totals.discount_amount,
    tax_amount: totals.tax_amount,
    shipping_amount: totals.shipping_amount,
    installation_amount: totals.installation_amount,
    total_amount: totals.total_amount,
  };

  if (data.customer_name !== undefined) patchData.customer_name = data.customer_name.trim();
  if (data.customer_phone !== undefined) patchData.customer_phone = data.customer_phone.trim();
  if (data.customer_email !== undefined) patchData.customer_email = data.customer_email?.trim() || null;
  if (data.notes !== undefined) patchData.notes = data.notes?.trim() || null;

  await Order.transaction(async (trx) => {
    await Order.query(trx).where('id', order.id).patch(patchData);

    await auditService.logRequestAction(
      req,
      {
        action: 'ORDER_UPDATE',
        entityType: 'Order',
        entityId: order.id,
        oldValues: {
          customer_name: order.customer_name,
          total_amount: order.total_amount,
        },
        newValues: {
          customer_name: patchData.customer_name || order.customer_name,
          total_amount: totals.total_amount,
        },
      },
      trx
    );
  });

  return getOrderByPublicId(publicId);
};

const updateOrderStatus = async (publicId, { status, comment }, req) => {
  const order = await Order.query().where('public_id', publicId).first();
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  const currentStatus = order.status;
  const allowedTransitions = VALID_ORDER_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(status)) {
    throw ApiError.badRequest(
      `Invalid status transition from '${currentStatus}' to '${status}'. Allowed: ${allowedTransitions.join(', ') || 'none'}`
    );
  }

  await Order.transaction(async (trx) => {
    await Order.query(trx).where('id', order.id).patch({
      status,
    });

    await OrderStatusLog.query(trx).insert({
      public_id: crypto.randomUUID(),
      order_id: order.id,
      changed_by: req?.user?.id || null,
      from_status: currentStatus,
      to_status: status,
      comment: comment?.trim() || null,
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'ORDER_STATUS_UPDATE',
        entityType: 'Order',
        entityId: order.id,
        oldValues: { status: currentStatus },
        newValues: { status, comment: comment || null },
      },
      trx
    );
  });

  return getOrderByPublicId(publicId);
};

const addOrderItem = async (publicId, itemData, req) => {
  const order = await Order.query().where('public_id', publicId).first();
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    throw ApiError.badRequest(`Cannot modify items of order with status '${order.status}'`);
  }

  let productId = null;
  if (itemData.product_public_id) {
    const product = await Product.query().where('public_id', itemData.product_public_id).first();
    if (!product) {
      throw ApiError.badRequest('Referenced product not found');
    }
    productId = product.id;
  }

  const calculated = calculateOrderItemAmounts(itemData);

  await Order.transaction(async (trx) => {
    await OrderItem.query(trx).insert({
      public_id: crypto.randomUUID(),
      order_id: order.id,
      product_id: productId,
      description: itemData.description.trim(),
      quantity: calculated.quantity,
      unit_price: calculated.unit_price,
      line_total: calculated.line_total,
      metadata: itemData.metadata || null,
    });

    const items = await OrderItem.query(trx).where('order_id', order.id);
    const totals = calculateOrderTotals(items, {
      discount_amount: order.discount_amount,
      tax_amount: order.tax_amount,
      shipping_amount: order.shipping_amount,
      installation_amount: order.installation_amount,
    });

    await Order.query(trx).where('id', order.id).patch({
      subtotal: totals.subtotal,
      total_amount: totals.total_amount,
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'ORDER_ITEM_ADD',
        entityType: 'Order',
        entityId: order.id,
        newValues: {
          description: itemData.description,
          line_total: calculated.line_total,
          new_total_amount: totals.total_amount,
        },
      },
      trx
    );
  });

  return getOrderByPublicId(publicId);
};

const updateOrderItem = async (publicId, itemPublicId, itemData, req) => {
  const order = await Order.query().where('public_id', publicId).first();
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    throw ApiError.badRequest(`Cannot modify items of order with status '${order.status}'`);
  }

  const item = await OrderItem.query()
    .where('public_id', itemPublicId)
    .where('order_id', order.id)
    .first();

  if (!item) {
    throw ApiError.notFound('Order item not found on this order');
  }

  let productId = item.product_id;
  if (itemData.product_public_id !== undefined) {
    if (itemData.product_public_id === null) {
      productId = null;
    } else {
      const prod = await Product.query().where('public_id', itemData.product_public_id).first();
      if (!prod) throw ApiError.badRequest('Referenced product not found');
      productId = prod.id;
    }
  }

  const calculated = calculateOrderItemAmounts({
    quantity: itemData.quantity !== undefined ? itemData.quantity : item.quantity,
    unit_price: itemData.unit_price !== undefined ? itemData.unit_price : item.unit_price,
  });

  await Order.transaction(async (trx) => {
    await OrderItem.query(trx)
      .where('id', item.id)
      .patch({
        product_id: productId,
        description: itemData.description !== undefined ? itemData.description.trim() : item.description,
        quantity: calculated.quantity,
        unit_price: calculated.unit_price,
        line_total: calculated.line_total,
        metadata: itemData.metadata !== undefined ? itemData.metadata : item.metadata,
      });

    const items = await OrderItem.query(trx).where('order_id', order.id);
    const totals = calculateOrderTotals(items, {
      discount_amount: order.discount_amount,
      tax_amount: order.tax_amount,
      shipping_amount: order.shipping_amount,
      installation_amount: order.installation_amount,
    });

    await Order.query(trx).where('id', order.id).patch({
      subtotal: totals.subtotal,
      total_amount: totals.total_amount,
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'ORDER_ITEM_UPDATE',
        entityType: 'Order',
        entityId: order.id,
        newValues: {
          item_public_id: itemPublicId,
          line_total: calculated.line_total,
          new_total_amount: totals.total_amount,
        },
      },
      trx
    );
  });

  return getOrderByPublicId(publicId);
};

const deleteOrderItem = async (publicId, itemPublicId, req) => {
  const order = await Order.query().where('public_id', publicId).first();
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    throw ApiError.badRequest(`Cannot modify items of order with status '${order.status}'`);
  }

  const item = await OrderItem.query()
    .where('public_id', itemPublicId)
    .where('order_id', order.id)
    .first();

  if (!item) {
    throw ApiError.notFound('Order item not found on this order');
  }

  const existingItemsCount = await OrderItem.query().where('order_id', order.id).resultSize();
  if (existingItemsCount <= 1) {
    throw ApiError.badRequest('Order must contain at least one item');
  }

  await Order.transaction(async (trx) => {
    await OrderItem.query(trx).deleteById(item.id);

    const items = await OrderItem.query(trx).where('order_id', order.id);
    const totals = calculateOrderTotals(items, {
      discount_amount: order.discount_amount,
      tax_amount: order.tax_amount,
      shipping_amount: order.shipping_amount,
      installation_amount: order.installation_amount,
    });

    await Order.query(trx).where('id', order.id).patch({
      subtotal: totals.subtotal,
      total_amount: totals.total_amount,
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'ORDER_ITEM_DELETE',
        entityType: 'Order',
        entityId: order.id,
        oldValues: {
          item_public_id: itemPublicId,
          description: item.description,
          line_total: item.line_total,
        },
        newValues: {
          new_total_amount: totals.total_amount,
        },
      },
      trx
    );
  });

  return getOrderByPublicId(publicId);
};

module.exports = {
  roundCurrency,
  calculateOrderItemAmounts,
  calculateOrderTotals,
  generateOrderNumber,
  sanitizeOrder,
  sanitizeOrderItem,
  sanitizeOrderStatusLog,
  listOrders,
  getOrderByPublicId,
  createOrder,
  updateOrder,
  updateOrderStatus,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
};
