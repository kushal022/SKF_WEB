const ApiError = require('../utils/ApiError');
const B2BAccount = require('../models/B2BAccount');
const B2BDocument = require('../models/B2BDocument');
const B2BPricingRule = require('../models/B2BPricingRule');
const Product = require('../models/Product');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const auditService = require('./audit.service');

const VALID_B2B_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];
const VALID_DOC_STATUSES = ['pending', 'approved', 'rejected'];

const sanitizeB2BDocument = (doc) => {
  if (!doc) return null;
  return {
    public_id: doc.public_id,
    document_type: doc.document_type,
    document_url: doc.document_url,
    cloudinary_public_id: doc.cloudinary_public_id || null,
    verification_status: doc.verification_status,
    rejection_reason: doc.rejection_reason || null,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
};

const sanitizeB2BPricingRule = (rule) => {
  if (!rule) return null;
  return {
    public_id: rule.public_id,
    discount_tier: rule.discount_tier,
    discount_type: rule.discount_type,
    discount_value: Number(rule.discount_value),
    min_quantity: rule.min_quantity,
    is_active: Boolean(rule.is_active),
    product: rule.product
      ? {
          public_id: rule.product.public_id,
          name: rule.product.name,
          slug: rule.product.slug,
        }
      : null,
    created_at: rule.created_at,
    updated_at: rule.updated_at,
  };
};

const sanitizeB2BAccount = (account, isAdmin = false) => {
  if (!account) return null;

  const base = {
    public_id: account.public_id,
    company_name: account.company_name,
    contact_name: account.contact_name,
    email: account.email || null,
    phone: account.phone,
    business_type: account.business_type || null,
    gst_number: account.gst_number || null,
    address: account.address || null,
    verification_status: account.verification_status,
    discount_tier: account.discount_tier || null,
    notes: account.notes || null,
    created_at: account.created_at,
    updated_at: account.updated_at,
  };

  if (isAdmin) {
    if (Array.isArray(account.documents)) {
      base.documents = account.documents.map(sanitizeB2BDocument);
    }
    if (Array.isArray(account.pricingRules)) {
      base.pricing_rules = account.pricingRules.map(sanitizeB2BPricingRule);
    }
  }

  return base;
};

/**
 * Public B2B Application
 */
const applyPublicB2B = async (data) => {
  const newAccount = await B2BAccount.query().insertAndFetch({
    company_name: data.company_name,
    contact_name: data.contact_name,
    email: data.email || null,
    phone: data.phone,
    business_type: data.business_type || null,
    gst_number: data.gst_number || null,
    address: data.address || null,
    notes: data.notes || null,
    verification_status: 'pending',
  });

  return {
    public_id: newAccount.public_id,
    company_name: newAccount.company_name,
    contact_name: newAccount.contact_name,
    phone: newAccount.phone,
    verification_status: newAccount.verification_status,
    created_at: newAccount.created_at,
  };
};

/**
 * Admin B2B Accounts Listing
 */
const getAdminB2BAccounts = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = B2BAccount.query().withGraphFetched('[documents]');

  if (query.verification_status) {
    builder = builder.where('verification_status', query.verification_status);
  }

  if (query.business_type) {
    builder = builder.where('business_type', query.business_type);
  }

  if (query.discount_tier) {
    builder = builder.where('discount_tier', query.discount_tier);
  }

  if (query.search) {
    const term = `%${query.search.trim()}%`;
    builder = builder.where((b) => {
      b.where('company_name', 'like', term)
        .orWhere('contact_name', 'like', term)
        .orWhere('email', 'like', term)
        .orWhere('phone', 'like', term)
        .orWhere('gst_number', 'like', term);
    });
  }

  const sortParam = query.sort || '-created_at';
  const isDesc = sortParam.startsWith('-');
  const sortField = isDesc ? sortParam.slice(1) : sortParam;
  const allowedSorts = ['created_at', 'updated_at', 'company_name', 'verification_status'];
  const finalSortField = allowedSorts.includes(sortField) ? sortField : 'created_at';

  builder = builder.orderBy(finalSortField, isDesc ? 'desc' : 'asc');

  const [totalRes, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map((a) => sanitizeB2BAccount(a, false)),
    total: totalRes,
    page,
    limit,
  });
};

