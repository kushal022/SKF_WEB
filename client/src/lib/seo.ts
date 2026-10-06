import type { Metadata } from 'next';
import { config } from './config';
import type { Product, WebsiteSettings } from '@/types';

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
    'luxury beds stainless steel',
    'commercial kitchen tables',
    'SKF furniture Ahmedabad',
  ],
  canonicalPath = '',
  ogImage = 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
  noIndex = false,
}: SEOProps = {}): Metadata {
  const pageTitle = title
    ? `${title} | ${config.appName}`
    : `${config.appName} | Premium Stainless Steel Furniture & Architectural Fabrication`;

  const siteUrl = 'http://localhost:3000';

  return {
    title: pageTitle,
    description,
    keywords,
    applicationName: config.appName,
    authors: [{ name: 'SKF Stainless Steel Furniture' }],
    metadataBase: new URL(siteUrl),
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
          width: 1200,
          height: 630,
          alt: pageTitle,
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
export function generateOrganizationSchema(settings?: WebsiteSettings | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings?.site_name || config.appName,
    description: settings?.tagline || config.appDescription,
    url: 'http://localhost:3000',
    logo: settings?.logo_url || 'http://localhost:3000/icons/icon-512x512.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: settings?.phone || '+91-9876543210',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi', 'gu'],
    },
  };
}

/**
 * Structured Data (JSON-LD) LocalBusiness Schema generator
 */
export function generateLocalBusinessSchema(settings?: WebsiteSettings | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FurnitureStore',
    name: settings?.site_name || 'SKF Stainless Steel Furniture',
    description: settings?.tagline || 'Bespoke Grade 304 and 316 Stainless Steel Furniture Manufacturer',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    url: 'http://localhost:3000',
    telephone: settings?.phone || '+91-9876543210',
    email: settings?.email || 'sales@skffurniture.com',
    priceRange: '₹₹₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Plot No. 42, GIDC Industrial Estate, Phase 2, Vatva',
      addressLocality: 'Ahmedabad',
      addressRegion: 'Gujarat',
      postalCode: '382445',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 22.9567,
      longitude: 72.6342,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '19:30',
      },
    ],
    sameAs: [
      settings?.social_links?.instagram || 'https://instagram.com/skffurniture',
      settings?.social_links?.facebook || 'https://facebook.com/skffurniture',
      settings?.social_links?.linkedin || 'https://linkedin.com/company/skffurniture',
      settings?.social_links?.youtube || 'https://youtube.com/@skffurniture',
    ],
  };
}

/**
 * Structured Data (JSON-LD) Product Schema generator
 */
export function generateProductSchema(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.map((img) => img.image_url) || [product.primary_image?.image_url || ''],
    description: product.description || product.short_description || product.name,
    sku: product.product_code,
    mpn: product.product_code,
    brand: {
      '@type': 'Brand',
      name: 'SKF Stainless Steel Furniture',
    },
    material: product.material || 'Grade 304 Stainless Steel',
    color: product.color || undefined,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      price: '0',
      url: `http://localhost:3000/products/${product.slug}`,
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

/**
 * Structured Data (JSON-LD) BreadcrumbList Schema generator
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `http://localhost:3000${item.url}`,
    })),
  };
}

/**
 * Structured Data (JSON-LD) FAQPage Schema generator
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
