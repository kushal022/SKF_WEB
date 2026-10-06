import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Product Catalog | Stainless Steel Furniture Collections',
  description: 'Explore luxury Grade 304 and 316 stainless steel beds, dining tables, sofas, wardrobes, and commercial workstations.',
  canonicalPath: '/products',
  keywords: [
    'stainless steel furniture catalog',
    'SS 304 dining tables',
    'luxury stainless steel beds',
    'custom stainless steel almirah',
    'commercial kitchen tables',
    'Ahmedabad furniture manufacturer',
  ],
});

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
