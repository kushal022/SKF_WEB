const ApiError = require('../utils/ApiError');
const EstimatorRule = require('../models/EstimatorRule');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const auditService = require('./audit.service');

const UNIT_CONVERSION_TO_METERS = {
  mm: 0.001,
  cm: 0.01,
  in: 0.0254,
  ft: 0.3048,
  m: 1.0,
};

const sanitizeEstimatorRule = (rule, isAdmin = false) => {
  if (!rule) return null;

  const base = {
    public_id: rule.public_id,
    name: rule.name,
    product_type: rule.product_type || null,
    material: rule.material || null,
    finish: rule.finish || null,
    dimension_multiplier:
      rule.dimension_multiplier !== null ? Number(rule.dimension_multiplier) : null,
    material_rate: rule.material_rate !== null ? Number(rule.material_rate) : null,
    finish_adjustment:
      rule.finish_adjustment !== null ? Number(rule.finish_adjustment) : null,
    base_rate: rule.base_rate !== null ? Number(rule.base_rate) : null,
    priority: rule.priority,
    is_active: Boolean(rule.is_active),
    created_at: rule.created_at,
    updated_at: rule.updated_at,
  };

  if (isAdmin) {
    base.rule_config = rule.rule_config || null;
  }

  return base;
};

/**
 * Public get active estimator rules.
 */
const getPublicEstimatorRules = async () => {
  const rules = await EstimatorRule.query()
    .where('is_active', true)
    .orderBy('priority', 'desc');

  return rules.map((r) => sanitizeEstimatorRule(r, false));
};

/**
 * Public calculate estimate based on input dimensions and active estimator rules.
 */
const calculateEstimate = async (input) => {
  const factor = UNIT_CONVERSION_TO_METERS[input.dimension_unit] || 0.001;
  const w = input.width * factor;
  const l = input.length * factor;
  const h = (input.height || 0) * factor;

  // Approximate surface area/footprint in square meters
  const area = h > 0 ? 2 * (w * l + w * h + l * h) : w * l;

  const activeRules = await EstimatorRule.query()
    .where('is_active', true)
    .orderBy('priority', 'desc');

  let matchedRule = null;
  for (const rule of activeRules) {
    const productMatch =
      !rule.product_type ||
      (input.product_type &&
        rule.product_type.toLowerCase() === input.product_type.toLowerCase());
    const materialMatch =
      !rule.material ||
      (input.material && rule.material.toLowerCase() === input.material.toLowerCase());
    const finishMatch =
      !rule.finish ||
      (input.finish && rule.finish.toLowerCase() === input.finish.toLowerCase());

    if (productMatch && materialMatch && finishMatch) {
      matchedRule = rule;
      break;
    }
  }

  const baseRate = Number(matchedRule?.base_rate || 5000);
  const dimMultiplier = Number(matchedRule?.dimension_multiplier || 1500);
  const materialRate = Number(matchedRule?.material_rate || 0);
  const finishAdjustment = Number(matchedRule?.finish_adjustment || 0);

  let unitEstimate = baseRate + area * dimMultiplier + materialRate + finishAdjustment;
  if (unitEstimate < 0) {
    unitEstimate = baseRate;
  }

  const quantity = Math.max(1, input.quantity || 1);
  const totalEstimate = unitEstimate * quantity;

  return {
    is_estimate: true,
    disclaimer:
      'This is an automated estimate for reference only, not a formal commercial quotation.',
    matched_rule: matchedRule
      ? {
          public_id: matchedRule.public_id,
          name: matchedRule.name,
        }
      : null,
    unit_estimate: Math.round(unitEstimate * 100) / 100,
    total_estimate: Math.round(totalEstimate * 100) / 100,
    quantity,
    currency: 'INR',
  };
};

/**
 * Admin Estimator Rules CRUD
 */
const getAdminEstimatorRules = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = EstimatorRule.query();

  if (query.product_type) {
    builder = builder.where('product_type', query.product_type);
  }

  if (query.material) {
    builder = builder.where('material', query.material);
  }

  if (query.finish) {
    builder = builder.where('finish', query.finish);
  }

  if (query.is_active !== undefined) {
    const isActive = query.is_active === 'true' || query.is_active === true;
    builder = builder.where('is_active', isActive);
  }

  if (query.search) {
    const term = `%${query.search.trim()}%`;
    builder = builder.where((b) => {
      b.where('name', 'like', term)
        .orWhere('product_type', 'like', term)
        .orWhere('material', 'like', term)
        .orWhere('finish', 'like', term);
    });
  }

  builder = builder.orderBy('priority', 'desc').orderBy('created_at', 'desc');

  const [totalRes, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map((r) => sanitizeEstimatorRule(r, true)),
    total: totalRes,
    page,
    limit,
  });
};

const getAdminEstimatorRuleByPublicId = async (publicId) => {
  const rule = await EstimatorRule.query().where({ public_id: publicId }).first();
  if (!rule) {
    throw new ApiError(404, 'Estimator rule not found', 'ESTIMATOR_RULE_NOT_FOUND');
  }

  return sanitizeEstimatorRule(rule, true);
};

const createAdminEstimatorRule = async (data, req) => {
  const newRule = await EstimatorRule.query().insertAndFetch(data);

  await auditService.logRequestAction(req, {
    action: 'CREATE_ESTIMATOR_RULE',
    entityType: 'EstimatorRule',
    entityId: newRule.id,
    newValues: sanitizeEstimatorRule(newRule, true),
  });

  return sanitizeEstimatorRule(newRule, true);
};

const updateAdminEstimatorRule = async (publicId, data, req) => {
  const rule = await EstimatorRule.query().where({ public_id: publicId }).first();
  if (!rule) {
    throw new ApiError(404, 'Estimator rule not found', 'ESTIMATOR_RULE_NOT_FOUND');
  }

  const oldValues = sanitizeEstimatorRule(rule, true);
  const updated = await EstimatorRule.query().patchAndFetchById(rule.id, data);

  await auditService.logRequestAction(req, {
    action: 'UPDATE_ESTIMATOR_RULE',
    entityType: 'EstimatorRule',
    entityId: rule.id,
    oldValues,
    newValues: sanitizeEstimatorRule(updated, true),
  });

  return sanitizeEstimatorRule(updated, true);
};

const deleteAdminEstimatorRule = async (publicId, req) => {
  const rule = await EstimatorRule.query().where({ public_id: publicId }).first();
  if (!rule) {
    throw new ApiError(404, 'Estimator rule not found', 'ESTIMATOR_RULE_NOT_FOUND');
  }

  await EstimatorRule.query().deleteById(rule.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_ESTIMATOR_RULE',
    entityType: 'EstimatorRule',
    entityId: rule.id,
    oldValues: sanitizeEstimatorRule(rule, true),
  });

  return { message: 'Estimator rule deleted successfully' };
};

module.exports = {
  getPublicEstimatorRules,
  calculateEstimate,
  getAdminEstimatorRules,
  getAdminEstimatorRuleByPublicId,
  createAdminEstimatorRule,
  updateAdminEstimatorRule,
  deleteAdminEstimatorRule,
  sanitizeEstimatorRule,
};
