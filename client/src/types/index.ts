export interface Category {
  public_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  parent?: {
    public_id: string;
    name: string;
    slug: string;
  } | null;
  children?: Category[];
}

export interface ProductImage {
  public_id: string;
  image_url: string;
  alt_text: string | null;
  image_type?: string | null;
  sort_order: number;
  is_primary?: boolean;
}

export interface ProductSpec {
  public_id: string;
  spec_name: string;
  spec_value: string;
  sort_order: number;
}

export interface ProductVideo {
  public_id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  public_id: string;
  name: string;
  slug: string;
  product_code: string;
  short_description: string | null;
  description?: string | null;
  material: string | null;
  finish: string | null;
  color: string | null;
  features: string[] | null;
  sizes: string[] | null;
  customizable: boolean;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
  category: {
    public_id: string;
    name: string;
    slug: string;
  } | null;
  primary_image: {
    public_id: string;
    image_url: string;
    alt_text: string | null;
  } | null;
  images?: ProductImage[];
  videos?: ProductVideo[];
  specs?: ProductSpec[];
  seo_title?: string | null;
  seo_description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GalleryItem {
  public_id: string;
  title: string;
  slug: string;
  category: string | null;
  description: string | null;
  status: string;
  images?: Array<{
    public_id: string;
    image_url: string;
    alt_text: string | null;
    sort_order: number;
  }>;
  created_at?: string;
}

export interface Review {
  public_id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  is_featured: boolean;
  product?: {
    public_id: string;
    name: string;
    slug: string;
  } | null;
  created_at?: string;
}

export interface BusinessHoursDay {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface WebsiteSettings {
  site_name: string;
  tagline: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  address: string | null;
  business_hours: {
    schedule?: string;
    monday?: BusinessHoursDay;
    sunday?: BusinessHoursDay;
    [key: string]: unknown;
  } | null;
  social_links: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
    website?: string;
    [key: string]: unknown;
  } | null;
  seo_defaults: {
    title?: string;
    meta_title?: string;
    description?: string;
    keywords?: string;
  } | null;
  active_theme?: {
    public_id: string;
    name: string;
    primary_color?: string | null;
    secondary_color?: string | null;
    accent_color?: string | null;
    background_color?: string | null;
    surface_color?: string | null;
    text_color?: string | null;
  } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface EnquiryPayload {
  customer_name: string;
  phone: string;
  email?: string | null;
  product_id?: string | null;
  product_public_id?: string | null;
  source?: string | null;
  message?: string | null;
}

export interface CustomRequestImage {
  image_url: string;
  cloudinary_public_id?: string | null;
  sort_order?: number;
}

export interface CustomRequestPayload {
  product_type: string;
  width?: number | string | null;
  length?: number | string | null;
  height?: number | string | null;
  dimension_unit?: string | null;
  material?: string | null;
  finish?: string | null;
  quantity?: number;
  customer_name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  requirement?: string | null;
  estimated_amount?: number | string | null;
  images?: CustomRequestImage[];
}

export interface CustomRequestResponse {
  public_id: string;
  product_type: string;
  customer_name: string;
  phone: string;
  status: string;
  created_at: string;
}

export interface EstimatorRule {
  public_id: string;
  name: string;
  product_type: string | null;
  material: string | null;
  finish: string | null;
  dimension_multiplier: number | null;
  material_rate: number | null;
  finish_adjustment: number | null;
  base_rate: number | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstimatorCalculatePayload {
  product_type?: string | null;
  width: number;
  length: number;
  height?: number;
  dimension_unit: 'mm' | 'cm' | 'in' | 'ft' | 'm';
  material?: string | null;
  finish?: string | null;
  quantity?: number;
}

export interface EstimatorCalculationResult {
  is_estimate: boolean;
  disclaimer: string;
  matched_rule: {
    public_id: string;
    name: string;
  } | null;
  unit_estimate: number;
  total_estimate: number;
  quantity: number;
  currency: string;
}

export interface QuotationItemProduct {
  name: string;
  slug: string;
  product_code?: string;
}

export interface QuotationItem {
  public_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  customization_amount: number;
  discount_amount: number;
  line_total: number;
  product?: QuotationItemProduct | null;
  metadata?: unknown;
}

export interface QuotationDetail {
  public_id: string;
  quotation_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  subtotal: number;
  customization_amount: number;
  transport_amount: number;
  installation_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  valid_until?: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  notes?: string | null;
  items: QuotationItem[];
  created_at: string;
  updated_at?: string;
}

export interface ReviewPayload {
  customer_name: string;
  rating: number;
  review_text: string;
  product_public_id?: string | null;
}