/**
 * Admin B2B Account Detail
 */
const getAdminB2BAccountByPublicId = async (publicId) => {
  const account = await B2BAccount.query()
    .where({ public_id: publicId })
    .withGraphFetched('[documents, pricingRules.product]')
    .modifyGraph('documents', (b) => b.orderBy('created_at', 'desc'))
    .first();

  if (!account) {
    throw new ApiError(404, 'B2B account not found', 'B2B_ACCOUNT_NOT_FOUND');
  }

  return sanitizeB2BAccount(account, true);
};

/**
 * Admin Update B2B Account
 */
const updateAdminB2BAccount = async (publicId, data, req) => {
  const account = await B2BAccount.query().where({ public_id: publicId }).first();
  if (!account) {
    throw new ApiError(404, 'B2B account not found', 'B2B_ACCOUNT_NOT_FOUND');
  }

  const oldValues = sanitizeB2BAccount(account, false);
  const updated = await B2BAccount.query().patchAndFetchById(account.id, data);

  await auditService.logRequestAction(req, {
    action: 'UPDATE_B2B_ACCOUNT',
    entityType: 'B2BAccount',
    entityId: account.id,
    oldValues,
    newValues: sanitizeB2BAccount(updated, false),
  });

  return sanitizeB2BAccount(updated, false);
};

/**
 * Admin B2B Account Verification Status
 */
const updateB2BAccountStatus = async (publicId, { status }, req) => {
  if (!VALID_B2B_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid verification status', 'INVALID_STATUS');
  }

  return B2BAccount.transaction(async (trx) => {
    const account = await B2BAccount.query(trx).where({ public_id: publicId }).first();
    if (!account) {
      throw new ApiError(404, 'B2B account not found', 'B2B_ACCOUNT_NOT_FOUND');
    }

    const fromStatus = account.verification_status;
    const updated = await B2BAccount.query(trx).patchAndFetchById(account.id, {
      verification_status: status,
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'UPDATE_B2B_STATUS',
        entityType: 'B2BAccount',
        entityId: account.id,
        oldValues: { verification_status: fromStatus },
        newValues: { verification_status: status },
      },
      trx
    );

    return sanitizeB2BAccount(updated, false);
  });
};

/**
 * Admin B2B Documents CRUD
 */
const getB2BDocuments = async (publicId) => {
  const account = await B2BAccount.query().where({ public_id: publicId }).first();
  if (!account) {
    throw new ApiError(404, 'B2B account not found', 'B2B_ACCOUNT_NOT_FOUND');
  }

  const docs = await B2BDocument.query()
    .where({ b2b_account_id: account.id })
    .orderBy('created_at', 'desc');

  return docs.map(sanitizeB2BDocument);
};

const createB2BDocument = async (publicId, data, req) => {
  const account = await B2BAccount.query().where({ public_id: publicId }).first();
  if (!account) {
    throw new ApiError(404, 'B2B account not found', 'B2B_ACCOUNT_NOT_FOUND');
  }

  const created = await B2BDocument.query().insertAndFetch({
    b2b_account_id: account.id,
    document_type: data.document_type,
    document_url: data.document_url,
    cloudinary_public_id: data.cloudinary_public_id || null,
    verification_status: 'pending',
  });

  await auditService.logRequestAction(req, {
    action: 'CREATE_B2B_DOCUMENT',
    entityType: 'B2BDocument',
    entityId: created.id,
    newValues: sanitizeB2BDocument(created),
  });

  return sanitizeB2BDocument(created);
};

