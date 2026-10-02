const { z } = require('zod');

const createCategorySchema = z
  .object({
    name: z
      .string({ required_error: 'Category name is required' })
      .trim()
      .min(1, 'Category name is required')
      .max(150, 'Category name must not exceed 150 characters'),
    slug: z
      .string({ required_error: 'Category slug is required' })
      .trim()
      .min(1, 'Category slug is required')
      .max(180, 'Category slug must not exceed 180 characters')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe (lowercase letters, numbers, hyphens)'),
    parent_public_id: z.string().uuid('Invalid parent category identifier').optional().nullable(),
    description: z.string().trim().optional().nullable(),
    image_url: z.string().trim().max(500).optional().nullable(),
    sort_order: z.number().int().optional(),
    is_active: z.boolean().optional(),
    seo_title: z.string().trim().max(255).optional().nullable(),
    seo_description: z.string().trim().optional().nullable(),
  })
  .strict();

const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe')
      .optional(),
    parent_public_id: z.string().uuid('Invalid parent category identifier').optional().nullable(),
    description: z.string().trim().optional().nullable(),
    image_url: z.string().trim().max(500).optional().nullable(),
    sort_order: z.number().int().optional(),
    is_active: z.boolean().optional(),
    seo_title: z.string().trim().max(255).optional().nullable(),
    seo_description: z.string().trim().optional().nullable(),
  })
  .strict();

const categoryQuerySchema = z.object({
  search: z.string().trim().optional(),
  parent_public_id: z.string().uuid().optional().nullable(),
  is_active: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true' || val === '1')),
  sort: z.enum(['sort_order', 'name', 'created_at', '-sort_order', '-name', '-created_at']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
};
