const { z } = require('zod');

const uuidValidator = z.string().uuid('Invalid UUID format');

const auditLogParamSchema = z
  .object({
    publicId: uuidValidator,
  })
  .strict();

const listAuditLogsQuerySchema = z
  .object({
    page: z.string().optional(),
    limit: z.string().optional(),
    user_public_id: z.string().uuid().optional(),
    action: z.string().trim().optional(),
    entity_type: z.string().trim().optional(),
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    sort_by: z.enum(['created_at', 'action', 'entity_type']).optional(),
    sort_order: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  })
  .passthrough();

module.exports = {
  auditLogParamSchema,
  listAuditLogsQuerySchema,
};
