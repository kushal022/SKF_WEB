export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  appName: 'SKF Admin Portal',
  appDescription: 'Administrative control and operations for SKF Stainless Steel Furniture',
  isProduction: import.meta.env.PROD,
} as const;

export default config;
