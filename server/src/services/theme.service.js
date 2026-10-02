const ApiError = require('../utils/ApiError');
const ThemeSetting = require('../models/ThemeSetting');
const ThemePreset = require('../models/ThemePreset');
const WebsiteSetting = require('../models/WebsiteSetting');
const auditService = require('./audit.service');

/**
 * Format theme setting into safe public/admin representation.
 */
const sanitizeTheme = (theme) => {
  if (!theme) return null;

  return {
    public_id: theme.public_id,
    name: theme.name,
    primary_color: theme.primary_color || null,
    secondary_color: theme.secondary_color || null,
    accent_color: theme.accent_color || null,
    background_color: theme.background_color || null,
    surface_color: theme.surface_color || null,
    text_color: theme.text_color || null,
    muted_text_color: theme.muted_text_color || null,
    border_color: theme.border_color || null,
    success_color: theme.success_color || null,
    warning_color: theme.warning_color || null,
    error_color: theme.error_color || null,
    heading_font: theme.heading_font || null,
    body_font: theme.body_font || null,
    heading_weight: theme.heading_weight || null,
    body_weight: theme.body_weight || null,
    border_radius: theme.border_radius || null,
    button_style: theme.button_style || null,
    card_style: theme.card_style || null,
    status: theme.status,
    version: theme.version,
    published_at: theme.published_at || null,
    created_at: theme.created_at,
    updated_at: theme.updated_at,
  };
};

/**
 * Format theme preset into safe representation.
 */
const sanitizeThemePreset = (preset) => {
  if (!preset) return null;

  return {
    public_id: preset.public_id,
    name: preset.name,
    description: preset.description || null,
    theme_config: preset.theme_config,
    preview_image: preset.preview_image || null,
    is_system: Boolean(preset.is_system),
    created_at: preset.created_at,
    updated_at: preset.updated_at,
  };
};

/**
 * List all theme configurations (Admin).
 */
const getThemes = async () => {
  const themes = await ThemeSetting.query().orderBy('created_at', 'desc');
  return themes.map(sanitizeTheme);
};

/**
 * Get specific theme configuration by public_id.
 */
const getThemeByPublicId = async (publicId) => {
  const theme = await ThemeSetting.query().where({ public_id: publicId }).first();
  if (!theme) {
    throw new ApiError(404, 'Theme not found', 'THEME_NOT_FOUND');
  }
  return sanitizeTheme(theme);
};

/**
 * Create a new theme configuration.
 */
const createTheme = async (data, req) => {
  const theme = await ThemeSetting.query().insertAndFetch({
    ...data,
    created_by: req?.user?.id || null,
    status: data.status || 'draft',
  });

  await auditService.logRequestAction(req, {
    action: 'CREATE_THEME',
    entityType: 'ThemeSetting',
    entityId: theme.id,
    newValues: sanitizeTheme(theme),
  });

  return sanitizeTheme(theme);
};

/**
 * Update an existing theme configuration.
 */
const updateTheme = async (publicId, data, req) => {
  const theme = await ThemeSetting.query().where({ public_id: publicId }).first();
  if (!theme) {
    throw new ApiError(404, 'Theme not found', 'THEME_NOT_FOUND');
  }

  const oldValues = sanitizeTheme(theme);

  const updatedTheme = await ThemeSetting.query().patchAndFetchById(theme.id, {
    ...data,
    version: theme.version + 1,
  });

  await auditService.logRequestAction(req, {
    action: 'UPDATE_THEME',
    entityType: 'ThemeSetting',
    entityId: theme.id,
    oldValues,
    newValues: sanitizeTheme(updatedTheme),
  });

  return sanitizeTheme(updatedTheme);
};

/**
 * Publish a theme, archive any previously published theme, and update website_settings.active_theme_id.
 * Atomic transaction ensures consistency.
 */
const publishTheme = async (publicId, req) => {
  const theme = await ThemeSetting.query().where({ public_id: publicId }).first();
  if (!theme) {
    throw new ApiError(404, 'Theme not found', 'THEME_NOT_FOUND');
  }

  const result = await ThemeSetting.transaction(async (trx) => {
    // 1. Archive previously published themes
    await ThemeSetting.query(trx)
      .where('status', 'published')
      .whereNot('id', theme.id)
      .patch({ status: 'archived' });

    // 2. Publish target theme
    const publishedTheme = await ThemeSetting.query(trx).patchAndFetchById(theme.id, {
      status: 'published',
      published_at: new Date(),
      version: theme.version + 1,
    });

    // 3. Update active theme reference in website_settings
    let settings = await WebsiteSetting.query(trx).first();
    if (settings) {
      await WebsiteSetting.query(trx).patchAndFetchById(settings.id, {
        active_theme_id: theme.id,
      });
    } else {
      await WebsiteSetting.query(trx).insert({
        site_name: 'SKF Stainless Steel Furniture',
        active_theme_id: theme.id,
      });
    }

    return publishedTheme;
  });

  await auditService.logRequestAction(req, {
    action: 'PUBLISH_THEME',
    entityType: 'ThemeSetting',
    entityId: theme.id,
    metadata: { published_theme_public_id: publicId },
  });

  return sanitizeTheme(result);
};

/**
 * Retrieves the currently active published theme configuration for public frontend consumption.
 */
