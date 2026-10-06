import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Completed Projects Gallery | Luxury Stainless Steel Installations',
  description: 'View completed bespoke stainless steel furniture installations across luxury residences, penthouses, and commercial kitchens.',
  canonicalPath: '/gallery',
  keywords: [
    'stainless steel furniture gallery',
    'luxury interior metal projects',
    'stainless steel bed installation',
    'bespoke dining table photos',
    'commercial cleanroom fabrication gallery',
  ],
});

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
