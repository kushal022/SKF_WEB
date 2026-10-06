import { config } from './config';
import type {
  Category,
  Product,
  GalleryItem,
  Review,
  WebsiteSettings,
  PaginatedResult,
  EnquiryPayload,
  CustomRequestPayload,
  CustomRequestResponse,
  EstimatorRule,
  EstimatorCalculatePayload,
  EstimatorCalculationResult,
  QuotationDetail,
  ReviewPayload,
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

/**
 * Submit custom furniture request
 */
export async function submitCustomRequest(payload: CustomRequestPayload): Promise<CustomRequestResponse> {
  const body: Record<string, unknown> = {
    product_type: payload.product_type.trim(),
    customer_name: payload.customer_name.trim(),
    phone: payload.phone.trim(),
    quantity: Math.max(1, payload.quantity || 1),
  };

  if (payload.width !== undefined && payload.width !== null && payload.width !== '') {
    body.width = Number(payload.width) || payload.width;
  }
  if (payload.length !== undefined && payload.length !== null && payload.length !== '') {
    body.length = Number(payload.length) || payload.length;
  }
  if (payload.height !== undefined && payload.height !== null && payload.height !== '') {
    body.height = Number(payload.height) || payload.height;
  }
  if (payload.dimension_unit?.trim()) body.dimension_unit = payload.dimension_unit.trim();
  if (payload.material?.trim()) body.material = payload.material.trim();
  if (payload.finish?.trim()) body.finish = payload.finish.trim();
  if (payload.email?.trim()) body.email = payload.email.trim();
  if (payload.city?.trim()) body.city = payload.city.trim();
  if (payload.requirement?.trim()) body.requirement = payload.requirement.trim();
  if (payload.estimated_amount !== undefined && payload.estimated_amount !== null && payload.estimated_amount !== '') {
    body.estimated_amount = Number(payload.estimated_amount) || payload.estimated_amount;
  }
  if (Array.isArray(payload.images) && payload.images.length > 0) {
    body.images = payload.images.map((img, i) => ({
      image_url: img.image_url.trim(),
      cloudinary_public_id: img.cloudinary_public_id?.trim() || null,
      sort_order: img.sort_order ?? i,
    }));
  }

  const data = await fetchApi<CustomRequestResponse>('/custom-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return data;
}

/**
 * Fetch active public estimator rules
 */
export async function getEstimatorRules(): Promise<EstimatorRule[]> {
  try {
    const data = await fetchApi<EstimatorRule[]>('/estimator/rules');
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[API] getEstimatorRules error:', err);
    return [];
  }
}

/**
 * Calculate automated furniture price estimate
 */
export async function calculateEstimator(payload: EstimatorCalculatePayload): Promise<EstimatorCalculationResult> {
  const body: Record<string, unknown> = {
    width: Number(payload.width),
    length: Number(payload.length),
    height: payload.height !== undefined ? Number(payload.height) : 0,
    dimension_unit: payload.dimension_unit || 'mm',
    quantity: Math.max(1, payload.quantity || 1),
  };

  if (payload.product_type?.trim()) body.product_type = payload.product_type.trim();
  if (payload.material?.trim()) body.material = payload.material.trim();
  if (payload.finish?.trim()) body.finish = payload.finish.trim();

  const data = await fetchApi<EstimatorCalculationResult>('/estimator/calculate', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return data;
}

/**
 * Fetch public quotation by secure public UUID
 */
export async function getPublicQuotation(publicId: string): Promise<QuotationDetail> {
  const data = await fetchApi<{ quotation: QuotationDetail }>(`/quotations/${publicId}`);
  return data.quotation;
}

/**
 * Accept public quotation
 */
export async function acceptPublicQuotation(publicId: string): Promise<QuotationDetail> {
  const data = await fetchApi<{ quotation: QuotationDetail }>(`/quotations/${publicId}/accept`, {
    method: 'POST',
  });
  return data.quotation;
}

/**
 * Reject public quotation with optional reason
 */
export async function rejectPublicQuotation(publicId: string, reason?: string): Promise<QuotationDetail> {
  const data = await fetchApi<{ quotation: QuotationDetail }>(`/quotations/${publicId}/reject`, {
    method: 'POST',
    body: JSON.stringify(reason?.trim() ? { reason: reason.trim() } : {}),
  });
  return data.quotation;
}

/**
 * Submit public customer review (starts in pending state)
 */
export async function submitPublicReview(payload: ReviewPayload): Promise<{ public_id: string; customer_name: string }> {
  const body: Record<string, unknown> = {
    customer_name: payload.customer_name.trim(),
    rating: Math.max(1, Math.min(5, Math.round(payload.rating))),
    review_text: payload.review_text.trim(),
  };

  if (payload.product_public_id?.trim()) {
    body.product_public_id = payload.product_public_id.trim();
  }

  const data = await fetchApi<{ public_id: string; customer_name: string }>('/reviews', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return data;
}