const updateB2BDocument = async (publicId, documentPublicId, data, req) => {
  const account = await B2BAccount.query().where({ public_id: publicId }).first();
  if (!account) {
    throw new ApiError(404, 'B2B account not found', 'B2B_ACCOUNT_NOT_FOUND');
  }

  const existing = await B2BDocument.query()
    .where({ public_id: documentPublicId, b2b_account_id: account.id })
    .first();
  if (!existing) {
    throw new ApiError(404, 'B2B document not found', 'DOCUMENT_NOT_FOUND');
  }

  const oldValues = sanitizeB2BDocument(existing);
  const updated = await B2BDocument.query().patchAndFetchById(existing.id, data);

  await auditService.logRequestAction(req, {
    action: 'UPDATE_B2B_DOCUMENT',
    entityType: 'B2BDocument',
    entityId: existing.id,
    oldValues,
    newValues: sanitizeB2BDocument(updated),
  });

  return sanitizeB2BDocument(updated);
};

const deleteB2BDocument = async (publicId, documentPublicId, req) => {
  const account = await B2BAccount.query().where({ public_id: publicId }).first();
  if (!account) {
    throw new ApiError(404, 'B2B account not found', 'B2B_ACCOUNT_NOT_FOUND');
  }

  const existing = await B2BDocument.query()
    .where({ public_id: documentPublicId, b2b_account_id: account.id })
    .first();
  if (!existing) {
    throw new ApiError(404, 'B2B document not found', 'DOCUMENT_NOT_FOUND');
  }

  await B2BDocument.query().deleteById(existing.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_B2B_DOCUMENT',
    entityType: 'B2BDocument',
    entityId: existing.id,
    oldValues: sanitizeB2BDocument(existing),
  });

  return { message: 'B2B document deleted successfully' };
};

const updateB2BDocumentStatus = async (publicId, documentPublicId, { status, rejection_reason }, req) => {
  if (!VALID_DOC_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid verification status', 'INVALID_STATUS');
  }

  return B2BDocument.transaction(async (trx) => {
    const account = await B2BAccount.query(trx).where({ public_id: publicId }).first();
    if (!account) {
      throw new ApiError(404, 'B2B account not found', 'B2B_ACCOUNT_NOT_FOUND');
    }

    const doc = await B2BDocument.query(trx)
      .where({ public_id: documentPublicId, b2b_account_id: account.id })
      .first();
    if (!doc) {
      throw new ApiError(404, 'B2B document not found', 'DOCUMENT_NOT_FOUND');
    }

    const oldValues = sanitizeB2BDocument(doc);
    const updated = await B2BDocument.query(trx).patchAndFetchById(doc.id, {
      verification_status: status,
      rejection_reason: status === 'rejected' ? rejection_reason || null : null,
    });

    await auditService.logRequestAction(
      req,
      {
        action: 'UPDATE_B2B_DOCUMENT_STATUS',
        entityType: 'B2BDocument',
        entityId: doc.id,
        oldValues,
        newValues: sanitizeB2BDocument(updated),
      },
      trx
    );

    return sanitizeB2BDocument(updated);
  });
};

/**
 * Admin B2B Pricing Rules CRUD
 */
const getAdminPricingRules = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = B2BPricingRule.query().withGraphFetched('product');

  if (query.discount_tier) {
    builder = builder.where('discount_tier', query.discount_tier);
  }

  if (query.is_active !== undefined) {
    const isActive = query.is_active === 'true' || query.is_active === true;
    builder = builder.where('is_active', isActive);
  }

  if (query.product_id || query.product_public_id) {
    const pid = query.product_id || query.product_public_id;
    const prod = await Product.query().where({ public_id: pid }).first();
    builder = builder.where('product_id', prod ? prod.id : 0);
  }

  builder = builder.orderBy('discount_tier', 'asc').orderBy('min_quantity', 'asc');

  const [totalRes, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map(sanitizeB2BPricingRule),
    total: totalRes,
    page,
    limit,
  });
};

