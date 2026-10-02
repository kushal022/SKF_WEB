const { z } = require('zod');

const createImageSchema = z
  .object({
    image_url: z
      .string({ required_error: 'image_url is required' })
      .trim()
      .min(1, 'image_url cannot be empty')
      .max(500, 'image_url must not exceed 500 characters'),
    public_cloudinary_id: z.string().trim().max(255).optional().nullable(),
    alt_text: z.string().trim().max(255).optional().nullable(),
    image_type: z.string().trim().max(50).optional().nullable(),
    sort_order: z.number().int().optional(),
    is_primary: z.boolean().optional(),
  })
  .strict();

const updateImageSchema = z
  .object({
    image_url: z.string().trim().min(1).max(500).optional(),
    public_cloudinary_id: z.string().trim().max(255).optional().nullable(),
    alt_text: z.string().trim().max(255).optional().nullable(),
    image_type: z.string().trim().max(50).optional().nullable(),
    sort_order: z.number().int().optional(),
    is_primary: z.boolean().optional(),
  })
  .strict();

const reorderImagesSchema = z
  .object({
    items: z
      .array(
        z.object({
          public_id: z.string().uuid('Invalid image identifier format'),
          sort_order: z.number().int(),
        })
      )
      .min(1, 'At least one image order item is required'),
  })
  .strict();

const createVideoSchema = z
  .object({
    video_url: z
      .string({ required_error: 'video_url is required' })
      .trim()
      .min(1, 'video_url cannot be empty')
      .max(500, 'video_url must not exceed 500 characters'),
    thumbnail_url: z.string().trim().max(500).optional().nullable(),
    title: z.string().trim().max(200).optional().nullable(),
    sort_order: z.number().int().optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

const updateVideoSchema = z
  .object({
    video_url: z.string().trim().min(1).max(500).optional(),
    thumbnail_url: z.string().trim().max(500).optional().nullable(),
    title: z.string().trim().max(200).optional().nullable(),
    sort_order: z.number().int().optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

const createSpecSchema = z
  .object({
    spec_name: z
      .string({ required_error: 'spec_name is required' })
      .trim()
      .min(1, 'spec_name cannot be empty')
      .max(150, 'spec_name must not exceed 150 characters'),
    spec_value: z
      .string({ required_error: 'spec_value is required' })
      .trim()
      .min(1, 'spec_value cannot be empty')
      .max(500, 'spec_value must not exceed 500 characters'),
    sort_order: z.number().int().optional(),
  })
  .strict();

const updateSpecSchema = z
  .object({
    spec_name: z.string().trim().min(1).max(150).optional(),
    spec_value: z.string().trim().min(1).max(500).optional(),
    sort_order: z.number().int().optional(),
  })
  .strict();

const productAndMediaParamSchema = z.object({
  publicId: z.string().uuid('Invalid product identifier format'),
  mediaPublicId: z.string().uuid('Invalid media identifier format').optional(),
  imagePublicId: z.string().uuid('Invalid image identifier format').optional(),
  videoPublicId: z.string().uuid('Invalid video identifier format').optional(),
  specPublicId: z.string().uuid('Invalid spec identifier format').optional(),
});

module.exports = {
  createImageSchema,
  updateImageSchema,
  reorderImagesSchema,
  createVideoSchema,
  updateVideoSchema,
  createSpecSchema,
  updateSpecSchema,
  productAndMediaParamSchema,
};
