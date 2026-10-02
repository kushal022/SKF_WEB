const { z } = require('zod');

const applyB2BSchema = z
  .object({
    company_name: z
      .string({ required_error: 'Company name is required' })
      .trim()
      .min(1, 'Company name is required')
      .max(200, 'Company name must not exceed 200 characters'),
    contact_name: z
      .string({ required_error: 'Contact name is required' })
      .trim()
      .min(1, 'Contact name is required')
      .max(150, 'Contact name must not exceed 150 characters'),
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
    business_type: z.string().trim().max(100).optional().nullable(),
    gst_number: z.string().trim().max(30).optional().nullable(),
    address: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  })
  .strict();

const updateB2BAccountSchema = z
  .object({
    company_name: z.string().trim().min(1).max(200).optional(),
    contact_name: z.string().trim().min(1).max(150).optional(),
    phone: z.string().trim().min(1).max(20).optional(),
    email: z.string().trim().email('Invalid email address').max(255).optional().nullable(),
    business_type: z.string().trim().max(100).optional().nullable(),
    gst_number: z.string().trim().max(30).optional().nullable(),
    address: z.string().trim().optional().nullable(),
    discount_tier: z.string().trim().max(50).optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  })
  .strict();

const updateB2BAccountStatusSchema = z
  .object({
    status: z.enum(['pending', 'approved', 'rejected', 'suspended'], {
      required_error: 'Valid verification status is required',
    }),
  })
  .strict();

const createB2BDocumentSchema = z
  .object({
    document_type: z
      .string({ required_error: 'Document type is required' })
      .trim()
      .min(1, 'Document type is required')
      .max(50, 'Document type must not exceed 50 characters'),
    document_url: z
      .string({ required_error: 'Document URL is required' })
      .url('Invalid document URL')
      .max(500),
    cloudinary_public_id: z.string().trim().max(255).optional().nullable(),
  })
  .strict();

const updateB2BDocumentSchema = z
  .object({
    document_type: z.string().trim().min(1).max(50).optional(),
    document_url: z.string().url('Invalid document URL').max(500).optional(),
    cloudinary_public_id: z.string().trim().max(255).optional().nullable(),
  })
  .strict();

const updateB2BDocumentStatusSchema = z
  .object({
    status: z.enum(['pending', 'approved', 'rejected'], {
      required_error: 'Valid verification status is required',
    }),
    rejection_reason: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.status === 'rejected' && (!data.rejection_reason || data.rejection_reason.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'Rejection reason is required when status is rejected',
      path: ['rejection_reason'],
    }
  );

const createB2BPricingRuleSchema = z
  .object({
    discount_tier: z
      .string({ required_error: 'Discount tier is required' })
      .trim()
      .min(1, 'Discount tier is required')
      .max(50),
    product_id: z.string().uuid('Invalid product identifier format').optional().nullable(),
    product_public_id: z.string().uuid('Invalid product identifier format').optional().nullable(),
    discount_type: z.enum(['percentage', 'fixed'], {
      required_error: 'Discount type must be either percentage or fixed',
    }),
    discount_value: z.number().positive('Discount value must be greater than 0'),
    min_quantity: z.number().int().min(1).default(1),
    is_active: z.boolean().default(true),
  })
  .strict();

const updateB2BPricingRuleSchema = z
  .object({
    discount_tier: z.string().trim().min(1).max(50).optional(),
    product_id: z.string().uuid('Invalid product identifier format').optional().nullable(),
    product_public_id: z.string().uuid('Invalid product identifier format').optional().nullable(),
    discount_type: z.enum(['percentage', 'fixed']).optional(),
    discount_value: z.number().positive().optional(),
    min_quantity: z.number().int().min(1).optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

const b2bAccountParamSchema = z.object({
  publicId: z.string().uuid('Invalid account identifier format'),
});

const b2bAccountAndDocParamSchema = z.object({
  publicId: z.string().uuid('Invalid account identifier format'),
  documentPublicId: z.string().uuid('Invalid document identifier format'),
});

const b2bPricingRuleParamSchema = z.object({
  publicId: z.string().uuid('Invalid pricing rule identifier format'),
});

module.exports = {
  applyB2BSchema,
  updateB2BAccountSchema,
  updateB2BAccountStatusSchema,
  createB2BDocumentSchema,
  updateB2BDocumentSchema,
  updateB2BDocumentStatusSchema,
  createB2BPricingRuleSchema,
  updateB2BPricingRuleSchema,
  b2bAccountParamSchema,
  b2bAccountAndDocParamSchema,
  b2bPricingRuleParamSchema,
};
