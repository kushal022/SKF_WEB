import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Custom Stainless Steel Furniture Fabrication | Bespoke SS 304 & 316 | SKF',
  description:
    'Commission custom architectural stainless steel furniture directly from SKF. SS 304 and 316 grade dining tables, console frames, bedframes, and bespoke luxury installations crafted to exact dimensions.',
  alternates: {
    canonical: 'http://localhost:3000/custom-furniture',
  },
  openGraph: {
    title: 'Custom Stainless Steel Furniture Fabrication | SKF',
    description:
      'Precision architectural Grade 304 & 316 custom furniture fabrication. Handcrafted in Ahmedabad, delivered across India.',
    url: 'http://localhost:3000/custom-furniture',
    siteName: 'SKF Stainless Steel Furniture',
    type: 'website',
  },
};

export default function CustomFurnitureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
