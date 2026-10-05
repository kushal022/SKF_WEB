import { config } from '../utils/config';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * In-memory token management
 * Strictly prevents tokens from being written to localStorage or IndexedDB
 */
let inMemoryAccessToken: string | null = null;

export const tokenStorage = {
  getToken: () => inMemoryAccessToken,
  setToken: (token: string | null) => {
    inMemoryAccessToken = token;
  },
  clearToken: () => {
    inMemoryAccessToken = null;
  },
};

/**
 * Base Fetch Wrapper with security headers & token injection
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${config.apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = tokenStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export default apiFetch;
