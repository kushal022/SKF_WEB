const { z } = require('zod');

const uuidValidator = z.string().uuid('Invalid UUID format');

const createPaymentSchema = z
  .object({
    order_public_id: z.string({ required_error: 'Order public ID is required' }).uuid('Invalid order public ID format'),
    payment_reference: z.string().trim().max(100).optional(),
    gateway: z.string().trim().max(30).optional().nullable(),
    gateway_order_id: z.string().trim().max(150).optional().nullable(),
    gateway_payment_id: z.string().trim().max(150).optional().nullable(),
    amount: z.number({ required_error: 'Amount is required' }).positive('Payment amount must be greater than 0'),
    currency: z.string().trim().max(10).optional().default('INR'),
    status: z
      .enum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded'])
      .optional()
      .default('pending'),
    failure_reason: z.string().trim().optional().nullable(),
    metadata: z.record(z.any()).optional().nullable(),
  })
  .strict();

const updatePaymentSchema = z
  .object({
    gateway: z.string().trim().max(30).optional().nullable(),
    gateway_order_id: z.string().trim().max(150).optional().nullable(),
    gateway_payment_id: z.string().trim().max(150).optional().nullable(),
    failure_reason: z.string().trim().optional().nullable(),
    metadata: z.record(z.any()).optional().nullable(),
  })
  .strict();

const updatePaymentStatusSchema = z
  .object({
    status: z.enum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded'], {
      required_error: 'Valid payment status is required',
    }),
    failure_reason: z.string().trim().max(500).optional().nullable(),
    gateway_payment_id: z.string().trim().max(150).optional().nullable(),
    metadata: z.record(z.any()).optional().nullable(),
  })
  .strict();

const paymentParamSchema = z
  .object({
    publicId: uuidValidator,
  })
  .strict();

const listPaymentsQuerySchema = z
  .object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.string().trim().optional(),
    gateway: z.string().trim().optional(),
    order_public_id: z.string().uuid().optional(),
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    sort_by: z.enum(['created_at', 'amount', 'paid_at', 'status']).optional(),
    sort_order: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  })
  .passthrough();

module.exports = {
  createPaymentSchema,
  updatePaymentSchema,
  updatePaymentStatusSchema,
  paymentParamSchema,
  listPaymentsQuerySchema,
};
