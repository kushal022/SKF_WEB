export interface CategoryItem {
  public_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  parent?: {
    public_id: string;
    name: string;
    slug: string;
  } | null;
  children?: {
    public_id: string;
    name: string;
    slug: string;
    image_url: string | null;
    sort_order: number;
    is_active: boolean;
  }[];
  created_at: string;
  updated_at: string;
}

export interface CategoryQueryParams {
  search?: string;
  parent_public_id?: string | null;
  is_active?: boolean;
  sort?: 'sort_order' | 'name' | 'created_at' | '-sort_order' | '-name' | '-created_at';
  page?: number;
  limit?: number;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  parent_public_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  parent_public_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface ProductListItem {
  public_id: string;
  name: string;
  slug: string;
  product_code: string;
  short_description: string | null;
  material: string | null;
  finish: string | null;
  color: string | null;
  features: string[] | Record<string, unknown> | null;
  sizes: string[] | Record<string, unknown> | null;
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
  created_at: string;
  updated_at: string;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  meta_data: Record<string, unknown> | null;
  seo_title: string | null;
  seo_description: string | null;
  model_3d_url: string | null;
  ar_enabled: boolean;
  images: ProductImageItem[];
  videos: ProductVideoItem[];
  specs: ProductSpecItem[];
}

export interface ProductQueryParams {
  search?: string;
  category_public_id?: string;
  category_slug?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  customizable?: boolean;
  sort?: 'name' | 'created_at' | 'status' | '-name' | '-created_at' | '-status';
  page?: number;
  limit?: number;
}

export interface CreateProductRequest {
  name: string;
  slug: string;
  product_code: string;
  category_public_id: string;
  short_description?: string | null;
  description?: string | null;
  material?: string | null;
  finish?: string | null;
  color?: string | null;
  features?: string[] | Record<string, unknown> | null;
  sizes?: string[] | Record<string, unknown> | null;
  customizable?: boolean;
  featured?: boolean;
  status?: 'draft' | 'published' | 'archived';
  meta_data?: Record<string, unknown> | null;
  seo_title?: string | null;
  seo_description?: string | null;
  model_3d_url?: string | null;
  ar_enabled?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  slug?: string;
  product_code?: string;
  category_public_id?: string;
  short_description?: string | null;
  description?: string | null;
  material?: string | null;
  finish?: string | null;
  color?: string | null;
  features?: string[] | Record<string, unknown> | null;
  sizes?: string[] | Record<string, unknown> | null;
  customizable?: boolean;
  featured?: boolean;
  status?: 'draft' | 'published' | 'archived';
  meta_data?: Record<string, unknown> | null;
  seo_title?: string | null;
  seo_description?: string | null;
  model_3d_url?: string | null;
  ar_enabled?: boolean;
}

export interface ProductImageItem {
  public_id: string;
  image_url: string;
  public_cloudinary_id?: string | null;
  alt_text: string | null;
  image_type: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateImageRequest {
  image_url: string;
  public_cloudinary_id?: string | null;
  alt_text?: string | null;
  image_type?: string | null;
  sort_order?: number;
  is_primary?: boolean;
}

export interface UpdateImageRequest {
  image_url?: string;
  public_cloudinary_id?: string | null;
  alt_text?: string | null;
  image_type?: string | null;
  sort_order?: number;
  is_primary?: boolean;
}

export interface ProductVideoItem {
  public_id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVideoRequest {
  video_url: string;
  thumbnail_url?: string | null;
  title?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateVideoRequest {
  video_url?: string;
  thumbnail_url?: string | null;
  title?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface ProductSpecItem {
  public_id: string;
  spec_name: string;
  spec_value: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSpecRequest {
  spec_name: string;
  spec_value: string;
  sort_order?: number;
}

export interface UpdateSpecRequest {
  spec_name?: string;
  spec_value?: string;
  sort_order?: number;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination?: PaginationMetadata;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}
