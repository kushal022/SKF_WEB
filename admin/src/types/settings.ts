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

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface BusinessHoursSchedule {
  schedule?: string;
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
  [key: string]: any;
}

export interface SocialLinksData {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  whatsapp?: string;
  website?: string;
  google_business?: string;
  twitter?: string;
  linkedin?: string;
  pinterest?: string;
  [key: string]: any;
}

export interface SeoDefaultsData {
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical_url?: string;
  twitter_card?: string;
  twitter_site?: string;
  [key: string]: any;
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
  business_hours?: BusinessHoursSchedule | Record<string, any> | string | null;
  social_links?: SocialLinksData | Record<string, any> | null;
  seo_defaults?: SeoDefaultsData | Record<string, any> | null;
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
  business_hours?: BusinessHoursSchedule | Record<string, any> | string | null;
  social_links?: SocialLinksData | Record<string, any> | null;
  seo_defaults?: SeoDefaultsData | Record<string, any> | null;
  active_theme_public_id?: string | null;
}

export interface SettingsResponseData {
  settings: WebsiteSettings;
}