const getAdminPricingRuleByPublicId = async (publicId) => {
  const rule = await B2BPricingRule.query()
    .where({ public_id: publicId })
    .withGraphFetched('product')
    .first();

  if (!rule) {
    throw new ApiError(404, 'B2B pricing rule not found', 'PRICING_RULE_NOT_FOUND');
  }

  return sanitizeB2BPricingRule(rule);
};

const createAdminPricingRule = async (data, req) => {
  let product_id = null;
  const productIdentifier = data.product_id || data.product_public_id;

  if (productIdentifier) {
    const product = await Product.query().where({ public_id: productIdentifier }).first();
    if (!product) {
      throw new ApiError(404, 'Associated product not found', 'PRODUCT_NOT_FOUND');
    }
    product_id = product.id;
  }

  const { product_id: _pid, product_public_id: _ppid, ...ruleData } = data;

  const newRule = await B2BPricingRule.query()
    .insertAndFetch({
      ...ruleData,
      product_id,
    })
    .withGraphFetched('product');

  await auditService.logRequestAction(req, {
    action: 'CREATE_B2B_PRICING_RULE',
    entityType: 'B2BPricingRule',
    entityId: newRule.id,
    newValues: sanitizeB2BPricingRule(newRule),
  });

  return sanitizeB2BPricingRule(newRule);
};

const updateAdminPricingRule = async (publicId, data, req) => {
  const rule = await B2BPricingRule.query()
    .where({ public_id: publicId })
    .withGraphFetched('product')
    .first();

  if (!rule) {
    throw new ApiError(404, 'B2B pricing rule not found', 'PRICING_RULE_NOT_FOUND');
  }

  const patchData = { ...data };
  delete patchData.product_id;
  delete patchData.product_public_id;

  const productIdentifier = data.product_id !== undefined ? data.product_id : data.product_public_id;
  if (productIdentifier !== undefined) {
    if (productIdentifier === null) {
      patchData.product_id = null;
    } else {
      const product = await Product.query().where({ public_id: productIdentifier }).first();
      if (!product) {
        throw new ApiError(404, 'Associated product not found', 'PRODUCT_NOT_FOUND');
      }
      patchData.product_id = product.id;
    }
  }

  const oldValues = sanitizeB2BPricingRule(rule);
  const updated = await B2BPricingRule.query()
    .patchAndFetchById(rule.id, patchData)
    .withGraphFetched('product');

  await auditService.logRequestAction(req, {
    action: 'UPDATE_B2B_PRICING_RULE',
    entityType: 'B2BPricingRule',
    entityId: rule.id,
    oldValues,
    newValues: sanitizeB2BPricingRule(updated),
  });

  return sanitizeB2BPricingRule(updated);
};

const deleteAdminPricingRule = async (publicId, req) => {
  const rule = await B2BPricingRule.query()
    .where({ public_id: publicId })
    .withGraphFetched('product')
    .first();

  if (!rule) {
    throw new ApiError(404, 'B2B pricing rule not found', 'PRICING_RULE_NOT_FOUND');
  }

  await B2BPricingRule.query().deleteById(rule.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_B2B_PRICING_RULE',
    entityType: 'B2BPricingRule',
    entityId: rule.id,
    oldValues: sanitizeB2BPricingRule(rule),
  });

  return { message: 'B2B pricing rule deleted successfully' };
};

module.exports = {
  applyPublicB2B,
  getAdminB2BAccounts,
  getAdminB2BAccountByPublicId,
  updateAdminB2BAccount,
  updateB2BAccountStatus,
  getB2BDocuments,
  createB2BDocument,
  updateB2BDocument,
  deleteB2BDocument,
  updateB2BDocumentStatus,
  getAdminPricingRules,
  getAdminPricingRuleByPublicId,
  createAdminPricingRule,
  updateAdminPricingRule,
  deleteAdminPricingRule,
  sanitizeB2BAccount,
  sanitizeB2BPricingRule,
};