const getPublicActiveTheme = async () => {
  // First check active theme configured in website_settings
  const settings = await WebsiteSetting.query().withGraphFetched('activeTheme').first();
  let theme = settings?.activeTheme;

  // Fallback to any published theme
  if (!theme) {
    theme = await ThemeSetting.query().where({ status: 'published' }).first();
  }

  // Fallback to latest theme
  if (!theme) {
    theme = await ThemeSetting.query().orderBy('created_at', 'desc').first();
  }

  if (!theme) {
    // Sensible default stainless steel luxury aesthetic
    return {
      name: 'Default Luxury Steel',
      primary_color: '#1a1a1a',
      secondary_color: '#d4af37',
      accent_color: '#c0c0c0',
      background_color: '#ffffff',
      surface_color: '#f8f9fa',
      text_color: '#111827',
      muted_text_color: '#6b7280',
      border_color: '#e5e7eb',
      heading_font: 'Cinzel, serif',
      body_font: 'Plus Jakarta Sans, sans-serif',
      border_radius: '8px',
      button_style: 'rounded',
      card_style: 'elevated',
    };
  }

  return {
    public_id: theme.public_id,
    name: theme.name,
    primary_color: theme.primary_color,
    secondary_color: theme.secondary_color,
    accent_color: theme.accent_color,
    background_color: theme.background_color,
    surface_color: theme.surface_color,
    text_color: theme.text_color,
    muted_text_color: theme.muted_text_color,
    border_color: theme.border_color,
    success_color: theme.success_color,
    warning_color: theme.warning_color,
    error_color: theme.error_color,
    heading_font: theme.heading_font,
    body_font: theme.body_font,
    heading_weight: theme.heading_weight,
    body_weight: theme.body_weight,
    border_radius: theme.border_radius,
    button_style: theme.button_style,
    card_style: theme.card_style,
    version: theme.version,
  };
};

/**
 * List all theme presets (Admin).
 */
const getThemePresets = async () => {
  const presets = await ThemePreset.query()
    .orderBy('is_system', 'desc')
    .orderBy('created_at', 'desc');
  return presets.map(sanitizeThemePreset);
};

/**
 * Get specific theme preset by public_id.
 */
const getThemePresetByPublicId = async (publicId) => {
  const preset = await ThemePreset.query().where({ public_id: publicId }).first();
  if (!preset) {
    throw new ApiError(404, 'Theme preset not found', 'PRESET_NOT_FOUND');
  }
  return sanitizeThemePreset(preset);
};

/**
 * Create a new theme preset.
 */
const createThemePreset = async (data, req) => {
  const preset = await ThemePreset.query().insertAndFetch({
    ...data,
    created_by: req?.user?.id || null,
  });

  await auditService.logRequestAction(req, {
    action: 'CREATE_THEME_PRESET',
    entityType: 'ThemePreset',
    entityId: preset.id,
    newValues: sanitizeThemePreset(preset),
  });

  return sanitizeThemePreset(preset);
};

/**
 * Update an existing theme preset.
 */
const updateThemePreset = async (publicId, data, req) => {
  const preset = await ThemePreset.query().where({ public_id: publicId }).first();
  if (!preset) {
    throw new ApiError(404, 'Theme preset not found', 'PRESET_NOT_FOUND');
  }

  const oldValues = sanitizeThemePreset(preset);
  const updatedPreset = await ThemePreset.query().patchAndFetchById(preset.id, data);

  await auditService.logRequestAction(req, {
    action: 'UPDATE_THEME_PRESET',
    entityType: 'ThemePreset',
    entityId: preset.id,
    oldValues,
    newValues: sanitizeThemePreset(updatedPreset),
  });

  return sanitizeThemePreset(updatedPreset);
};

/**
 * Apply a theme preset to a target theme or create a new theme from it.
 */
const applyThemePreset = async (presetPublicId, { theme_public_id } = {}, req) => {
  const preset = await ThemePreset.query().where({ public_id: presetPublicId }).first();
  if (!preset) {
    throw new ApiError(404, 'Theme preset not found', 'PRESET_NOT_FOUND');
  }

  const config = typeof preset.theme_config === 'string'
    ? JSON.parse(preset.theme_config)
    : preset.theme_config;

  let targetTheme;
  if (theme_public_id) {
    targetTheme = await ThemeSetting.query().where({ public_id: theme_public_id }).first();
    if (!targetTheme) {
      throw new ApiError(404, 'Target theme not found', 'THEME_NOT_FOUND');
    }
  } else {
    // Apply to current published theme, or create a new theme from preset
    targetTheme = await ThemeSetting.query().where({ status: 'published' }).first();
  }

  let result;
  if (targetTheme) {
    result = await ThemeSetting.query().patchAndFetchById(targetTheme.id, {
      ...config,
      version: targetTheme.version + 1,
    });
  } else {
    result = await ThemeSetting.query().insertAndFetch({
      name: `${preset.name} Theme`,
      ...config,
      status: 'draft',
      created_by: req?.user?.id || null,
    });
  }

  await auditService.logRequestAction(req, {
    action: 'APPLY_THEME_PRESET',
    entityType: 'ThemeSetting',
    entityId: result.id,
    metadata: {
      preset_public_id: presetPublicId,
      theme_public_id: result.public_id,
    },
  });

  return sanitizeTheme(result);
};

module.exports = {
  getThemes,
  getThemeByPublicId,
  createTheme,
  updateTheme,
  publishTheme,
  getPublicActiveTheme,
  getThemePresets,
  getThemePresetByPublicId,
  createThemePreset,
  updateThemePreset,
  applyThemePreset,
};
