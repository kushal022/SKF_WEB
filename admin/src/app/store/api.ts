import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type BaseQueryApi,
} from '@reduxjs/toolkit/query/react';
import { config } from '../config';
import {
  updateAccessToken,
  setUser,
  logout,
  type AdminUser,
} from '../../features/auth/authSlice';
import { tokenStorage } from '../../services/apiClient';
import type {
  CategoryItem,
  CategoryQueryParams,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ProductListItem,
  ProductDetail,
  ProductQueryParams,
  CreateProductRequest,
  UpdateProductRequest,
  ProductImageItem,
  CreateImageRequest,
  UpdateImageRequest,
  ProductVideoItem,
  CreateVideoRequest,
  UpdateVideoRequest,
  ProductSpecItem,
  CreateSpecRequest,
  UpdateSpecRequest,
  PaginatedResult,
} from '../../types/catalog';

export * from '../../types/catalog';

import type {
  EnquiryListItem,
  EnquiryDetail,
  EnquiryNote,
  EnquiryFollowUp,
  EnquiryQueryParams,
  UpdateEnquiryRequest,
  UpdateEnquiryStatusRequest,
  CreateEnquiryNoteRequest,
  UpdateEnquiryNoteRequest,
  CreateFollowUpRequest,
  UpdateFollowUpRequest,
  PaginatedEnquiriesResult,
} from '../../types/enquiry';

export * from '../../types/enquiry';

import type {
  QuotationDetail,
  QuotationQueryParams,
  CreateQuotationPayload,
  UpdateQuotationPayload,
  UpdateQuotationStatusPayload,
  CreateQuotationItemPayload,
  UpdateQuotationItemPayload,
  PaginatedQuotationsResult,
} from '../../types/quotation';

export * from '../../types/quotation';

import type {
  EstimatorRule,
  CreateEstimatorRulePayload,
  UpdateEstimatorRulePayload,
  EstimatorQueryParams,
  PaginatedEstimatorRulesResult,
  CalculateEstimateRequest,
  CalculateEstimateResult,
} from '../../types/estimator';

export * from '../../types/estimator';

import type {
  CustomRequestDetail,
  CustomRequestImage,
  CustomRequestQueryParams,
  PaginatedCustomRequestsResult,
  UpdateCustomRequestPayload,
  UpdateCustomRequestStatusPayload,
  CreateCustomRequestImagePayload,
  UpdateCustomRequestImagePayload,
} from '../../types/customRequest';

export * from '../../types/customRequest';

import type {
  GalleryItem,
  GalleryImage,
  GalleryQueryParams,
  PaginatedGalleriesResult,
  CreateGalleryPayload,
  UpdateGalleryPayload,
  CreateGalleryImagePayload,
  UpdateGalleryImagePayload,
} from '../../types/gallery';

export * from '../../types/gallery';

import type {
  ReviewItem,
  ReviewQueryParams,
  PaginatedReviewsResult,
  UpdateReviewPayload,
  UpdateReviewStatusPayload,
  SetReviewFeaturedPayload,
} from '../../types/review';

export * from '../../types/review';

import type {
  UpdateWebsiteSettingsPayload,
  SettingsResponseData,
} from '../../types/settings';

export * from '../../types/settings';

import type {
  DashboardSummaryData,
} from '../../types/analytics';

export * from '../../types/analytics';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface SessionItem {
  public_id: string;
  device_info?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at: string;
  revoked_at?: string | null;
  created_at: string;
  is_active: boolean;
  is_current: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  user: AdminUser;
}

// Raw base query with credentials: 'include' for HttpOnly refresh cookie transmission
const rawBaseQuery = fetchBaseQuery({
  baseUrl: config.apiBaseUrl,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    // 1. Try Redux state
    const state = getState() as { auth?: { accessToken?: string | null } };
    let token = state.auth?.accessToken;

    // 2. Fallback to in-memory token storage
    if (!token) {
      token = tokenStorage.getToken();
    }

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    return headers;
  },
});

// Single-flight refresh mutex to prevent concurrent refresh loops
let refreshPromise: Promise<string | null> | null = null;

