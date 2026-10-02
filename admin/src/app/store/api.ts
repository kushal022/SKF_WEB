import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '../config';

/**
 * Base RTK Query API slice for SKF Admin Portal
 * Connects directly to backend API (/api/v1)
 */
export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: config.apiBaseUrl,
    prepareHeaders: (headers) => {
      // In-memory or session-based token retrieval (Never store tokens in localStorage)
      const token = (window as unknown as { __SKF_ACCESS_TOKEN__?: string }).__SKF_ACCESS_TOKEN__;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'Auth',
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
    // Generic base health check endpoint verifying backend connectivity
    getHealth: builder.query<{ success: boolean; message: string; data?: { status: string; database: string } }, void>({
      query: () => '/health',
    }),
  }),
});

export const { useGetHealthQuery } = baseApi;
