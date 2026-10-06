const getSocketBaseUrl = (): string => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api/v1';
  try {
    const url = new URL(apiBase);
    return url.origin;
  } catch {
    return 'http://localhost:7000';
  }
};

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api/v1',
  socketUrl: getSocketBaseUrl(),
  appName: 'SKF Admin Portal',
  appDescription: 'Administrative control and operations for SKF Stainless Steel Furniture',
  isProduction: import.meta.env.PROD,
} as const;

export default config;

