const { z } = require('zod');

const datetimeValidator = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid datetime format, expected ISO string',
  });

const createEnquirySchema = z
  .object({
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
    product_id: z.string().uuid('Invalid product identifier format').optional().nullable(),
    product_public_id: z.string().uuid('Invalid product identifier format').optional().nullable(),
    source: z.string().trim().max(50, 'Source must not exceed 50 characters').optional().nullable(),
    message: z.string().trim().optional().nullable(),
  })
  .strict();

const adminUpdateEnquirySchema = z
  .object({
    customer_name: z.string().trim().min(1).max(150).optional(),
    phone: z.string().trim().min(1).max(20).optional(),
    email: z.string().trim().email('Invalid email address').max(255).optional().nullable(),
    source: z.string().trim().max(50).optional().nullable(),
    message: z.string().trim().optional().nullable(),
  })
  .strict();

const updateEnquiryStatusSchema = z
  .object({
    status: z.enum(
      ['new', 'contacted', 'quotation_sent', 'negotiation', 'confirmed', 'completed', 'lost'],
      { required_error: 'Valid status is required' }
    ),
    comment: z.string().trim().max(500).optional().nullable(),
  })
  .strict();

const createEnquiryNoteSchema = z
  .object({
    note: z
      .string({ required_error: 'Note content is required' })
      .trim()
      .min(1, 'Note cannot be empty'),
  })
  .strict();

const updateEnquiryNoteSchema = z
  .object({
    note: z
      .string({ required_error: 'Note content is required' })
      .trim()
      .min(1, 'Note cannot be empty'),
  })
  .strict();

const createFollowUpSchema = z
  .object({
    follow_up_at: datetimeValidator,
    assigned_to: z.string().uuid('Invalid user identifier format').optional().nullable(),
    note: z.string().trim().optional().nullable(),
    status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  })
  .strict();

const updateFollowUpSchema = z
  .object({
    follow_up_at: datetimeValidator.optional(),
    assigned_to: z.string().uuid('Invalid user identifier format').optional().nullable(),
    note: z.string().trim().optional().nullable(),
    status: z.enum(['pending', 'completed', 'cancelled']).optional(),
    completed_at: datetimeValidator.optional().nullable(),
  })
  .strict();

const enquiryParamSchema = z.object({
  publicId: z.string().uuid('Invalid enquiry identifier format'),
});

const enquiryAndNoteParamSchema = z.object({
  publicId: z.string().uuid('Invalid enquiry identifier format'),
  notePublicId: z.string().uuid('Invalid note identifier format'),
});

const enquiryAndFollowUpParamSchema = z.object({
  publicId: z.string().uuid('Invalid enquiry identifier format'),
  followUpPublicId: z.string().uuid('Invalid follow-up identifier format'),
});

module.exports = {
  createEnquirySchema,
  adminUpdateEnquirySchema,
  updateEnquiryStatusSchema,
  createEnquiryNoteSchema,
  updateEnquiryNoteSchema,
  createFollowUpSchema,
  updateFollowUpSchema,
  enquiryParamSchema,
  enquiryAndNoteParamSchema,
  enquiryAndFollowUpParamSchema,
};
