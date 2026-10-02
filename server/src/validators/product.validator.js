const { z } = require('zod');

const createProductSchema = z
  .object({
    name: z
      .string({ required_error: 'Product name is required' })
      .trim()
      .min(1, 'Product name is required')
      .max(200, 'Product name must not exceed 200 characters'),
    slug: z
      .string({ required_error: 'Product slug is required' })
      .trim()
      .min(1, 'Product slug is required')
      .max(220, 'Product slug must not exceed 220 characters')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe (lowercase letters, numbers, hyphens)'),
    product_code: z
      .string({ required_error: 'Product code is required' })
      .trim()
      .min(1, 'Product code is required')
      .max(100, 'Product code must not exceed 100 characters'),
    category_public_id: z.string().uuid('Invalid category identifier format'),
    short_description: z.string().trim().max(500).optional().nullable(),
    description: z.string().trim().optional().nullable(),
    material: z.string().trim().max(150).optional().nullable(),
    finish: z.string().trim().max(150).optional().nullable(),
    color: z.string().trim().max(100).optional().nullable(),
    features: z.any().optional().nullable(),
    sizes: z.any().optional().nullable(),
    customizable: z.boolean().optional(),
    featured: z.boolean().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    meta_data: z.any().optional().nullable(),
    seo_title: z.string().trim().max(255).optional().nullable(),
    seo_description: z.string().trim().optional().nullable(),
    model_3d_url: z.string().trim().max(500).optional().nullable(),
    ar_enabled: z.boolean().optional(),
  })
  .strict();

const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(220)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe')
      .optional(),
    product_code: z.string().trim().min(1).max(100).optional(),
    category_public_id: z.string().uuid('Invalid category identifier format').optional(),
    short_description: z.string().trim().max(500).optional().nullable(),
    description: z.string().trim().optional().nullable(),
    material: z.string().trim().max(150).optional().nullable(),
    finish: z.string().trim().max(150).optional().nullable(),
    color: z.string().trim().max(100).optional().nullable(),
    features: z.any().optional().nullable(),
    sizes: z.any().optional().nullable(),
    customizable: z.boolean().optional(),
    featured: z.boolean().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    meta_data: z.any().optional().nullable(),
    seo_title: z.string().trim().max(255).optional().nullable(),
    seo_description: z.string().trim().optional().nullable(),
    model_3d_url: z.string().trim().max(500).optional().nullable(),
    ar_enabled: z.boolean().optional(),
  })
  .strict();

const productQuerySchema = z.object({
  search: z.string().trim().optional(),
  category_public_id: z.string().uuid().optional(),
  category_slug: z.string().trim().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  featured: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true' || val === '1')),
  customizable: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true' || val === '1')),
  sort: z.enum(['name', 'created_at', 'status', '-name', '-created_at', '-status']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
};
