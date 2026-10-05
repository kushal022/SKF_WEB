import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'About Us | Stainless Steel Furniture Manufacturer',
  description: 'Discover SKF Stainless Steel Furniture - Direct architectural metal fabricator in Ahmedabad, Gujarat specializing in surgical 304 and 316 stainless steel.',
  canonicalPath: '/about',
  keywords: [
    'about SKF furniture',
    'stainless steel manufacturer Ahmedabad',
    'grade 304 furniture fabrication',
    'PVD titanium coating process',
    'custom architectural furniture',
  ],
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
