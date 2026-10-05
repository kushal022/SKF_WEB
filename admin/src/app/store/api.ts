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
} = baseApi;

export default baseApi;
