const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const Quotation = require('../models/Quotation');
const QuotationItem = require('../models/QuotationItem');
const QuotationStatusLog = require('../models/QuotationStatusLog');
const Enquiry = require('../models/Enquiry');
const B2BAccount = require('../models/B2BAccount');
const Product = require('../models/Product');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const auditService = require('./audit.service');

const VALID_STATUS_TRANSITIONS = {
  draft: ['sent', 'cancelled'],
  sent: ['accepted', 'rejected', 'expired', 'cancelled'],
  accepted: ['cancelled'],
  rejected: ['draft'],
  expired: ['draft', 'cancelled'],
  cancelled: [],
};

/**
 * Rounds value safely to 2 decimal places.
 */
const roundCurrency = (val) => {
  const num = Number(val) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates item totals safely on server.
 */
const calculateItemAmounts = (item) => {
  const quantity = Math.max(0.01, roundCurrency(item.quantity || 1));
  const unitPrice = Math.max(0, roundCurrency(item.unit_price || 0));
  const customizationAmount = Math.max(0, roundCurrency(item.customization_amount || 0));
  const discountAmount = Math.max(0, roundCurrency(item.discount_amount || 0));

  const lineSubtotal = roundCurrency(quantity * unitPrice);
  const lineTotal = Math.max(0, roundCurrency(lineSubtotal + customizationAmount - discountAmount));

  return {
    quantity,
    unit_price: unitPrice,
    customization_amount: customizationAmount,
    discount_amount: discountAmount,
    line_total: lineTotal,
  };
};

/**
 * Recalculates quotation financial totals based on its items and header amounts.
 */
const calculateQuotationTotals = (items, headerAmounts = {}) => {
  let subtotal = 0;
  for (const item of items) {
    const lineTotal = Number(item.line_total) || 0;
    subtotal = roundCurrency(subtotal + lineTotal);
  }

  const customizationAmount = Math.max(0, roundCurrency(headerAmounts.customization_amount ?? 0));
  const transportAmount = Math.max(0, roundCurrency(headerAmounts.transport_amount ?? 0));
  const installationAmount = Math.max(0, roundCurrency(headerAmounts.installation_amount ?? 0));
  const discountAmount = Math.max(0, roundCurrency(headerAmounts.discount_amount ?? 0));
  const taxAmount = Math.max(0, roundCurrency(headerAmounts.tax_amount ?? 0));

  const totalAmount = Math.max(
    0,
    roundCurrency(
      subtotal + customizationAmount + transportAmount + installationAmount - discountAmount + taxAmount
    )
  );

  return {
    subtotal,
    customization_amount: customizationAmount,
    transport_amount: transportAmount,
    installation_amount: installationAmount,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
  };
};

/**
 * Generates collision-resistant unique quotation identifier.
 */
const generateQuotationNumber = async (trx = null) => {
  const year = new Date().getFullYear();
  const prefix = `SKF-QT-${year}-`;

  const lastRecord = await Quotation.query(trx)
    .where('quotation_number', 'like', `${prefix}%`)
    .orderBy('id', 'desc')
    .first();

  let nextSeq = 1;
  if (lastRecord && lastRecord.quotation_number) {
    const parts = lastRecord.quotation_number.split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsed)) {
      nextSeq = parsed + 1;
    }
  }

  let candidate = `${prefix}${String(nextSeq).padStart(6, '0')}`;
  let exists = await Quotation.query(trx).where('quotation_number', candidate).first();

  while (exists) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(6, '0')}`;
    exists = await Quotation.query(trx).where('quotation_number', candidate).first();
  }

  return candidate;
};

/**
 * Sanitizes quotation item for API response.
 */
const sanitizeQuotationItem = (item) => {
  if (!item) return null;
  return {
    public_id: item.public_id,
    description: item.description,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    customization_amount: Number(item.customization_amount),
    discount_amount: Number(item.discount_amount),
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

/**
 * Sanitizes status log for API response.
 */
const sanitizeStatusLog = (log) => {
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

/**
 * Sanitizes quotation for API response.
 */
const sanitizeQuotation = (quotation) => {
  if (!quotation) return null;

  return {
    public_id: quotation.public_id,
    quotation_number: quotation.quotation_number,
    customer_name: quotation.customer_name,
    customer_phone: quotation.customer_phone,
    customer_email: quotation.customer_email || null,
    subtotal: Number(quotation.subtotal),
    customization_amount: Number(quotation.customization_amount),
    transport_amount: Number(quotation.transport_amount),
    installation_amount: Number(quotation.installation_amount),
    discount_amount: Number(quotation.discount_amount),
    tax_amount: Number(quotation.tax_amount),
    total_amount: Number(quotation.total_amount),
    valid_until: quotation.valid_until || null,
    status: quotation.status,
    notes: quotation.notes || null,
    enquiry: quotation.enquiry
      ? {
          public_id: quotation.enquiry.public_id,
          customer_name: quotation.enquiry.customer_name,
          phone: quotation.enquiry.phone,
          email: quotation.enquiry.email,
          status: quotation.enquiry.status,
        }
      : null,
    b2b_account: quotation.b2bAccount
      ? {
          public_id: quotation.b2bAccount.public_id,
          company_name: quotation.b2bAccount.company_name,
          contact_name: quotation.b2bAccount.contact_name,
          email: quotation.b2bAccount.email,
          phone: quotation.b2bAccount.phone,
        }
      : null,
    created_by: quotation.createdBy
      ? {
          public_id: quotation.createdBy.public_id,
          name: quotation.createdBy.name,
          email: quotation.createdBy.email,
        }
      : null,
    items: Array.isArray(quotation.items) ? quotation.items.map(sanitizeQuotationItem) : [],
    status_logs: Array.isArray(quotation.statusLogs) ? quotation.statusLogs.map(sanitizeStatusLog) : [],
    created_at: quotation.created_at,
    updated_at: quotation.updated_at,
  };
};

/**
 * Lists quotations with pagination, filtering, searching, and sorting.
 */
const listQuotations = async (queryParams) => {
  const { page, limit, offset } = parsePagination(queryParams);
  const {
    search,
    status,
    customer,
    enquiry_public_id,
    b2b_account_public_id,
    from_date,
    to_date,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = queryParams;

  const query = Quotation.query()
    .withGraphFetched('[enquiry, b2bAccount, createdBy, items.[product]]')
    .orderBy(sort_by, sort_order.toLowerCase());

  if (status) {
    query.where('quotations.status', status);
  }

  if (search) {
    query.where((q) => {
      q.where('quotations.quotation_number', 'like', `%${search}%`)
        .orWhere('quotations.customer_name', 'like', `%${search}%`)
        .orWhere('quotations.customer_email', 'like', `%${search}%`)
        .orWhere('quotations.customer_phone', 'like', `%${search}%`);
    });
  }

  if (customer) {
    query.where((q) => {
      q.where('quotations.customer_name', 'like', `%${customer}%`)
        .orWhere('quotations.customer_email', 'like', `%${customer}%`)
        .orWhere('quotations.customer_phone', 'like', `%${customer}%`);
    });
  }

  if (enquiry_public_id) {
    const enq = await Enquiry.query().where('public_id', enquiry_public_id).first();
    if (enq) {
      query.where('quotations.enquiry_id', enq.id);
    } else {
      query.whereRaw('1 = 0');
    }
  }

  if (b2b_account_public_id) {
    const b2b = await B2BAccount.query().where('public_id', b2b_account_public_id).first();
    if (b2b) {
      query.where('quotations.b2b_account_id', b2b.id);
    } else {
      query.whereRaw('1 = 0');
    }
  }

  if (from_date) {
    query.where('quotations.created_at', '>=', `${from_date} 00:00:00`);
  }

  if (to_date) {
    query.where('quotations.created_at', '<=', `${to_date} 23:59:59`);
  }

  const totalQuery = query.clone().clearOrder().count('* as count').first();
  const [totalRes, items] = await Promise.all([totalQuery, query.offset(offset).limit(limit)]);

  const total = parseInt(totalRes?.count || 0, 10);
  const sanitizedItems = items.map(sanitizeQuotation);

  return formatPaginatedResponse({
    items: sanitizedItems,
    total,
    page,
    limit,
  });
};

/**
 * Retrieves quotation by public_id with all relations and history.
 */
const getQuotationByPublicId = async (publicId) => {
  const quotation = await Quotation.query()
    .where('public_id', publicId)
    .withGraphFetched('[enquiry, b2bAccount, createdBy, items.[product], statusLogs(orderByCreated).[changedBy]]')
    .first();

  if (!quotation) {
    throw ApiError.notFound('Quotation not found');
  }

  return sanitizeQuotation(quotation);
};

/**
 * Creates a quotation from enquiry, b2b account, or direct customer input.
 */
const createQuotation = async (data, req) => {
  let enquiryId = null;
  let b2bAccountId = null;
  let customerName = data.customer_name?.trim();
  let customerPhone = data.customer_phone?.trim();
  let customerEmail = data.customer_email?.trim() || null;

  if (data.enquiry_public_id) {
    const enquiry = await Enquiry.query().where('public_id', data.enquiry_public_id).first();
    if (!enquiry) {
      throw ApiError.badRequest('Referenced enquiry not found');
    }
    enquiryId = enquiry.id;
    if (!customerName) customerName = enquiry.customer_name;
    if (!customerPhone) customerPhone = enquiry.phone;
    if (!customerEmail) customerEmail = enquiry.email;
  }

  if (data.b2b_account_public_id) {
    const b2b = await B2BAccount.query().where('public_id', data.b2b_account_public_id).first();
    if (!b2b) {
      throw ApiError.badRequest('Referenced B2B account not found');
    }
    b2bAccountId = b2b.id;
    if (!customerName) customerName = b2b.contact_name || b2b.company_name;
    if (!customerPhone) customerPhone = b2b.phone;
    if (!customerEmail) customerEmail = b2b.email;
  }

  if (!customerName) {
    throw ApiError.badRequest('Customer name is required');
  }
  if (!customerPhone) {
    throw ApiError.badRequest('Customer phone is required');
  }

  // Resolve items and calculate line totals
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

    const calculated = calculateItemAmounts(item);
    resolvedItems.push({
      public_id: crypto.randomUUID(),
      product_id: productId,
      description: item.description.trim(),
      quantity: calculated.quantity,
      unit_price: calculated.unit_price,
      customization_amount: calculated.customization_amount,
      discount_amount: calculated.discount_amount,
      line_total: calculated.line_total,
      metadata: item.metadata || null,
    });
  }

  const totals = calculateQuotationTotals(resolvedItems, {
    customization_amount: data.customization_amount,
    transport_amount: data.transport_amount,
    installation_amount: data.installation_amount,
    discount_amount: data.discount_amount,
    tax_amount: data.tax_amount,
  });

  const result = await Quotation.transaction(async (trx) => {
    const quotationNumber = await generateQuotationNumber(trx);

    const quotation = await Quotation.query(trx).insert({
      public_id: crypto.randomUUID(),
      quotation_number: quotationNumber,
      enquiry_id: enquiryId,
      b2b_account_id: b2bAccountId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      subtotal: totals.subtotal,
      customization_amount: totals.customization_amount,
      transport_amount: totals.transport_amount,
      installation_amount: totals.installation_amount,
      discount_amount: totals.discount_amount,
      tax_amount: totals.tax_amount,
      total_amount: totals.total_amount,
      valid_until: data.valid_until || null,
      status: 'draft',
      notes: data.notes?.trim() || null,
      created_by: req?.user?.id || null,
    });

    for (const item of resolvedItems) {
      await QuotationItem.query(trx).insert({
        ...item,
        quotation_id: quotation.id,
      });
    }

    await QuotationStatusLog.query(trx).insert({
      public_id: crypto.randomUUID(),
      quotation_id: quotation.id,
      changed_by: req?.user?.id || null,
      from_status: null,
      to_status: 'draft',
      comment: 'Quotation created',
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'QUOTATION_CREATE',
        entityType: 'Quotation',
        entityId: quotation.id,
        newValues: {
          quotation_number: quotation.quotation_number,
          total_amount: totals.total_amount,
          status: 'draft',
          item_count: resolvedItems.length,
        },
      },
      trx
    );

    return quotation;
  });

  return getQuotationByPublicId(result.public_id);
};

/**
 * Updates quotation header details and recalculates totals.
 */
const updateQuotation = async (publicId, data, req) => {
  const quotation = await Quotation.query().where('public_id', publicId).first();
  if (!quotation) {
    throw ApiError.notFound('Quotation not found');
  }

  if (quotation.status === 'accepted' || quotation.status === 'cancelled') {
    throw ApiError.badRequest(`Cannot modify quotation with status '${quotation.status}'`);
  }

  const items = await QuotationItem.query().where('quotation_id', quotation.id);

  const headerAmounts = {
    customization_amount:
      data.customization_amount !== undefined ? data.customization_amount : quotation.customization_amount,
    transport_amount: data.transport_amount !== undefined ? data.transport_amount : quotation.transport_amount,
    installation_amount:
      data.installation_amount !== undefined ? data.installation_amount : quotation.installation_amount,
    discount_amount: data.discount_amount !== undefined ? data.discount_amount : quotation.discount_amount,
    tax_amount: data.tax_amount !== undefined ? data.tax_amount : quotation.tax_amount,
  };

  const totals = calculateQuotationTotals(items, headerAmounts);

  const patchData = {
    subtotal: totals.subtotal,
    customization_amount: totals.customization_amount,
    transport_amount: totals.transport_amount,
    installation_amount: totals.installation_amount,
    discount_amount: totals.discount_amount,
    tax_amount: totals.tax_amount,
    total_amount: totals.total_amount,
  };

  if (data.customer_name !== undefined) patchData.customer_name = data.customer_name.trim();
  if (data.customer_phone !== undefined) patchData.customer_phone = data.customer_phone.trim();
  if (data.customer_email !== undefined) patchData.customer_email = data.customer_email?.trim() || null;
  if (data.valid_until !== undefined) patchData.valid_until = data.valid_until || null;
  if (data.notes !== undefined) patchData.notes = data.notes?.trim() || null;

  await Quotation.transaction(async (trx) => {
    await Quotation.query(trx).where('id', quotation.id).patch(patchData);

    await auditService.logRequestAction(
      req,
      {
        action: 'QUOTATION_UPDATE',
        entityType: 'Quotation',
        entityId: quotation.id,
        oldValues: {
          customer_name: quotation.customer_name,
          total_amount: quotation.total_amount,
        },
        newValues: {
          customer_name: patchData.customer_name || quotation.customer_name,
          total_amount: totals.total_amount,
        },
      },
      trx
    );
  });

  return getQuotationByPublicId(publicId);
};

/**
 * Updates quotation status with lifecycle transition validation.
 */
const updateQuotationStatus = async (publicId, { status, comment }, req) => {
  const quotation = await Quotation.query().where('public_id', publicId).first();
  if (!quotation) {
    throw ApiError.notFound('Quotation not found');
  }

  const currentStatus = quotation.status;
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(status)) {
    throw ApiError.badRequest(
      `Invalid status transition from '${currentStatus}' to '${status}'. Allowed: ${allowedTransitions.join(', ') || 'none'}`
    );
  }

  await Quotation.transaction(async (trx) => {
    await Quotation.query(trx).where('id', quotation.id).patch({
      status,
    });

    await QuotationStatusLog.query(trx).insert({
      public_id: crypto.randomUUID(),
      quotation_id: quotation.id,
      changed_by: req?.user?.id || null,
      from_status: currentStatus,
      to_status: status,
      comment: comment?.trim() || null,
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'QUOTATION_STATUS_UPDATE',
        entityType: 'Quotation',
        entityId: quotation.id,
        oldValues: { status: currentStatus },
        newValues: { status, comment: comment || null },
      },
      trx
    );
  });

  return getQuotationByPublicId(publicId);
};

/**
 * Deletes quotation. Only draft quotations can be deleted.
 */
const deleteQuotation = async (publicId, req) => {
  const quotation = await Quotation.query().where('public_id', publicId).first();
  if (!quotation) {
    throw ApiError.notFound('Quotation not found');
  }

  if (quotation.status !== 'draft') {
    throw ApiError.badRequest(
      `Cannot delete quotation with status '${quotation.status}'. Only draft quotations can be deleted.`
    );
  }

  await Quotation.transaction(async (trx) => {
    await auditService.logRequestAction(
      req,
      {
        action: 'QUOTATION_DELETE',
        entityType: 'Quotation',
        entityId: quotation.id,
        oldValues: {
          quotation_number: quotation.quotation_number,
          total_amount: quotation.total_amount,
        },
      },
      trx
    );

    await QuotationItem.query(trx).where('quotation_id', quotation.id).delete();
    await QuotationStatusLog.query(trx).where('quotation_id', quotation.id).delete();
    await Quotation.query(trx).deleteById(quotation.id);
  });

  return { message: 'Quotation deleted successfully' };
};

/**
 * Adds an item to quotation and recalculates totals.
 */
const addQuotationItem = async (publicId, itemData, req) => {
  const quotation = await Quotation.query().where('public_id', publicId).first();
  if (!quotation) {
    throw ApiError.notFound('Quotation not found');
  }

  if (quotation.status === 'accepted' || quotation.status === 'cancelled') {
    throw ApiError.badRequest(`Cannot modify items of quotation with status '${quotation.status}'`);
  }

  let productId = null;
  if (itemData.product_public_id) {
    const product = await Product.query().where('public_id', itemData.product_public_id).first();
    if (!product) {
      throw ApiError.badRequest('Referenced product not found');
    }
    productId = product.id;
  }

  const calculated = calculateItemAmounts(itemData);

  await Quotation.transaction(async (trx) => {
    await QuotationItem.query(trx).insert({
      public_id: crypto.randomUUID(),
      quotation_id: quotation.id,
      product_id: productId,
      description: itemData.description.trim(),
      quantity: calculated.quantity,
      unit_price: calculated.unit_price,
      customization_amount: calculated.customization_amount,
      discount_amount: calculated.discount_amount,
      line_total: calculated.line_total,
      metadata: itemData.metadata || null,
    });

    const items = await QuotationItem.query(trx).where('quotation_id', quotation.id);
    const totals = calculateQuotationTotals(items, {
      customization_amount: quotation.customization_amount,
      transport_amount: quotation.transport_amount,
      installation_amount: quotation.installation_amount,
      discount_amount: quotation.discount_amount,
      tax_amount: quotation.tax_amount,
    });

    await Quotation.query(trx).where('id', quotation.id).patch({
      subtotal: totals.subtotal,
      total_amount: totals.total_amount,
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'QUOTATION_ITEM_ADD',
        entityType: 'Quotation',
        entityId: quotation.id,
        newValues: {
          description: itemData.description,
          line_total: calculated.line_total,
          new_total_amount: totals.total_amount,
        },
      },
      trx
    );
  });

  return getQuotationByPublicId(publicId);
};

/**
 * Updates a specific quotation item and recalculates totals.
 */
const updateQuotationItem = async (publicId, itemPublicId, itemData, req) => {
  const quotation = await Quotation.query().where('public_id', publicId).first();
  if (!quotation) {
    throw ApiError.notFound('Quotation not found');
  }

  if (quotation.status === 'accepted' || quotation.status === 'cancelled') {
    throw ApiError.badRequest(`Cannot modify items of quotation with status '${quotation.status}'`);
  }

  const item = await QuotationItem.query()
    .where('public_id', itemPublicId)
    .where('quotation_id', quotation.id)
    .first();

  if (!item) {
    throw ApiError.notFound('Quotation item not found on this quotation');
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

  const calculated = calculateItemAmounts({
    quantity: itemData.quantity !== undefined ? itemData.quantity : item.quantity,
    unit_price: itemData.unit_price !== undefined ? itemData.unit_price : item.unit_price,
    customization_amount:
      itemData.customization_amount !== undefined ? itemData.customization_amount : item.customization_amount,
    discount_amount: itemData.discount_amount !== undefined ? itemData.discount_amount : item.discount_amount,
  });

  await Quotation.transaction(async (trx) => {
    await QuotationItem.query(trx)
      .where('id', item.id)
      .patch({
        product_id: productId,
        description: itemData.description !== undefined ? itemData.description.trim() : item.description,
        quantity: calculated.quantity,
        unit_price: calculated.unit_price,
        customization_amount: calculated.customization_amount,
        discount_amount: calculated.discount_amount,
        line_total: calculated.line_total,
        metadata: itemData.metadata !== undefined ? itemData.metadata : item.metadata,
      });

    const items = await QuotationItem.query(trx).where('quotation_id', quotation.id);
    const totals = calculateQuotationTotals(items, {
      customization_amount: quotation.customization_amount,
      transport_amount: quotation.transport_amount,
      installation_amount: quotation.installation_amount,
      discount_amount: quotation.discount_amount,
      tax_amount: quotation.tax_amount,
    });

    await Quotation.query(trx).where('id', quotation.id).patch({
      subtotal: totals.subtotal,
      total_amount: totals.total_amount,
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'QUOTATION_ITEM_UPDATE',
        entityType: 'Quotation',
        entityId: quotation.id,
        newValues: {
          item_public_id: itemPublicId,
          line_total: calculated.line_total,
          new_total_amount: totals.total_amount,
        },
      },
      trx
    );
  });

  return getQuotationByPublicId(publicId);
};

/**
 * Removes an item from quotation and recalculates totals.
 */
const deleteQuotationItem = async (publicId, itemPublicId, req) => {
  const quotation = await Quotation.query().where('public_id', publicId).first();
  if (!quotation) {
    throw ApiError.notFound('Quotation not found');
  }

  if (quotation.status === 'accepted' || quotation.status === 'cancelled') {
    throw ApiError.badRequest(`Cannot modify items of quotation with status '${quotation.status}'`);
  }

  const item = await QuotationItem.query()
    .where('public_id', itemPublicId)
    .where('quotation_id', quotation.id)
    .first();

  if (!item) {
    throw ApiError.notFound('Quotation item not found on this quotation');
  }

  const existingItemsCount = await QuotationItem.query().where('quotation_id', quotation.id).resultSize();
  if (existingItemsCount <= 1) {
    throw ApiError.badRequest('Quotation must contain at least one item');
  }

  await Quotation.transaction(async (trx) => {
    await QuotationItem.query(trx).deleteById(item.id);

    const items = await QuotationItem.query(trx).where('quotation_id', quotation.id);
    const totals = calculateQuotationTotals(items, {
      customization_amount: quotation.customization_amount,
      transport_amount: quotation.transport_amount,
      installation_amount: quotation.installation_amount,
      discount_amount: quotation.discount_amount,
      tax_amount: quotation.tax_amount,
    });

    await Quotation.query(trx).where('id', quotation.id).patch({
      subtotal: totals.subtotal,
      total_amount: totals.total_amount,
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'QUOTATION_ITEM_DELETE',
        entityType: 'Quotation',
        entityId: quotation.id,
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

  return getQuotationByPublicId(publicId);
};

module.exports = {
  roundCurrency,
  calculateItemAmounts,
  calculateQuotationTotals,
  generateQuotationNumber,
  sanitizeQuotation,
  sanitizeQuotationItem,
  listQuotations,
  getQuotationByPublicId,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
  addQuotationItem,
  updateQuotationItem,
  deleteQuotationItem,
};
