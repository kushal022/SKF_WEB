const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const auditService = require('./audit.service');

const VALID_PAYMENT_TRANSITIONS = {
  pending: ['paid', 'failed'],
  paid: ['refunded', 'partially_refunded'],
  failed: ['pending'],
  refunded: [],
  partially_refunded: ['refunded'],
};

const roundCurrency = (val) => {
  const num = Number(val) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

const generatePaymentReference = async (trx = null) => {
  const year = new Date().getFullYear();
  const prefix = `SKF-PAY-${year}-`;

  const lastRecord = await Payment.query(trx)
    .where('payment_reference', 'like', `${prefix}%`)
    .orderBy('id', 'desc')
    .first();

  let nextSeq = 1;
  if (lastRecord && lastRecord.payment_reference) {
    const parts = lastRecord.payment_reference.split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsed)) {
      nextSeq = parsed + 1;
    }
  }

  let candidate = `${prefix}${String(nextSeq).padStart(6, '0')}`;
  let exists = await Payment.query(trx).where('payment_reference', candidate).first();

  while (exists) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(6, '0')}`;
    exists = await Payment.query(trx).where('payment_reference', candidate).first();
  }

  return candidate;
};

const sanitizePayment = (payment) => {
  if (!payment) return null;

  return {
    public_id: payment.public_id,
    payment_reference: payment.payment_reference,
    gateway: payment.gateway || null,
    gateway_order_id: payment.gateway_order_id || null,
    gateway_payment_id: payment.gateway_payment_id || null,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    paid_at: payment.paid_at || null,
    failure_reason: payment.failure_reason || null,
    metadata: payment.metadata || null,
    order: payment.order
      ? {
          public_id: payment.order.public_id,
          order_number: payment.order.order_number,
          customer_name: payment.order.customer_name,
          customer_phone: payment.order.customer_phone,
          customer_email: payment.order.customer_email || null,
          total_amount: Number(payment.order.total_amount),
          status: payment.order.status,
        }
      : null,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
  };
};

const listPayments = async (queryParams) => {
  const { page, limit, offset } = parsePagination(queryParams);
  const {
    status,
    gateway,
    order_public_id,
    from_date,
    to_date,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = queryParams;

  const query = Payment.query()
    .withGraphFetched('order')
    .orderBy(sort_by, sort_order.toLowerCase());

  if (status) {
    query.where('payments.status', status);
  }

  if (gateway) {
    query.where('payments.gateway', gateway);
  }

  if (order_public_id) {
    const order = await Order.query().where('public_id', order_public_id).first();
    if (order) {
      query.where('payments.order_id', order.id);
    } else {
      query.whereRaw('1 = 0');
    }
  }

  if (from_date) {
    query.where('payments.created_at', '>=', `${from_date} 00:00:00`);
  }

  if (to_date) {
    query.where('payments.created_at', '<=', `${to_date} 23:59:59`);
  }

  const totalQuery = query.clone().clearOrder().count('* as count').first();
  const [totalRes, items] = await Promise.all([totalQuery, query.offset(offset).limit(limit)]);

  const total = parseInt(totalRes?.count || 0, 10);
  const sanitizedItems = items.map(sanitizePayment);

  return formatPaginatedResponse({
    items: sanitizedItems,
    total,
    page,
    limit,
  });
};

const getPaymentByPublicId = async (publicId) => {
  const payment = await Payment.query()
    .where('public_id', publicId)
    .withGraphFetched('order')
    .first();

  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  return sanitizePayment(payment);
};

const createPayment = async (data, req) => {
  const order = await Order.query().where('public_id', data.order_public_id).first();
  if (!order) {
    throw ApiError.notFound('Referenced order not found');
  }

  if (order.status === 'cancelled') {
    throw ApiError.badRequest('Cannot record payment for a cancelled order');
  }

  const amount = roundCurrency(data.amount);
  if (amount <= 0) {
    throw ApiError.badRequest('Payment amount must be greater than 0');
  }

  const status = data.status || 'pending';
  const paidAt = status === 'paid' ? new Date() : null;

  const result = await Payment.transaction(async (trx) => {
    let paymentReference = data.payment_reference?.trim();
    if (!paymentReference) {
      paymentReference = await generatePaymentReference(trx);
    } else {
      const existing = await Payment.query(trx).where('payment_reference', paymentReference).first();
      if (existing) {
        throw ApiError.conflict('Payment reference already exists');
      }
    }

    const payment = await Payment.query(trx).insert({
      public_id: crypto.randomUUID(),
      order_id: order.id,
      payment_reference: paymentReference,
      gateway: data.gateway?.trim() || null,
      gateway_order_id: data.gateway_order_id?.trim() || null,
      gateway_payment_id: data.gateway_payment_id?.trim() || null,
      amount,
      currency: data.currency?.trim() || 'INR',
      status,
      paid_at: paidAt,
      failure_reason: data.failure_reason?.trim() || null,
      metadata: data.metadata || null,
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'PAYMENT_CREATE',
        entityType: 'Payment',
        entityId: payment.id,
        newValues: {
          payment_reference: payment.payment_reference,
          order_id: order.id,
          amount,
          status,
        },
      },
      trx
    );

    return payment;
  });

  return getPaymentByPublicId(result.public_id);
};

const updatePaymentStatus = async (publicId, { status, failure_reason, gateway_payment_id, metadata }, req) => {
  const payment = await Payment.query().where('public_id', publicId).first();
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  const currentStatus = payment.status;
  const allowedTransitions = VALID_PAYMENT_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(status)) {
    throw ApiError.badRequest(
      `Invalid payment status transition from '${currentStatus}' to '${status}'. Allowed: ${allowedTransitions.join(', ') || 'none'}`
    );
  }

  const patchData = {
    status,
  };

  if (status === 'paid' && !payment.paid_at) {
    patchData.paid_at = new Date();
  }

  if (failure_reason !== undefined) {
    patchData.failure_reason = failure_reason?.trim() || null;
  }

  if (gateway_payment_id !== undefined) {
    patchData.gateway_payment_id = gateway_payment_id?.trim() || null;
  }

  if (metadata !== undefined) {
    patchData.metadata = { ...(payment.metadata || {}), ...metadata };
  }

  await Payment.transaction(async (trx) => {
    await Payment.query(trx).where('id', payment.id).patch(patchData);

    await auditService.logRequestAction(
      req,
      {
        action: 'PAYMENT_STATUS_UPDATE',
        entityType: 'Payment',
        entityId: payment.id,
        oldValues: { status: currentStatus },
        newValues: { status, failure_reason: patchData.failure_reason || null },
      },
      trx
    );
  });

  return getPaymentByPublicId(publicId);
};

const updatePayment = async (publicId, data, req) => {
  const payment = await Payment.query().where('public_id', publicId).first();
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  const patchData = {};
  if (data.gateway !== undefined) patchData.gateway = data.gateway?.trim() || null;
  if (data.gateway_order_id !== undefined) patchData.gateway_order_id = data.gateway_order_id?.trim() || null;
  if (data.gateway_payment_id !== undefined) patchData.gateway_payment_id = data.gateway_payment_id?.trim() || null;
  if (data.failure_reason !== undefined) patchData.failure_reason = data.failure_reason?.trim() || null;
  if (data.metadata !== undefined) patchData.metadata = data.metadata;

  await Payment.transaction(async (trx) => {
    await Payment.query(trx).where('id', payment.id).patch(patchData);

    await auditService.logRequestAction(
      req,
      {
        action: 'PAYMENT_UPDATE',
        entityType: 'Payment',
        entityId: payment.id,
        newValues: patchData,
      },
      trx
    );
  });

  return getPaymentByPublicId(publicId);
};

module.exports = {
  roundCurrency,
  generatePaymentReference,
  sanitizePayment,
  listPayments,
  getPaymentByPublicId,
  createPayment,
  updatePaymentStatus,
  updatePayment,
};