async function requestTokenRefresh(
  api: BaseQueryApi,
  extraOptions: Record<string, unknown>
): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshResult = await rawBaseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const responseData = refreshResult.data as ApiResponse<LoginResponseData>;
          if (responseData.data?.accessToken) {
            const newToken = responseData.data.accessToken;
            api.dispatch(updateAccessToken(newToken));
            if (responseData.data.user) {
              api.dispatch(setUser(responseData.data.user));
            }
            return newToken;
          }
        }

        api.dispatch(logout());
        return null;
      } catch {
        api.dispatch(logout());
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

// Base query with re-authentication on 401 Unauthorized
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const url = typeof args === 'string' ? args : args.url;
  const isRefreshEndpoint = url.includes('/auth/refresh');
  const isLoginEndpoint = url.includes('/auth/login');

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Never attempt re-auth on /auth/login or /auth/refresh itself
    if (isRefreshEndpoint || isLoginEndpoint) {
      if (isRefreshEndpoint) {
        api.dispatch(logout());
      }
      return result;
    }

    // Execute single-flight refresh
    const newToken = await requestTokenRefresh(api, extraOptions);

    if (newToken) {
      // Retry original request with the new access token
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

/**
 * Base RTK Query API slice for SKF Admin Portal
 */
export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'Sessions',
    'Theme',
    'Settings',
    'Categories',
    'Products',
    'Orders',
    'Quotations',
    'Estimator',
    'Enquiries',
    'CustomRequests',
    'B2B',
    'Galleries',
    'Reviews',
    'AuditLogs',
    'Notifications',
  ],
  endpoints: (builder) => ({
    getHealth: builder.query<ApiResponse<{ status: string; database: string }>, void>({
      query: () => '/health',
    }),

    // Authenticate Admin User
    login: builder.mutation<ApiResponse<LoginResponseData>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth', 'Sessions'],
    }),

    // Rotate refresh token
    refresh: builder.mutation<ApiResponse<LoginResponseData>, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),

    // Logout from current session
    logoutUser: builder.mutation<ApiResponse<Record<string, never>>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'Sessions'],
    }),

    // Logout from all active sessions
    logoutAllSessions: builder.mutation<ApiResponse<Record<string, never>>, void>({
      query: () => ({
        url: '/auth/logout-all',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'Sessions'],
    }),

    // Get current authenticated user profile
    getMe: builder.query<ApiResponse<{ user: AdminUser }>, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),

    // Get active sessions
    getSessions: builder.query<ApiResponse<{ sessions: SessionItem[] }>, void>({
      query: () => '/auth/sessions',
      providesTags: ['Sessions'],
    }),

    // Revoke a specific session
    revokeSession: builder.mutation<ApiResponse<Record<string, never>>, string>({
      query: (publicId) => ({
        url: `/auth/sessions/${publicId}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: ['Sessions'],
    }),

    // ==================== CATEGORIES ====================
    getCategories: builder.query<
      ApiResponse<PaginatedResult<CategoryItem>>,
      CategoryQueryParams | void
    >({
      query: (params) => ({
        url: '/admin/categories',
        params: params || {},
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ public_id }) => ({
                type: 'Categories' as const,
                id: public_id,
              })),
              { type: 'Categories', id: 'LIST' },
            ]
          : [{ type: 'Categories', id: 'LIST' }],
    }),

    getCategoryByPublicId: builder.query<ApiResponse<{ category: CategoryItem }>, string>({
      query: (publicId) => `/admin/categories/${publicId}`,
      providesTags: (_res, _err, id) => [{ type: 'Categories', id }],
    }),

    createCategory: builder.mutation<ApiResponse<{ category: CategoryItem }>, CreateCategoryRequest>({
      query: (body) => ({
        url: '/admin/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Categories', id: 'LIST' }],
    }),

    updateCategory: builder.mutation<
      ApiResponse<{ category: CategoryItem }>,
      { publicId: string; data: UpdateCategoryRequest }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/categories/${publicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Categories', id: publicId },
        { type: 'Categories', id: 'LIST' },
        { type: 'Products', id: 'LIST' },
      ],
    }),

    deleteCategory: builder.mutation<ApiResponse<Record<string, never>>, string>({
      query: (publicId) => ({
        url: `/admin/categories/${publicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Categories', id: 'LIST' }],
    }),

    // ==================== PRODUCTS ====================
    getProducts: builder.query<
      ApiResponse<PaginatedResult<ProductListItem>>,
      ProductQueryParams | void
    >({
      query: (params) => ({
        url: '/admin/products',
        params: params || {},
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ public_id }) => ({
                type: 'Products' as const,
                id: public_id,
              })),
              { type: 'Products', id: 'LIST' },
            ]
          : [{ type: 'Products', id: 'LIST' }],
    }),

    getProductByPublicId: builder.query<ApiResponse<{ product: ProductDetail }>, string>({
      query: (publicId) => `/admin/products/${publicId}`,
      providesTags: (_res, _err, id) => [{ type: 'Products', id }],
    }),

    createProduct: builder.mutation<ApiResponse<{ product: ProductDetail }>, CreateProductRequest>({
      query: (body) => ({
        url: '/admin/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),

    updateProduct: builder.mutation<
      ApiResponse<{ product: ProductDetail }>,
      { publicId: string; data: UpdateProductRequest }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/products/${publicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Products', id: publicId },
        { type: 'Products', id: 'LIST' },
      ],
    }),

    deleteProduct: builder.mutation<ApiResponse<Record<string, never>>, string>({
      query: (publicId) => ({
        url: `/admin/products/${publicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),

    publishProduct: builder.mutation<ApiResponse<{ product: ProductDetail }>, string>({
      query: (publicId) => ({
        url: `/admin/products/${publicId}/publish`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Products', id },
        { type: 'Products', id: 'LIST' },
      ],
    }),

    archiveProduct: builder.mutation<ApiResponse<{ product: ProductDetail }>, string>({
      query: (publicId) => ({
        url: `/admin/products/${publicId}/archive`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Products', id },
        { type: 'Products', id: 'LIST' },
      ],
    }),

    // ==================== PRODUCT MEDIA (IMAGES) ====================
    getProductImages: builder.query<ApiResponse<{ images: ProductImageItem[] }>, string>({
      query: (publicId) => `/admin/products/${publicId}/images`,
      providesTags: (_res, _err, id) => [{ type: 'Products', id: `IMAGES_${id}` }],
    }),

    addProductImage: builder.mutation<
      ApiResponse<{ image: ProductImageItem }>,
      { productPublicId: string; data: CreateImageRequest }
    >({
      query: ({ productPublicId, data }) => ({
        url: `/admin/products/${productPublicId}/images`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_res, _err, { productPublicId }) => [
        { type: 'Products', id: `IMAGES_${productPublicId}` },
        { type: 'Products', id: productPublicId },
        { type: 'Products', id: 'LIST' },
      ],
    }),

    updateProductImage: builder.mutation<
      ApiResponse<{ image: ProductImageItem }>,
      { productPublicId: string; imagePublicId: string; data: UpdateImageRequest }
    >({
      query: ({ productPublicId, imagePublicId, data }) => ({
        url: `/admin/products/${productPublicId}/images/${imagePublicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { productPublicId }) => [
        { type: 'Products', id: `IMAGES_${productPublicId}` },
        { type: 'Products', id: productPublicId },
        { type: 'Products', id: 'LIST' },
      ],
    }),

    deleteProductImage: builder.mutation<
      ApiResponse<Record<string, never>>,
      { productPublicId: string; imagePublicId: string }
    >({
      query: ({ productPublicId, imagePublicId }) => ({
        url: `/admin/products/${productPublicId}/images/${imagePublicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { productPublicId }) => [
        { type: 'Products', id: `IMAGES_${productPublicId}` },
        { type: 'Products', id: productPublicId },
        { type: 'Products', id: 'LIST' },
      ],
    }),

    setPrimaryProductImage: builder.mutation<
      ApiResponse<{ image: ProductImageItem }>,
      { productPublicId: string; imagePublicId: string }
    >({
      query: ({ productPublicId, imagePublicId }) => ({
        url: `/admin/products/${productPublicId}/images/${imagePublicId}/primary`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, { productPublicId }) => [
        { type: 'Products', id: `IMAGES_${productPublicId}` },
        { type: 'Products', id: productPublicId },
        { type: 'Products', id: 'LIST' },
      ],
    }),

    reorderProductImages: builder.mutation<
      ApiResponse<{ images: ProductImageItem[] }>,
      { productPublicId: string; items: { public_id: string; sort_order: number }[] }
    >({
      query: ({ productPublicId, items }) => ({
        url: `/admin/products/${productPublicId}/images/reorder`,
        method: 'PATCH',
        body: { items },
      }),
      invalidatesTags: (_res, _err, { productPublicId }) => [
        { type: 'Products', id: `IMAGES_${productPublicId}` },
        { type: 'Products', id: productPublicId },
      ],
    }),

    // ==================== PRODUCT MEDIA (VIDEOS) ====================
    getProductVideos: builder.query<ApiResponse<{ videos: ProductVideoItem[] }>, string>({
      query: (publicId) => `/admin/products/${publicId}/videos`,
      providesTags: (_res, _err, id) => [{ type: 'Products', id: `VIDEOS_${id}` }],
    }),

    addProductVideo: builder.mutation<
      ApiResponse<{ video: ProductVideoItem }>,
      { productPublicId: string; data: CreateVideoRequest }
    >({
      query: ({ productPublicId, data }) => ({
        url: `/admin/products/${productPublicId}/videos`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_res, _err, { productPublicId }) => [
        { type: 'Products', id: `VIDEOS_${productPublicId}` },
        { type: 'Products', id: productPublicId },
      ],
    }),

    updateProductVideo: builder.mutation<
      ApiResponse<{ video: ProductVideoItem }>,
      { productPublicId: string; videoPublicId: string; data: UpdateVideoRequest }
    >({
      query: ({ productPublicId, videoPublicId, data }) => ({
        url: `/admin/products/${productPublicId}/videos/${videoPublicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { productPublicId }) => [
        { type: 'Products', id: `VIDEOS_${productPublicId}` },
        { type: 'Products', id: productPublicId },
      ],
    }),

    deleteProductVideo: builder.mutation<
      ApiResponse<Record<string, never>>,
      { productPublicId: string; videoPublicId: string }
    >({
      query: ({ productPublicId, videoPublicId }) => ({
        url: `/admin/products/${productPublicId}/videos/${videoPublicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { productPublicId }) => [
        { type: 'Products', id: `VIDEOS_${productPublicId}` },
        { type: 'Products', id: productPublicId },
      ],
    }),

    // ==================== PRODUCT SPECIFICATIONS ====================
    getProductSpecs: builder.query<ApiResponse<{ specs: ProductSpecItem[] }>, string>({
      query: (publicId) => `/admin/products/${publicId}/specs`,
      providesTags: (_res, _err, id) => [{ type: 'Products', id: `SPECS_${id}` }],
    }),

    addProductSpec: builder.mutation<
      ApiResponse<{ spec: ProductSpecItem }>,
      { productPublicId: string; data: CreateSpecRequest }
    >({
      query: ({ productPublicId, data }) => ({
        url: `/admin/products/${productPublicId}/specs`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_res, _err, { productPublicId }) => [
        { type: 'Products', id: `SPECS_${productPublicId}` },
        { type: 'Products', id: productPublicId },
      ],
    }),

    updateProductSpec: builder.mutation<
      ApiResponse<{ spec: ProductSpecItem }>,
      { productPublicId: string; specPublicId: string; data: UpdateSpecRequest }
    >({
      query: ({ productPublicId, specPublicId, data }) => ({
        url: `/admin/products/${productPublicId}/specs/${specPublicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { productPublicId }) => [
        { type: 'Products', id: `SPECS_${productPublicId}` },
        { type: 'Products', id: productPublicId },
      ],
    }),

    deleteProductSpec: builder.mutation<
      ApiResponse<Record<string, never>>,
      { productPublicId: string; specPublicId: string }
    >({
      query: ({ productPublicId, specPublicId }) => ({
        url: `/admin/products/${productPublicId}/specs/${specPublicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { productPublicId }) => [
        { type: 'Products', id: `SPECS_${productPublicId}` },
        { type: 'Products', id: productPublicId },
      ],
    }),

    // ==================== ENQUIRIES ====================
    getEnquiries: builder.query<
      ApiResponse<PaginatedEnquiriesResult>,
      EnquiryQueryParams | void
    >({
      query: (params) => ({
        url: '/admin/enquiries',
        params: params || {},
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ public_id }) => ({
                type: 'Enquiries' as const,
                id: public_id,
              })),
              { type: 'Enquiries', id: 'LIST' },
            ]
          : [{ type: 'Enquiries', id: 'LIST' }],
    }),

    getEnquiryByPublicId: builder.query<ApiResponse<EnquiryDetail>, string>({
      query: (publicId) => `/admin/enquiries/${publicId}`,
      providesTags: (_res, _err, id) => [{ type: 'Enquiries', id }],
    }),

    updateAdminEnquiry: builder.mutation<
      ApiResponse<EnquiryDetail>,
      { publicId: string; data: UpdateEnquiryRequest }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/enquiries/${publicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Enquiries', id: publicId },
        { type: 'Enquiries', id: 'LIST' },
      ],
    }),

    updateEnquiryStatus: builder.mutation<
      ApiResponse<EnquiryListItem>,
      { publicId: string; data: UpdateEnquiryStatusRequest }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/enquiries/${publicId}/status`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Enquiries', id: publicId },
        { type: 'Enquiries', id: 'LIST' },
      ],
    }),

    // Enquiry Notes
    getEnquiryNotes: builder.query<ApiResponse<EnquiryNote[]>, string>({
      query: (publicId) => `/admin/enquiries/${publicId}/notes`,
      providesTags: (_res, _err, id) => [{ type: 'Enquiries', id: `NOTES_${id}` }],
    }),

    createEnquiryNote: builder.mutation<
      ApiResponse<EnquiryNote>,
      { publicId: string; data: CreateEnquiryNoteRequest }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/enquiries/${publicId}/notes`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Enquiries', id: `NOTES_${publicId}` },
        { type: 'Enquiries', id: publicId },
      ],
    }),

    updateEnquiryNote: builder.mutation<
      ApiResponse<EnquiryNote>,
      { publicId: string; notePublicId: string; data: UpdateEnquiryNoteRequest }
    >({
      query: ({ publicId, notePublicId, data }) => ({
        url: `/admin/enquiries/${publicId}/notes/${notePublicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Enquiries', id: `NOTES_${publicId}` },
        { type: 'Enquiries', id: publicId },
      ],
    }),

    deleteEnquiryNote: builder.mutation<
      ApiResponse<Record<string, never>>,
      { publicId: string; notePublicId: string }
    >({
      query: ({ publicId, notePublicId }) => ({
        url: `/admin/enquiries/${publicId}/notes/${notePublicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Enquiries', id: `NOTES_${publicId}` },
        { type: 'Enquiries', id: publicId },
      ],
    }),

    // Enquiry Follow-Ups
    getEnquiryFollowUps: builder.query<ApiResponse<EnquiryFollowUp[]>, string>({
      query: (publicId) => `/admin/enquiries/${publicId}/follow-ups`,
      providesTags: (_res, _err, id) => [{ type: 'Enquiries', id: `FOLLOWUPS_${id}` }],
    }),

    createEnquiryFollowUp: builder.mutation<
      ApiResponse<EnquiryFollowUp>,
      { publicId: string; data: CreateFollowUpRequest }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/enquiries/${publicId}/follow-ups`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Enquiries', id: `FOLLOWUPS_${publicId}` },
        { type: 'Enquiries', id: publicId },
      ],
    }),

    updateEnquiryFollowUp: builder.mutation<
      ApiResponse<EnquiryFollowUp>,
      { publicId: string; followUpPublicId: string; data: UpdateFollowUpRequest }
    >({
      query: ({ publicId, followUpPublicId, data }) => ({
        url: `/admin/enquiries/${publicId}/follow-ups/${followUpPublicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Enquiries', id: `FOLLOWUPS_${publicId}` },
        { type: 'Enquiries', id: publicId },
      ],
    }),

    deleteEnquiryFollowUp: builder.mutation<
      ApiResponse<Record<string, never>>,
      { publicId: string; followUpPublicId: string }
    >({
      query: ({ publicId, followUpPublicId }) => ({
        url: `/admin/enquiries/${publicId}/follow-ups/${followUpPublicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Enquiries', id: `FOLLOWUPS_${publicId}` },
        { type: 'Enquiries', id: publicId },
      ],
    }),

    // ==================== QUOTATIONS ====================
    getQuotations: builder.query<ApiResponse<PaginatedQuotationsResult>, QuotationQueryParams | void>({
      query: (params) => ({
        url: '/admin/quotations',
        params: params || {},
      }),
      providesTags: ['Quotations'],
    }),

    getQuotationByPublicId: builder.query<ApiResponse<QuotationDetail>, string>({
      query: (publicId) => `/admin/quotations/${publicId}`,
      transformResponse: (response: ApiResponse<any>) => ({
        ...response,
        data: response.data?.quotation || response.data,
      }),
      providesTags: (_res, _err, id) => [{ type: 'Quotations', id }],
    }),

    createQuotation: builder.mutation<ApiResponse<QuotationDetail>, CreateQuotationPayload>({
      query: (data) => ({
        url: '/admin/quotations',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<any>) => ({
        ...response,
        data: response.data?.quotation || response.data,
      }),
      invalidatesTags: ['Quotations', 'Enquiries'],
    }),

    updateQuotation: builder.mutation<
      ApiResponse<QuotationDetail>,
      { publicId: string; data: UpdateQuotationPayload }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/quotations/${publicId}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiResponse<any>) => ({
        ...response,
        data: response.data?.quotation || response.data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => ['Quotations', { type: 'Quotations', id: publicId }],
    }),

    updateQuotationStatus: builder.mutation<
      ApiResponse<QuotationDetail>,
      { publicId: string; data: UpdateQuotationStatusPayload }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/quotations/${publicId}/status`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<any>) => ({
        ...response,
        data: response.data?.quotation || response.data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => ['Quotations', { type: 'Quotations', id: publicId }],
    }),

    deleteQuotation: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (publicId) => ({
        url: `/admin/quotations/${publicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Quotations'],
    }),

    addQuotationItem: builder.mutation<
      ApiResponse<QuotationDetail>,
      { publicId: string; data: CreateQuotationItemPayload }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/quotations/${publicId}/items`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<any>) => ({
        ...response,
        data: response.data?.quotation || response.data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => ['Quotations', { type: 'Quotations', id: publicId }],
    }),

    updateQuotationItem: builder.mutation<
      ApiResponse<QuotationDetail>,
      { publicId: string; itemPublicId: string; data: UpdateQuotationItemPayload }
    >({
      query: ({ publicId, itemPublicId, data }) => ({
        url: `/admin/quotations/${publicId}/items/${itemPublicId}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiResponse<any>) => ({
        ...response,
        data: response.data?.quotation || response.data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => ['Quotations', { type: 'Quotations', id: publicId }],
    }),

    deleteQuotationItem: builder.mutation<
      ApiResponse<QuotationDetail>,
      { publicId: string; itemPublicId: string }
    >({
      query: ({ publicId, itemPublicId }) => ({
        url: `/admin/quotations/${publicId}/items/${itemPublicId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<any>) => ({
        ...response,
        data: response.data?.quotation || response.data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => ['Quotations', { type: 'Quotations', id: publicId }],
    }),

    // ==================== ESTIMATOR ====================
    getAdminEstimatorRules: builder.query<ApiResponse<PaginatedEstimatorRulesResult>, EstimatorQueryParams | void>({
      query: (params) => ({
        url: '/admin/estimator-rules',
        params: params || {},
      }),
      providesTags: ['Estimator'],
    }),

    getAdminEstimatorRuleByPublicId: builder.query<ApiResponse<EstimatorRule>, string>({
      query: (publicId) => `/admin/estimator-rules/${publicId}`,
      providesTags: (_res, _err, id) => [{ type: 'Estimator', id }],
    }),

    createAdminEstimatorRule: builder.mutation<ApiResponse<EstimatorRule>, CreateEstimatorRulePayload>({
      query: (data) => ({
        url: '/admin/estimator-rules',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Estimator'],
    }),

    updateAdminEstimatorRule: builder.mutation<
      ApiResponse<EstimatorRule>,
      { publicId: string; data: UpdateEstimatorRulePayload }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/estimator-rules/${publicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => ['Estimator', { type: 'Estimator', id: publicId }],
    }),

    deleteAdminEstimatorRule: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (publicId) => ({
        url: `/admin/estimator-rules/${publicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Estimator'],
    }),

    calculateEstimate: builder.mutation<ApiResponse<CalculateEstimateResult>, CalculateEstimateRequest>({
      query: (data) => ({
        url: '/estimator/calculate',
        method: 'POST',
        body: data,
      }),
    }),

    // ==================== CUSTOM FURNITURE REQUESTS ====================
    getCustomRequests: builder.query<
      ApiResponse<PaginatedCustomRequestsResult>,
      CustomRequestQueryParams | void
    >({
      query: (params) => ({
        url: '/admin/custom-requests',
        params: params || {},
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ public_id }) => ({
                type: 'CustomRequests' as const,
                id: public_id,
              })),
              { type: 'CustomRequests', id: 'LIST' },
            ]
          : [{ type: 'CustomRequests', id: 'LIST' }],
    }),

    getCustomRequestByPublicId: builder.query<ApiResponse<CustomRequestDetail>, string>({
      query: (publicId) => `/admin/custom-requests/${publicId}`,
      providesTags: (_res, _err, id) => [{ type: 'CustomRequests', id }],
    }),

    updateCustomRequest: builder.mutation<
      ApiResponse<CustomRequestDetail>,
      { publicId: string; data: UpdateCustomRequestPayload }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/custom-requests/${publicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'CustomRequests', id: 'LIST' },
        { type: 'CustomRequests', id: publicId },
      ],
    }),

    updateCustomRequestStatus: builder.mutation<
      ApiResponse<CustomRequestDetail>,
      { publicId: string; data: UpdateCustomRequestStatusPayload }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/custom-requests/${publicId}/status`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'CustomRequests', id: 'LIST' },
        { type: 'CustomRequests', id: publicId },
        'Enquiries',
      ],
    }),

    getCustomRequestImages: builder.query<ApiResponse<CustomRequestImage[]>, string>({
      query: (publicId) => `/admin/custom-requests/${publicId}/images`,
      providesTags: (_res, _err, id) => [{ type: 'CustomRequests', id: `IMAGES_${id}` }],
    }),

    addCustomRequestImage: builder.mutation<
      ApiResponse<CustomRequestImage>,
      { publicId: string; data: CreateCustomRequestImagePayload }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/custom-requests/${publicId}/images`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'CustomRequests', id: publicId },
        { type: 'CustomRequests', id: `IMAGES_${publicId}` },
      ],
    }),

    updateCustomRequestImage: builder.mutation<
      ApiResponse<CustomRequestImage>,
      { publicId: string; imagePublicId: string; data: UpdateCustomRequestImagePayload }
    >({
      query: ({ publicId, imagePublicId, data }) => ({
        url: `/admin/custom-requests/${publicId}/images/${imagePublicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'CustomRequests', id: publicId },
        { type: 'CustomRequests', id: `IMAGES_${publicId}` },
      ],
    }),

    deleteCustomRequestImage: builder.mutation<
      ApiResponse<{ message: string }>,
      { publicId: string; imagePublicId: string }
    >({
      query: ({ publicId, imagePublicId }) => ({
        url: `/admin/custom-requests/${publicId}/images/${imagePublicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'CustomRequests', id: publicId },
        { type: 'CustomRequests', id: `IMAGES_${publicId}` },
      ],
    }),

    // ==================== GALLERIES ====================
    getGalleries: builder.query<
      ApiResponse<PaginatedGalleriesResult>,
      GalleryQueryParams | void
    >({
      query: (params) => ({
        url: '/admin/galleries',
        params: params || {},
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ public_id }) => ({
                type: 'Galleries' as const,
                id: public_id,
              })),
              { type: 'Galleries', id: 'LIST' },
            ]
          : [{ type: 'Galleries', id: 'LIST' }],
    }),

    getGalleryByPublicId: builder.query<ApiResponse<GalleryItem>, string>({
      query: (publicId) => `/admin/galleries/${publicId}`,
      providesTags: (_res, _err, id) => [{ type: 'Galleries', id }],
    }),

    createGallery: builder.mutation<ApiResponse<GalleryItem>, CreateGalleryPayload>({
      query: (data) => ({
        url: '/admin/galleries',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Galleries', id: 'LIST' }],
    }),

    updateGallery: builder.mutation<
      ApiResponse<GalleryItem>,
      { publicId: string; data: UpdateGalleryPayload }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/galleries/${publicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Galleries', id: 'LIST' },
        { type: 'Galleries', id: publicId },
      ],
    }),

    deleteGallery: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (publicId) => ({
        url: `/admin/galleries/${publicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Galleries', id: 'LIST' }],
    }),

    publishGallery: builder.mutation<ApiResponse<GalleryItem>, string>({
      query: (publicId) => ({
        url: `/admin/galleries/${publicId}/publish`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, publicId) => [
        { type: 'Galleries', id: 'LIST' },
        { type: 'Galleries', id: publicId },
      ],
    }),

    archiveGallery: builder.mutation<ApiResponse<GalleryItem>, string>({
      query: (publicId) => ({
        url: `/admin/galleries/${publicId}/archive`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, publicId) => [
        { type: 'Galleries', id: 'LIST' },
        { type: 'Galleries', id: publicId },
      ],
    }),

    getGalleryImages: builder.query<ApiResponse<GalleryImage[]>, string>({
      query: (publicId) => `/admin/galleries/${publicId}/images`,
      providesTags: (_res, _err, id) => [{ type: 'Galleries', id: `IMAGES_${id}` }],
    }),

    addGalleryImage: builder.mutation<
      ApiResponse<GalleryImage>,
      { publicId: string; data: CreateGalleryImagePayload }
    >({
      query: ({ publicId, data }) => ({
        url: `/admin/galleries/${publicId}/images`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Galleries', id: publicId },
        { type: 'Galleries', id: `IMAGES_${publicId}` },
      ],
    }),

    updateGalleryImage: builder.mutation<
      ApiResponse<GalleryImage>,
      { publicId: string; imagePublicId: string; data: UpdateGalleryImagePayload }
    >({
      query: ({ publicId, imagePublicId, data }) => ({
        url: `/admin/galleries/${publicId}/images/${imagePublicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Galleries', id: publicId },
        { type: 'Galleries', id: `IMAGES_${publicId}` },
      ],
    }),

    deleteGalleryImage: builder.mutation<
      ApiResponse<{ message: string }>,
      { publicId: string; imagePublicId: string }
    >({
      query: ({ publicId, imagePublicId }) => ({
        url: `/admin/galleries/${publicId}/images/${imagePublicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Galleries', id: publicId },
        { type: 'Galleries', id: `IMAGES_${publicId}` },
      ],
    }),

    // ==========================================
    // Reviews & Ratings Moderation (Step 8)
    // ==========================================
    getReviews: builder.query<ApiResponse<PaginatedReviewsResult>, ReviewQueryParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.page) queryParams.set('page', String(params.page));
          if (params.limit) queryParams.set('limit', String(params.limit));
          if (params.status) queryParams.set('status', params.status);
          if (params.rating) queryParams.set('rating', String(params.rating));
          if (params.is_featured !== undefined && params.is_featured !== '') {
            queryParams.set('is_featured', String(params.is_featured));
          }
          if (params.product_public_id) queryParams.set('product_public_id', params.product_public_id);
          if (params.search) queryParams.set('search', params.search);
          if (params.sort) queryParams.set('sort', params.sort);
        }
        const qs = queryParams.toString();
        return `/admin/reviews${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map((r) => ({ type: 'Reviews' as const, id: r.public_id })),
              { type: 'Reviews' as const, id: 'LIST' },
            ]
          : [{ type: 'Reviews' as const, id: 'LIST' }],
    }),

    getReviewByPublicId: builder.query<ApiResponse<ReviewItem>, string>({
      query: (publicId) => `/admin/reviews/${publicId}`,
      providesTags: (_result, _error, publicId) => [{ type: 'Reviews', id: publicId }],
    }),

    updateReview: builder.mutation<ApiResponse<ReviewItem>, { publicId: string; data: UpdateReviewPayload }>({
      query: ({ publicId, data }) => ({
        url: `/admin/reviews/${publicId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Reviews', id: publicId },
        { type: 'Reviews', id: 'LIST' },
      ],
    }),

    updateReviewStatus: builder.mutation<ApiResponse<ReviewItem>, { publicId: string; data: UpdateReviewStatusPayload }>({
      query: ({ publicId, data }) => ({
        url: `/admin/reviews/${publicId}/status`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Reviews', id: publicId },
        { type: 'Reviews', id: 'LIST' },
      ],
    }),

    setReviewFeatured: builder.mutation<ApiResponse<ReviewItem>, { publicId: string; data: SetReviewFeaturedPayload }>({
      query: ({ publicId, data }) => ({
        url: `/admin/reviews/${publicId}/featured`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Reviews', id: publicId },
        { type: 'Reviews', id: 'LIST' },
      ],
    }),

    deleteReview: builder.mutation<ApiResponse<void>, string>({
      query: (publicId) => ({
        url: `/admin/reviews/${publicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, publicId) => [
        { type: 'Reviews', id: publicId },
        { type: 'Reviews', id: 'LIST' },
      ],
    }),

    // ==========================================
    // Website & Business Settings (Step 11)
    // ==========================================
    getSettings: builder.query<ApiResponse<SettingsResponseData>, void>({
      query: () => '/admin/settings',
      providesTags: ['Settings'],
    }),

    updateSettings: builder.mutation<ApiResponse<SettingsResponseData>, UpdateWebsiteSettingsPayload>({
      query: (payload) => ({
        url: '/admin/settings',
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['Settings'],
    }),

    // ==========================================
    // Analytics & Dashboard Summary (Step 12)
    // ==========================================
    getDashboardSummary: builder.query<ApiResponse<DashboardSummaryData>, void>({
      query: () => '/admin/dashboard/summary',
      providesTags: ['Products', 'Enquiries', 'CustomRequests', 'Quotations', 'Reviews'],
    }),

    // ==========================================
    // Public Quotation Sharing & Approval (Step 10)
    // ==========================================
    getPublicQuotation: builder.query<ApiResponse<{ quotation: QuotationDetail }>, string>({
      query: (publicId) => `/quotations/${publicId}`,
      providesTags: (_res, _err, publicId) => [{ type: 'Quotations', id: publicId }],
    }),

    acceptPublicQuotation: builder.mutation<ApiResponse<{ quotation: QuotationDetail }>, string>({
      query: (publicId) => ({
        url: `/quotations/${publicId}/accept`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, publicId) => [
        { type: 'Quotations', id: publicId },
        { type: 'Quotations', id: 'LIST' },
      ],
    }),

    rejectPublicQuotation: builder.mutation<ApiResponse<{ quotation: QuotationDetail }>, { publicId: string; reason?: string }>({
      query: ({ publicId, reason }) => ({
        url: `/quotations/${publicId}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_res, _err, { publicId }) => [
        { type: 'Quotations', id: publicId },
        { type: 'Quotations', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetHealthQuery,
  useLoginMutation,
  useRefreshMutation,
  useLogoutUserMutation,
  useLogoutAllSessionsMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  // Categories
  useGetCategoriesQuery,
  useGetCategoryByPublicIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  // Products
  useGetProductsQuery,
  useGetProductByPublicIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  usePublishProductMutation,
  useArchiveProductMutation,
  // Media (Images)
  useGetProductImagesQuery,
  useAddProductImageMutation,
  useUpdateProductImageMutation,
  useDeleteProductImageMutation,
  useSetPrimaryProductImageMutation,
  useReorderProductImagesMutation,
  // Media (Videos)
  useGetProductVideosQuery,
  useAddProductVideoMutation,
  useUpdateProductVideoMutation,
  useDeleteProductVideoMutation,
  // Specifications
  useGetProductSpecsQuery,
  useAddProductSpecMutation,
  useUpdateProductSpecMutation,
  useDeleteProductSpecMutation,
  // Enquiries & CRM
  useGetEnquiriesQuery,
  useGetEnquiryByPublicIdQuery,
  useUpdateAdminEnquiryMutation,
  useUpdateEnquiryStatusMutation,
  useGetEnquiryNotesQuery,
  useCreateEnquiryNoteMutation,
  useUpdateEnquiryNoteMutation,
  useDeleteEnquiryNoteMutation,
  useGetEnquiryFollowUpsQuery,
  useCreateEnquiryFollowUpMutation,
  useUpdateEnquiryFollowUpMutation,
  useDeleteEnquiryFollowUpMutation,
  // Quotations
  useGetQuotationsQuery,
  useGetQuotationByPublicIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useUpdateQuotationStatusMutation,
  useDeleteQuotationMutation,
  useAddQuotationItemMutation,
  useUpdateQuotationItemMutation,
  useDeleteQuotationItemMutation,
  // Estimator
  useGetAdminEstimatorRulesQuery,
  useGetAdminEstimatorRuleByPublicIdQuery,
  useCreateAdminEstimatorRuleMutation,
  useUpdateAdminEstimatorRuleMutation,
  useDeleteAdminEstimatorRuleMutation,
  useCalculateEstimateMutation,
  // Custom Furniture Requests
  useGetCustomRequestsQuery,
  useGetCustomRequestByPublicIdQuery,
  useUpdateCustomRequestMutation,
  useUpdateCustomRequestStatusMutation,
  useGetCustomRequestImagesQuery,
  useAddCustomRequestImageMutation,
  useUpdateCustomRequestImageMutation,
  useDeleteCustomRequestImageMutation,
  // Galleries & Project Showcase
  useGetGalleriesQuery,
  useGetGalleryByPublicIdQuery,
  useCreateGalleryMutation,
  useUpdateGalleryMutation,
  useDeleteGalleryMutation,
  usePublishGalleryMutation,
  useArchiveGalleryMutation,
  useGetGalleryImagesQuery,
  useAddGalleryImageMutation,
  useUpdateGalleryImageMutation,
  useDeleteGalleryImageMutation,
  // Customer Reviews & Moderation
  useGetReviewsQuery,
  useGetReviewByPublicIdQuery,
  useUpdateReviewMutation,
  useUpdateReviewStatusMutation,
  useSetReviewFeaturedMutation,
  useDeleteReviewMutation,
  // Business Settings
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  // Dashboard & Analytics
  useGetDashboardSummaryQuery,
  // Public Quotation Sharing
  useGetPublicQuotationQuery,
  useAcceptPublicQuotationMutation,
  useRejectPublicQuotationMutation,
} = baseApi;

export default baseApi;
