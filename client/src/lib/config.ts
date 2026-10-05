export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1',
  appName: 'SKF Stainless Steel Furniture',
  appDescription: 'Premium Stainless Steel Furniture & Custom Architectural Fabrication',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

export default config;
