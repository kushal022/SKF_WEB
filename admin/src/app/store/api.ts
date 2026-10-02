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
} = baseApi;

export default baseApi;
