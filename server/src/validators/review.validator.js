const { z } = require('zod');

const createReviewSchema = z
  .object({
    customer_name: z
      .string({ required_error: 'Customer name is required' })
      .trim()
      .min(1, 'Customer name is required')
      .max(150, 'Customer name must not exceed 150 characters'),
    rating: z
      .number({ required_error: 'Rating is required' })
      .int('Rating must be an integer')
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5'),
    review_text: z
      .string({ required_error: 'Review text is required' })
      .trim()
      .min(1, 'Review text is required'),
    product_id: z.string().uuid('Invalid product identifier format').optional().nullable(),
    product_public_id: z.string().uuid('Invalid product identifier format').optional().nullable(),
  })
  .strict();

const updateReviewSchema = z
  .object({
    customer_name: z.string().trim().min(1).max(150).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    review_text: z.string().trim().min(1).optional(),
    is_featured: z.boolean().optional(),
  })
  .strict();

const updateReviewStatusSchema = z
  .object({
    status: z.enum(['pending', 'approved', 'rejected'], {
      required_error: 'Valid status is required',
    }),
  })
  .strict();

const setReviewFeaturedSchema = z
  .object({
    is_featured: z.boolean({ required_error: 'is_featured boolean flag is required' }),
  })
  .strict();

const reviewParamSchema = z.object({
  publicId: z.string().uuid('Invalid review identifier format'),
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  updateReviewStatusSchema,
  setReviewFeaturedSchema,
  reviewParamSchema,
};
