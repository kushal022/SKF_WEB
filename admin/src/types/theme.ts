export type ThemeStatus = 'draft' | 'published' | 'archived';

export interface ThemeColors {
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  surface_color?: string | null;
  text_color?: string | null;
  muted_text_color?: string | null;
  border_color?: string | null;
  success_color?: string | null;
  warning_color?: string | null;
  error_color?: string | null;
}

export interface ThemeTypography {
  heading_font?: string | null;
  body_font?: string | null;
  heading_weight?: string | null;
  body_weight?: string | null;
}

export interface ThemeStyles {
  border_radius?: string | null;
  button_style?: string | null;
  card_style?: string | null;
}

export interface ThemeSetting extends ThemeColors, ThemeTypography, ThemeStyles {
  public_id: string;
  name: string;
  status: ThemeStatus;
  version: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateThemePayload extends ThemeColors, ThemeTypography, ThemeStyles {
  name: string;
  status?: ThemeStatus;
}

export interface UpdateThemePayload extends ThemeColors, ThemeTypography, ThemeStyles {
  name?: string;
  status?: ThemeStatus;
}

export interface ThemePresetConfig extends ThemeColors, ThemeTypography, ThemeStyles {
  [key: string]: any;
}

export interface ThemePreset {
  public_id: string;
  name: string;
  description?: string | null;
  theme_config: ThemePresetConfig;
  preview_image?: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateThemePresetPayload {
  name: string;
  description?: string | null;
  theme_config: ThemePresetConfig;
  preview_image?: string | null;
  is_system?: boolean;
}

export interface UpdateThemePresetPayload {
  name?: string;
  description?: string | null;
  theme_config?: ThemePresetConfig;
  preview_image?: string | null;
  is_system?: boolean;
}

export interface ApplyThemePresetPayload {
  theme_public_id?: string | null;
}

export interface ThemeListResponseData {
  themes: ThemeSetting[];
}

export interface ThemeDetailResponseData {
  theme: ThemeSetting;
}

export interface ThemePresetListResponseData {
  presets: ThemePreset[];
}

export interface ThemePresetDetailResponseData {
  preset: ThemePreset;
}
