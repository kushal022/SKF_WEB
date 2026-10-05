import { config } from './config';
import type {
  Category,
  Product,
  GalleryItem,
  Review,
  WebsiteSettings,
  PaginatedResult,
  EnquiryPayload,
} from '@/types';

const API_BASE = config.apiBaseUrl;

/**
 * Standard fetch wrapper with timeout and error handling
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: options.cache ?? 'no-store',
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = json?.message || `API request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return json?.data as T;
}

/**
 * Fetch public website settings
 */
export async function getPublicSettings(): Promise<WebsiteSettings | null> {
  try {
    const data = await fetchApi<{ settings: WebsiteSettings }>('/settings/public');
    return data?.settings || null;
  } catch (err) {
    console.error('[API] getPublicSettings error:', err);
    return null;
  }
}

/**
 * Fetch public categories
 */
export async function getPublicCategories(params: {
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResult<Category>> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  try {
    const data = await fetchApi<PaginatedResult<Category>>(`/categories${qs ? `?${qs}` : ''}`);
    return data || { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  } catch (err) {
    console.error('[API] getPublicCategories error:', err);
    return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
}

/**
 * Fetch public products with multi-filter support
 */
export async function getPublicProducts(params: {
  category_slug?: string;
  category_public_id?: string;
  featured?: boolean;
  customizable?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResult<Product>> {
  const query = new URLSearchParams();
  if (params.category_slug) query.set('category_slug', params.category_slug);
  if (params.category_public_id) query.set('category_public_id', params.category_public_id);
  if (params.featured !== undefined) query.set('featured', String(params.featured));
  if (params.customizable !== undefined) query.set('customizable', String(params.customizable));
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  try {
    const data = await fetchApi<PaginatedResult<Product>>(`/products${qs ? `?${qs}` : ''}`);
    return data || { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  } catch (err) {
    console.error('[API] getPublicProducts error:', err);
    return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
}

/**
 * Fetch a single product by public UUID
 */
export async function getProductByPublicId(publicId: string): Promise<Product | null> {
  try {
    const data = await fetchApi<{ product: Product }>(`/products/${publicId}`);
    return data?.product || null;
  } catch (err) {
    console.error(`[API] getProductByPublicId(${publicId}) error:`, err);
    return null;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch a single product by slug or publicId
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (UUID_REGEX.test(slug)) {
    return getProductByPublicId(slug);
  }

  try {
    // Look up via search query matching the exact slug
    const results = await getPublicProducts({ search: slug, limit: 5 });
    const match = results.items.find((p) => p.slug === slug || p.slug.toLowerCase() === slug.toLowerCase());
    
    if (match) {
      // Fetch full details including specs, full gallery, etc.
      return await getProductByPublicId(match.public_id);
    }
    
    // Fallback: search all products if slug was not indexed directly
    if (results.items.length > 0) {
      return await getProductByPublicId(results.items[0].public_id);
    }

    return null;
  } catch (err) {
    console.error(`[API] getProductBySlug(${slug}) error:`, err);
    return null;
  }
}

/**
 * Fetch published galleries
 */
export async function getPublicGalleries(params: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResult<GalleryItem>> {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  try {
    const data = await fetchApi<PaginatedResult<GalleryItem>>(`/galleries${qs ? `?${qs}` : ''}`);
    return data || { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  } catch (err) {
    console.error('[API] getPublicGalleries error:', err);
    return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
}

/**
 * Fetch approved reviews
 */
export async function getPublicReviews(params: {
  product_id?: string;
  rating?: number;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResult<Review>> {
  const query = new URLSearchParams();
  if (params.product_id) query.set('product_id', params.product_id);
  if (params.rating) query.set('rating', String(params.rating));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  try {
    const data = await fetchApi<PaginatedResult<Review>>(`/reviews${qs ? `?${qs}` : ''}`);
    return data || { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  } catch (err) {
    console.error('[API] getPublicReviews error:', err);
    return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
}

/**
 * Submit customer enquiry
 */
export async function submitEnquiry(payload: EnquiryPayload): Promise<{ public_id: string; customer_name: string }> {
  // Clean payload to conform strictly with createEnquirySchema
  const body: Record<string, string | undefined> = {
    customer_name: payload.customer_name.trim(),
    phone: payload.phone.trim(),
  };

  if (payload.email?.trim()) body.email = payload.email.trim();
  if (payload.product_id) body.product_id = payload.product_id;
  if (payload.product_public_id) body.product_public_id = payload.product_public_id;
  if (payload.source?.trim()) body.source = payload.source.trim();
  if (payload.message?.trim()) body.message = payload.message.trim();

  const data = await fetchApi<{ public_id: string; customer_name: string }>('/enquiries', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return data;
}
