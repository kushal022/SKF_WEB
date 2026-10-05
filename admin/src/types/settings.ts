export interface ThemeSummary {
  public_id: string;
  name: string;
  status: string;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  surface_color?: string | null;
  text_color?: string | null;
}

export interface WebsiteSettings {
  public_id?: string;
  site_name: string;
  tagline?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
  email?: string | null;
  address?: string | null;
  business_hours?: Record<string, string> | string | null;
  social_links?: Record<string, string> | null;
  seo_defaults?: Record<string, string> | null;
  active_theme?: ThemeSummary | null;
  updated_at?: string;
}

export interface UpdateWebsiteSettingsPayload {
  site_name?: string;
  tagline?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
  email?: string | null;
  address?: string | null;
  business_hours?: Record<string, string> | string | null;
  social_links?: Record<string, string> | null;
  seo_defaults?: Record<string, string> | null;
  active_theme_public_id?: string | null;
}

export interface SettingsResponseData {
  settings: WebsiteSettings;
}
