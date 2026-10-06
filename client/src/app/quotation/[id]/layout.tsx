import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commercial Proposal & Quotation | SKF Stainless Steel Furniture',
  description: 'Confidential commercial quotation proposal for bespoke stainless steel furniture.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function QuotationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
