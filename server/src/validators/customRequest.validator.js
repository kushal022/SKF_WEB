const { z } = require('zod');

const createCustomRequestSchema = z
  .object({
    product_type: z
      .string({ required_error: 'Product type is required' })
      .trim()
      .min(1, 'Product type is required')
      .max(150, 'Product type must not exceed 150 characters'),
    width: z.union([z.number(), z.string()]).optional().nullable(),
    length: z.union([z.number(), z.string()]).optional().nullable(),
    height: z.union([z.number(), z.string()]).optional().nullable(),
    dimension_unit: z.string().trim().max(20).optional().nullable(),
    material: z.string().trim().max(150).optional().nullable(),
    finish: z.string().trim().max(150).optional().nullable(),
    quantity: z.number().int().min(1).default(1).optional(),
    customer_name: z
      .string({ required_error: 'Customer name is required' })
      .trim()
      .min(1, 'Customer name is required')
      .max(150, 'Customer name must not exceed 150 characters'),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .min(1, 'Phone number is required')
      .max(20, 'Phone number must not exceed 20 characters'),
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .max(255, 'Email must not exceed 255 characters')
      .optional()
      .nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    requirement: z.string().trim().optional().nullable(),
    estimated_amount: z.union([z.number(), z.string()]).optional().nullable(),
    images: z
      .array(
        z.object({
          image_url: z.string().url('Invalid image URL').max(500),
          cloudinary_public_id: z.string().trim().max(255).optional().nullable(),
          sort_order: z.number().int().optional(),
        })
      )
      .optional(),
  })
  .strict();

const updateCustomRequestSchema = z
  .object({
    product_type: z.string().trim().min(1).max(150).optional(),
    width: z.union([z.number(), z.string()]).optional().nullable(),
    length: z.union([z.number(), z.string()]).optional().nullable(),
    height: z.union([z.number(), z.string()]).optional().nullable(),
    dimension_unit: z.string().trim().max(20).optional().nullable(),
    material: z.string().trim().max(150).optional().nullable(),
    finish: z.string().trim().max(150).optional().nullable(),
    quantity: z.number().int().min(1).optional(),
    customer_name: z.string().trim().min(1).max(150).optional(),
    phone: z.string().trim().min(1).max(20).optional(),
    email: z.string().trim().email('Invalid email address').max(255).optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    requirement: z.string().trim().optional().nullable(),
    estimated_amount: z.union([z.number(), z.string()]).optional().nullable(),
  })
  .strict();

const updateCustomRequestStatusSchema = z
  .object({
    status: z.enum(['new', 'reviewing', 'quoted', 'approved', 'rejected', 'completed'], {
      required_error: 'Valid status is required',
    }),
  })
  .strict();

const createCustomRequestImageSchema = z
  .object({
    image_url: z.string({ required_error: 'Image URL is required' }).url('Invalid image URL').max(500),
    cloudinary_public_id: z.string().trim().max(255).optional().nullable(),
    sort_order: z.number().int().optional(),
  })
  .strict();

const updateCustomRequestImageSchema = z
  .object({
    image_url: z.string().url('Invalid image URL').max(500).optional(),
    cloudinary_public_id: z.string().trim().max(255).optional().nullable(),
    sort_order: z.number().int().optional(),
  })
  .strict();

const customRequestParamSchema = z.object({
  publicId: z.string().uuid('Invalid custom request identifier format'),
});

const customRequestAndImageParamSchema = z.object({
  publicId: z.string().uuid('Invalid custom request identifier format'),
  imagePublicId: z.string().uuid('Invalid image identifier format'),
});

module.exports = {
  createCustomRequestSchema,
  updateCustomRequestSchema,
  updateCustomRequestStatusSchema,
  createCustomRequestImageSchema,
  updateCustomRequestImageSchema,
  customRequestParamSchema,
  customRequestAndImageParamSchema,
};
