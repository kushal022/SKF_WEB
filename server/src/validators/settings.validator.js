const { z } = require('zod');

/**
 * Validator for updating website settings
 */
const updateSettingsSchema = z
  .object({
    site_name: z
      .string()
      .trim()
      .min(1, 'Site name cannot be empty')
      .max(150, 'Site name must not exceed 150 characters')
      .optional(),
    tagline: z.string().trim().max(255).optional().nullable(),
    logo_url: z.string().trim().max(500).optional().nullable(),
    favicon_url: z.string().trim().max(500).optional().nullable(),
    phone: z.string().trim().max(20).optional().nullable(),
    whatsapp_number: z.string().trim().max(20).optional().nullable(),
    email: z.string().trim().email('Invalid email address format').max(255).optional().nullable(),
    address: z.string().trim().optional().nullable(),
    business_hours: z.any().optional().nullable(),
    social_links: z.any().optional().nullable(),
    seo_defaults: z.any().optional().nullable(),
    active_theme_public_id: z.string().uuid('Invalid active theme identifier').optional().nullable(),
  })
  .strict(); // Rejects forbidden database fields like id, public_id, created_at, updated_at

module.exports = {
  updateSettingsSchema,
};
