const { z } = require('zod');

const uuidValidator = z.string().uuid('Invalid UUID format');

const quotationItemInputSchema = z
  .object({
    product_public_id: z.string().uuid('Invalid product public ID format').optional().nullable(),
    description: z.string({ required_error: 'Item description is required' }).trim().min(1, 'Item description cannot be empty').max(500),
    quantity: z.number({ required_error: 'Quantity is required' }).positive('Quantity must be greater than 0'),
    unit_price: z.number({ required_error: 'Unit price is required' }).min(0, 'Unit price cannot be negative'),
    customization_amount: z.number().min(0, 'Customization amount cannot be negative').optional().default(0),
    discount_amount: z.number().min(0, 'Discount amount cannot be negative').optional().default(0),
    metadata: z.record(z.any()).optional().nullable(),
  })
  .strict();

const createQuotationSchema = z
  .object({
    customer_name: z.string().trim().min(1).max(150).optional(),
    customer_phone: z.string().trim().min(1).max(20).optional(),
    customer_email: z.string().trim().email('Invalid email address').max(255).optional().nullable(),
    enquiry_public_id: z.string().uuid('Invalid enquiry public ID format').optional().nullable(),
    b2b_account_public_id: z.string().uuid('Invalid B2B account public ID format').optional().nullable(),
    valid_until: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid until must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    notes: z.string().trim().optional().nullable(),
    customization_amount: z.number().min(0, 'Customization amount cannot be negative').optional().default(0),
    transport_amount: z.number().min(0, 'Transport amount cannot be negative').optional().default(0),
    installation_amount: z.number().min(0, 'Installation amount cannot be negative').optional().default(0),
    discount_amount: z.number().min(0, 'Discount amount cannot be negative').optional().default(0),
    tax_amount: z.number().min(0, 'Tax amount cannot be negative').optional().default(0),
    items: z.array(quotationItemInputSchema).min(1, 'At least one quotation item is required'),
  })
  .strict();

const updateQuotationSchema = z
  .object({
    customer_name: z.string().trim().min(1).max(150).optional(),
    customer_phone: z.string().trim().min(1).max(20).optional(),
    customer_email: z.string().trim().email('Invalid email address').max(255).optional().nullable(),
    valid_until: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid until must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    notes: z.string().trim().optional().nullable(),
    customization_amount: z.number().min(0).optional(),
    transport_amount: z.number().min(0).optional(),
    installation_amount: z.number().min(0).optional(),
    discount_amount: z.number().min(0).optional(),
    tax_amount: z.number().min(0).optional(),
  })
  .strict();

const updateQuotationStatusSchema = z
  .object({
    status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled'], {
      required_error: 'Valid status is required',
    }),
    comment: z.string().trim().max(500).optional().nullable(),
  })
  .strict();

const quotationParamSchema = z
  .object({
    publicId: uuidValidator,
  })
  .strict();

const quotationAndItemParamSchema = z
  .object({
    publicId: uuidValidator,
    itemPublicId: uuidValidator,
  })
  .strict();

const createQuotationItemSchema = quotationItemInputSchema;

const updateQuotationItemSchema = z
  .object({
    product_public_id: z.string().uuid('Invalid product public ID format').optional().nullable(),
    description: z.string().trim().min(1).max(500).optional(),
    quantity: z.number().positive('Quantity must be greater than 0').optional(),
    unit_price: z.number().min(0, 'Unit price cannot be negative').optional(),
    customization_amount: z.number().min(0).optional(),
    discount_amount: z.number().min(0).optional(),
    metadata: z.record(z.any()).optional().nullable(),
  })
  .strict();

const listQuotationsQuerySchema = z
  .object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().trim().optional(),
    status: z.string().trim().optional(),
    customer: z.string().trim().optional(),
    enquiry_public_id: z.string().uuid().optional(),
    b2b_account_public_id: z.string().uuid().optional(),
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    sort_by: z.enum(['created_at', 'total_amount', 'quotation_number', 'valid_until']).optional(),
    sort_order: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  })
  .passthrough();

module.exports = {
  createQuotationSchema,
  updateQuotationSchema,
  updateQuotationStatusSchema,
  quotationParamSchema,
  quotationAndItemParamSchema,
  createQuotationItemSchema,
  updateQuotationItemSchema,
  listQuotationsQuerySchema,
};
