const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

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
    old_values: params.oldValues || null,
    new_values: params.newValues || null,
    metadata: params.metadata || null,
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

module.exports = {
  getAuditContext,
  logAction,
  logRequestAction,
};
