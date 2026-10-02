const { z } = require('zod');

const uuidValidator = z.string().uuid('Invalid UUID format');

const createNotificationSchema = z
  .object({
    user_public_id: z.string().uuid('Invalid user public ID format').optional().nullable(),
    type: z.string({ required_error: 'Notification type is required' }).trim().min(1).max(50),
    title: z.string({ required_error: 'Notification title is required' }).trim().min(1).max(200),
    message: z.string({ required_error: 'Notification message is required' }).trim().min(1),
    data: z.record(z.any()).optional().nullable(),
    channel: z.string().trim().max(30).optional().default('in_app'),
    related_entity_type: z.string().trim().max(50).optional().nullable(),
    related_entity_public_id: z.string().uuid().optional().nullable(),
  })
  .strict();

const notificationParamSchema = z
  .object({
    publicId: uuidValidator,
  })
  .strict();

const listNotificationsQuerySchema = z
  .object({
    page: z.string().optional(),
    limit: z.string().optional(),
    user_public_id: z.string().uuid().optional(),
    type: z.string().trim().optional(),
    is_read: z.enum(['true', 'false', '1', '0']).optional(),
    sort_order: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  })
  .passthrough();

module.exports = {
  createNotificationSchema,
  notificationParamSchema,
  listNotificationsQuerySchema,
};
