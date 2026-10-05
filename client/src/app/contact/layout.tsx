import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Contact Factory & Workshop | Ahmedabad, Gujarat',
  description: 'Connect with SKF Stainless Steel Furniture. Request custom quotations, CAD reviews, or visit our Vatva GIDC industrial manufacturing atelier.',
  canonicalPath: '/contact',
  keywords: [
    'contact SKF furniture',
    'stainless steel workshop Ahmedabad',
    'furniture manufacturing factory Vatva',
    'custom furniture quote WhatsApp',
  ],
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
