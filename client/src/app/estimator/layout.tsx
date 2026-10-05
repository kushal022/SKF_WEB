import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stainless Steel Furniture Cost Estimator | Instant Pricing | SKF',
  description:
    'Calculate instant price estimates for custom architectural stainless steel furniture based on dimensions, Grade 304/316 metallurgy, and titanium PVD finishes.',
  alternates: {
    canonical: 'http://localhost:3000/estimator',
  },
  openGraph: {
    title: 'Stainless Steel Furniture Cost Estimator | SKF',
    description:
      'Instant architectural price estimation for bespoke stainless steel dining tables, console frames, bedframes, and modular suites.',
    url: 'http://localhost:3000/estimator',
    siteName: 'SKF Stainless Steel Furniture',
    type: 'website',
  },
};

export default function EstimatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
