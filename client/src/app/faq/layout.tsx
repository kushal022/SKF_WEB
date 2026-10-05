import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Frequently Asked Questions | Metallurgy, Finishes & Delivery',
  description: 'Get answers regarding our Grade 304 & 316 stainless steel alloys, titanium PVD finishes, custom fabrication blueprints, and pan-India insured freight.',
  canonicalPath: '/faq',
  keywords: [
    'stainless steel furniture FAQ',
    'grade 304 vs 316 furniture',
    'PVD gold coating durability',
    'furniture delivery India',
  ],
});

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
