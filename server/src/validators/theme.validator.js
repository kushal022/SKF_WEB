const { z } = require('zod');

const colorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const colorField = z
  .string()
  .trim()
  .max(20)
  .optional()
  .nullable();

const createThemeSchema = z
  .object({
    name: z
      .string({ required_error: 'Theme name is required' })
      .trim()
      .min(1, 'Theme name is required')
      .max(150, 'Theme name must not exceed 150 characters'),
    primary_color: colorField,
    secondary_color: colorField,
    accent_color: colorField,
    background_color: colorField,
    surface_color: colorField,
    text_color: colorField,
    muted_text_color: colorField,
    border_color: colorField,
    success_color: colorField,
    warning_color: colorField,
    error_color: colorField,
    heading_font: z.string().trim().max(100).optional().nullable(),
    body_font: z.string().trim().max(100).optional().nullable(),
    heading_weight: z.string().trim().max(20).optional().nullable(),
    body_weight: z.string().trim().max(20).optional().nullable(),
    border_radius: z.string().trim().max(30).optional().nullable(),
    button_style: z.string().trim().max(50).optional().nullable(),
    card_style: z.string().trim().max(50).optional().nullable(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  })
  .strict();

const updateThemeSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    primary_color: colorField,
    secondary_color: colorField,
    accent_color: colorField,
    background_color: colorField,
    surface_color: colorField,
    text_color: colorField,
    muted_text_color: colorField,
    border_color: colorField,
    success_color: colorField,
    warning_color: colorField,
    error_color: colorField,
    heading_font: z.string().trim().max(100).optional().nullable(),
    body_font: z.string().trim().max(100).optional().nullable(),
    heading_weight: z.string().trim().max(20).optional().nullable(),
    body_weight: z.string().trim().max(20).optional().nullable(),
    border_radius: z.string().trim().max(30).optional().nullable(),
    button_style: z.string().trim().max(50).optional().nullable(),
    card_style: z.string().trim().max(50).optional().nullable(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  })
  .strict();

const createThemePresetSchema = z
  .object({
    name: z
      .string({ required_error: 'Preset name is required' })
      .trim()
      .min(1, 'Preset name is required')
      .max(150, 'Preset name must not exceed 150 characters'),
    description: z.string().trim().optional().nullable(),
    theme_config: z.record(z.any(), { required_error: 'theme_config must be an object' }),
    preview_image: z.string().trim().max(500).optional().nullable(),
    is_system: z.boolean().optional(),
  })
  .strict();

const updateThemePresetSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().optional().nullable(),
    theme_config: z.record(z.any()).optional(),
    preview_image: z.string().trim().max(500).optional().nullable(),
    is_system: z.boolean().optional(),
  })
  .strict();

const applyThemePresetSchema = z
  .object({
    theme_public_id: z.string().uuid('Invalid theme identifier').optional().nullable(),
  })
  .strict();

const publicIdParamSchema = z.object({
  publicId: z.string().uuid('Invalid identifier format'),
});

module.exports = {
  createThemeSchema,
  updateThemeSchema,
  createThemePresetSchema,
  updateThemePresetSchema,
  applyThemePresetSchema,
  publicIdParamSchema,
};
