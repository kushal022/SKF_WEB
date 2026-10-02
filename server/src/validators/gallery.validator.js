const { z } = require('zod');

const createGallerySchema = z
  .object({
    title: z
      .string({ required_error: 'Gallery title is required' })
      .trim()
      .min(1, 'Gallery title is required')
      .max(200, 'Gallery title must not exceed 200 characters'),
    slug: z
      .string({ required_error: 'Gallery slug is required' })
      .trim()
      .min(1, 'Gallery slug is required')
      .max(220, 'Gallery slug must not exceed 220 characters')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe (lowercase letters, numbers, hyphens)'),
    category: z.string().trim().max(100).optional().nullable(),
    description: z.string().trim().optional().nullable(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  })
  .strict();

const updateGallerySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(220)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe')
      .optional(),
    category: z.string().trim().max(100).optional().nullable(),
    description: z.string().trim().optional().nullable(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  })
  .strict();

const createGalleryImageSchema = z
  .object({
    image_url: z
      .string({ required_error: 'Image URL is required' })
      .url('Invalid image URL')
      .max(500),
    cloudinary_public_id: z.string().trim().max(255).optional().nullable(),
    alt_text: z.string().trim().max(255).optional().nullable(),
    sort_order: z.number().int().optional(),
  })
  .strict();

const updateGalleryImageSchema = z
  .object({
    image_url: z.string().url('Invalid image URL').max(500).optional(),
    cloudinary_public_id: z.string().trim().max(255).optional().nullable(),
    alt_text: z.string().trim().max(255).optional().nullable(),
    sort_order: z.number().int().optional(),
  })
  .strict();

const galleryParamSchema = z.object({
  publicId: z.string().uuid('Invalid gallery identifier format'),
});

const galleryAndImageParamSchema = z.object({
  publicId: z.string().uuid('Invalid gallery identifier format'),
  imagePublicId: z.string().uuid('Invalid image identifier format'),
});

module.exports = {
  createGallerySchema,
  updateGallerySchema,
  createGalleryImageSchema,
  updateGalleryImageSchema,
  galleryParamSchema,
  galleryAndImageParamSchema,
};
