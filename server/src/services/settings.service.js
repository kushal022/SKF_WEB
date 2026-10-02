const ApiError = require('../utils/ApiError');
const WebsiteSetting = require('../models/WebsiteSetting');
const ThemeSetting = require('../models/ThemeSetting');
const auditService = require('./audit.service');

/**
 * Format raw website setting into safe public/admin representation.
 */
const sanitizeWebsiteSetting = (setting) => {
  if (!setting) return null;

  return {
    public_id: setting.public_id,
    site_name: setting.site_name,
    tagline: setting.tagline || null,
    logo_url: setting.logo_url || null,
    favicon_url: setting.favicon_url || null,
    phone: setting.phone || null,
    whatsapp_number: setting.whatsapp_number || null,
    email: setting.email || null,
    address: setting.address || null,
    business_hours: setting.business_hours || null,
    social_links: setting.social_links || null,
    seo_defaults: setting.seo_defaults || null,
    active_theme: setting.activeTheme
      ? {
          public_id: setting.activeTheme.public_id,
          name: setting.activeTheme.name,
          status: setting.activeTheme.status,
          primary_color: setting.activeTheme.primary_color || null,
          secondary_color: setting.activeTheme.secondary_color || null,
          accent_color: setting.activeTheme.accent_color || null,
          background_color: setting.activeTheme.background_color || null,
          surface_color: setting.activeTheme.surface_color || null,
          text_color: setting.activeTheme.text_color || null,
        }
      : null,
    updated_at: setting.updated_at,
  };
};

/**
 * Retrieves the current website settings, initializing default if not yet created.
 */
const getWebsiteSettings = async () => {
  let setting = await WebsiteSetting.query()
    .withGraphFetched('activeTheme')
    .first();

  if (!setting) {
    setting = await WebsiteSetting.query().insertAndFetch({
      site_name: 'SKF Stainless Steel Furniture',
      tagline: 'Premium Stainless Steel Craftsmanship',
    });
  }

  return sanitizeWebsiteSetting(setting);
};

/**
 * Updates website settings and logs an audit trail entry.
 */
const updateWebsiteSettings = async (updateData, req) => {
  let setting = await WebsiteSetting.query().first();

  if (!setting) {
    setting = await WebsiteSetting.query().insertAndFetch({
      site_name: 'SKF Stainless Steel Furniture',
    });
  }

  const patchPayload = { ...updateData };

  // Resolve active_theme_public_id to internal ID if provided
  if (updateData.active_theme_public_id !== undefined) {
    delete patchPayload.active_theme_public_id;
    if (updateData.active_theme_public_id === null) {
      patchPayload.active_theme_id = null;
    } else {
      const theme = await ThemeSetting.query()
        .where({ public_id: updateData.active_theme_public_id })
        .first();

      if (!theme) {
        throw new ApiError(404, 'Theme referenced in active_theme_public_id not found', 'THEME_NOT_FOUND');
      }
      patchPayload.active_theme_id = theme.id;
    }
  }

  const oldValues = {
    site_name: setting.site_name,
    tagline: setting.tagline,
    phone: setting.phone,
    email: setting.email,
    active_theme_id: setting.active_theme_id,
  };

  const updated = await WebsiteSetting.query()
    .patchAndFetchById(setting.id, patchPayload)
    .withGraphFetched('activeTheme');

  // Record audit log
  await auditService.logRequestAction(req, {
    action: 'UPDATE_WEBSITE_SETTINGS',
    entityType: 'WebsiteSetting',
    entityId: updated.id,
    oldValues,
    newValues: patchPayload,
    metadata: { fields_updated: Object.keys(updateData) },
  });

  return sanitizeWebsiteSetting(updated);
};

/**
 * Retrieves public-safe website configuration for frontend consumption.
 */
const getPublicWebsiteSettings = async () => {
  const settings = await getWebsiteSettings();

  return {
    site_name: settings.site_name,
    tagline: settings.tagline,
    logo_url: settings.logo_url,
    favicon_url: settings.favicon_url,
    phone: settings.phone,
    whatsapp_number: settings.whatsapp_number,
    email: settings.email,
    address: settings.address,
    business_hours: settings.business_hours,
    social_links: settings.social_links,
    seo_defaults: settings.seo_defaults,
    active_theme: settings.active_theme,
  };
};

module.exports = {
  getWebsiteSettings,
  updateWebsiteSettings,
  getPublicWebsiteSettings,
};
