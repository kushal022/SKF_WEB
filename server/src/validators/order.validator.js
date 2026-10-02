const { z } = require('zod');

const uuidValidator = z.string().uuid('Invalid UUID format');

const orderItemInputSchema = z
  .object({
    product_public_id: z.string().uuid('Invalid product public ID format').optional().nullable(),
    description: z.string({ required_error: 'Item description is required' }).trim().min(1, 'Item description cannot be empty').max(500),
    quantity: z.number({ required_error: 'Quantity is required' }).positive('Quantity must be greater than 0'),
    unit_price: z.number({ required_error: 'Unit price is required' }).min(0, 'Unit price cannot be negative'),
    metadata: z.record(z.any()).optional().nullable(),
  })
  .strict();

const createOrderSchema = z
  .object({
    quotation_public_id: z.string().uuid('Invalid quotation public ID format').optional().nullable(),
    customer_name: z.string().trim().min(1).max(150).optional(),
    customer_phone: z.string().trim().min(1).max(20).optional(),
    customer_email: z.string().trim().email('Invalid email address').max(150).optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    discount_amount: z.number().min(0, 'Discount amount cannot be negative').optional().default(0),
    tax_amount: z.number().min(0, 'Tax amount cannot be negative').optional().default(0),
    shipping_amount: z.number().min(0, 'Shipping amount cannot be negative').optional().default(0),
    installation_amount: z.number().min(0, 'Installation amount cannot be negative').optional().default(0),
    items: z.array(orderItemInputSchema).optional(),
  })
  .strict()
  .refine(
    (data) => {
      // Must either have quotation_public_id OR (customer_name + customer_phone + at least one item)
      if (data.quotation_public_id) {
        return true;
      }
      return Boolean(data.customer_name && data.customer_phone && data.items && data.items.length > 0);
    },
    {
      message: 'Direct order creation requires customer_name, customer_phone, and at least one item',
    }
  );

const updateOrderSchema = z
  .object({
    customer_name: z.string().trim().min(1).max(150).optional(),
    customer_phone: z.string().trim().min(1).max(20).optional(),
    customer_email: z.string().trim().email('Invalid email address').max(150).optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    discount_amount: z.number().min(0).optional(),
    tax_amount: z.number().min(0).optional(),
    shipping_amount: z.number().min(0).optional(),
    installation_amount: z.number().min(0).optional(),
  })
  .strict();

const updateOrderStatusSchema = z
  .object({
    status: z.enum(
      [
        'pending',
        'confirmed',
        'manufacturing',
        'ready',
        'dispatched',
        'delivered',
        'cancelled',
      ],
      { required_error: 'Valid status is required' }
    ),
    comment: z.string().trim().max(500).optional().nullable(),
  })
  .strict();

const orderParamSchema = z
  .object({
    publicId: uuidValidator,
  })
  .strict();

const orderAndItemParamSchema = z
  .object({
    publicId: uuidValidator,
    itemPublicId: uuidValidator,
  })
  .strict();

const createOrderItemSchema = orderItemInputSchema;

const updateOrderItemSchema = z
  .object({
    product_public_id: z.string().uuid('Invalid product public ID format').optional().nullable(),
    description: z.string().trim().min(1).max(500).optional(),
    quantity: z.number().positive('Quantity must be greater than 0').optional(),
    unit_price: z.number().min(0, 'Unit price cannot be negative').optional(),
    metadata: z.record(z.any()).optional().nullable(),
  })
  .strict();

const listOrdersQuerySchema = z
  .object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().trim().optional(),
    status: z.string().trim().optional(),
    customer: z.string().trim().optional(),
    quotation_public_id: z.string().uuid().optional(),
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    sort_by: z.enum(['created_at', 'total_amount', 'order_number', 'status']).optional(),
    sort_order: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  })
  .passthrough();

module.exports = {
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  orderParamSchema,
  orderAndItemParamSchema,
  createOrderItemSchema,
  updateOrderItemSchema,
  listOrdersQuerySchema,
};
