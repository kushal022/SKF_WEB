const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');

/**
 * Sensitive field patterns to redact from audit trails.
 */
const SENSITIVE_KEY_REGEX = /password|hash|secret|token|jwt|auth|credential|api[-_]?key|private[-_]?key/i;

/**
 * Recursively redacts sensitive keys from audit log objects.
 */
const redactSensitiveData = (data) => {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const redacted = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      redacted[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
};

/**
 * Extracts audit context from Express request object safely.
 * Never trusts client-supplied user identifiers.
 *
 * @param {import('express').Request} req - Express request object
 * @returns {object} Extracted audit context
 */
const getAuditContext = (req) => {
  if (!req) return {};

  const ipAddress = (
    req.ip ||
    (req.headers && req.headers['x-forwarded-for']) ||
    req.connection?.remoteAddress ||
    ''
  ).toString().slice(0, 45);

  return {
    userId: req.user?.id || null,
    userPublicId: req.user?.public_id || null,
    userRole: req.user?.role || null,
    ipAddress: ipAddress || null,
    userAgent: typeof req.get === 'function' ? req.get('user-agent') || null : null,
  };
};

/**
 * Persists an immutable audit log record to the database.
 *
 * @param {object} params
 * @param {number|string|null} [params.userId] - Internal ID of acting user (from authenticated session)
 * @param {string} params.action - Action identifier (e.g. 'ADMIN_LOGIN', 'PRODUCT_CREATE')
 * @param {string|null} [params.entityType] - Target entity table/domain (e.g. 'Product', 'User')
 * @param {number|string|null} [params.entityId] - Internal ID of target entity
 * @param {object|null} [params.oldValues] - State snapshot before mutation
 * @param {object|null} [params.newValues] - State snapshot after mutation
 * @param {object|null} [params.metadata] - Additional structured context
 * @param {string|null} [params.ipAddress] - Request IP address
 * @param {string|null} [params.userAgent] - Request User-Agent header
 * @param {import('objection').Transaction} [trx] - Optional Knex transaction
 * @returns {Promise<AuditLog>} Created AuditLog instance
 */
const logAction = async (params, trx = null) => {
  const query = AuditLog.query(trx);

  return query.insert({
    public_id: crypto.randomUUID(),
    user_id: params.userId || null,
    action: params.action,
    entity_type: params.entityType || null,
    entity_id: params.entityId || null,
    old_values: params.oldValues ? redactSensitiveData(params.oldValues) : null,
    new_values: params.newValues ? redactSensitiveData(params.newValues) : null,
    metadata: params.metadata ? redactSensitiveData(params.metadata) : null,
    ip_address: params.ipAddress ? String(params.ipAddress).slice(0, 45) : null,
    user_agent: params.userAgent || null,
  });
};

/**
 * Convenience helper to log an action using the Express request context.
 *
 * @param {import('express').Request} req - Express request with authenticated req.user
 * @param {object} actionData
 * @param {string} actionData.action - Action identifier
 * @param {string|null} [actionData.entityType] - Target entity type
 * @param {number|string|null} [actionData.entityId] - Target entity internal ID
 * @param {object|null} [actionData.oldValues] - State before mutation
 * @param {object|null} [actionData.newValues] - State after mutation
 * @param {object|null} [actionData.metadata] - Additional contextual data
 * @param {import('objection').Transaction} [trx] - Optional Knex transaction
 * @returns {Promise<AuditLog>} Created AuditLog instance
 */
const logRequestAction = async (req, actionData, trx = null) => {
  const ctx = getAuditContext(req);

  return logAction(
    {
      userId: ctx.userId,
      action: actionData.action,
      entityType: actionData.entityType || null,
      entityId: actionData.entityId || null,
      oldValues: actionData.oldValues || null,
      newValues: actionData.newValues || null,
      metadata: actionData.metadata || null,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
    trx
  );
};

/**
 * Sanitizes audit log record for external API output.
 */
const sanitizeAuditLog = (log) => {
  if (!log) return null;

  return {
    public_id: log.public_id,
    action: log.action,
    entity_type: log.entity_type || null,
    entity_id: log.entity_id || null,
    old_values: redactSensitiveData(log.old_values),
    new_values: redactSensitiveData(log.new_values),
    metadata: redactSensitiveData(log.metadata),
    ip_address: log.ip_address || null,
    user_agent: log.user_agent || null,
    user: log.user
      ? {
          public_id: log.user.public_id,
          name: log.user.name,
          email: log.user.email,
          role: log.user.role,
        }
      : null,
    created_at: log.created_at,
  };
};

/**
 * Lists audit logs with pagination and filters.
 */
const listAuditLogs = async (queryParams) => {
  const { page, limit, offset } = parsePagination(queryParams);
  const { user_public_id, action, entity_type, from_date, to_date, sort_by = 'created_at', sort_order = 'desc' } = queryParams;

  const query = AuditLog.query()
    .withGraphFetched('user')
    .orderBy(sort_by, sort_order.toLowerCase());

  if (user_public_id) {
    const user = await User.query().where('public_id', user_public_id).first();
    if (user) {
      query.where('audit_logs.user_id', user.id);
    } else {
      query.whereRaw('1 = 0');
    }
  }

  if (action) {
    query.where('audit_logs.action', action);
  }

  if (entity_type) {
    query.where('audit_logs.entity_type', entity_type);
  }

  if (from_date) {
    query.where('audit_logs.created_at', '>=', `${from_date} 00:00:00`);
  }

  if (to_date) {
    query.where('audit_logs.created_at', '<=', `${to_date} 23:59:59`);
  }

  const totalQuery = query.clone().clearOrder().count('* as count').first();
  const [totalRes, items] = await Promise.all([totalQuery, query.offset(offset).limit(limit)]);

  const total = parseInt(totalRes?.count || 0, 10);
  const sanitizedItems = items.map(sanitizeAuditLog);

  return formatPaginatedResponse({
    items: sanitizedItems,
    total,
    page,
    limit,
  });
};

/**
 * Retrieves a single audit log by public_id.
 */
const getAuditLogByPublicId = async (publicId) => {
  const log = await AuditLog.query()
    .where('public_id', publicId)
    .withGraphFetched('user')
    .first();

  if (!log) {
    throw ApiError.notFound('Audit log not found');
  }

  return sanitizeAuditLog(log);
};

module.exports = {
  getAuditContext,
  logAction,
  logRequestAction,
  redactSensitiveData,
  sanitizeAuditLog,
  listAuditLogs,
  getAuditLogByPublicId,
};
