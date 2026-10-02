import type { Metadata } from 'next';
import { config } from './config';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalPath?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function constructMetadata({
  title,
  description = config.appDescription,
  keywords = [
    'stainless steel furniture',
    'SS 304 furniture',
    'SS 316 custom furniture',
    'architectural fabrication',
    'dining tables stainless steel',
    'commercial kitchen tables',
    'SKF furniture',
  ],
  canonicalPath = '',
  ogImage = '/icons/icon-512x512.png',
  noIndex = false,
}: SEOProps = {}): Metadata {
  const pageTitle = title
    ? `${title} | ${config.appName}`
    : `${config.appName} | Premium Stainless Steel Fabrication`;

  return {
    title: pageTitle,
    description,
    keywords,
    applicationName: config.appName,
    authors: [{ name: 'SKF Stainless Steel Furniture' }],
    metadataBase: new URL('http://localhost:3000'),
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
    openGraph: {
      title: pageTitle,
      description,
      type: 'website',
      url: canonicalPath,
      siteName: config.appName,
      images: [
        {
          url: ogImage,
          width: 512,
          height: 512,
          alt: 'SKF Stainless Steel Furniture',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [ogImage],
    },
    manifest: '/manifest.json',
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: [{ url: '/icons/icon-192x192.png' }],
    },
  };
}

/**
 * Structured Data (JSON-LD) Organization Schema generator
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeGoodsStore',
    name: 'SKF Stainless Steel Furniture',
    description: config.appDescription,
    url: 'http://localhost:3000',
    logo: 'http://localhost:3000/icons/icon-512x512.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9876543210',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
  };
}
