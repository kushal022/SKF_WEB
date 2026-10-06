import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getPublicProducts, getPublicSettings } from '@/lib/api';
import { constructMetadata, generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';
import ProductDetailClient from './ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return constructMetadata({
      title: 'Product Not Found',
      description: 'The requested stainless steel furniture piece could not be found.',
      noIndex: true,
    });
  }

  const primaryImg = product.primary_image?.image_url || product.images?.[0]?.image_url;

  return constructMetadata({
    title: product.seo_title || `${product.name} | ${product.material || 'Grade 304 Stainless Steel'}`,
    description: product.seo_description || product.short_description || product.description || undefined,
    canonicalPath: `/products/${product.slug}`,
    ogImage: primaryImg,
    keywords: [
      product.name,
      product.product_code,
      product.material || 'stainless steel furniture',
      product.finish || 'PVD gold finish',
      'SKF Stainless Steel Furniture',
    ],
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [settings, relatedRes] = await Promise.all([
    getPublicSettings(),
    product.category?.slug
      ? getPublicProducts({ category_slug: product.category.slug, limit: 4 })
      : Promise.resolve({ items: [], pagination: { page: 1, limit: 4, total: 0, totalPages: 0 } }),
  ]);

  let relatedProducts = relatedRes.items.filter((p) => p.public_id !== product.public_id);
  if (relatedProducts.length === 0) {
    const fallbackRes = await getPublicProducts({ featured: true, limit: 4 });
    relatedProducts = fallbackRes.items.filter((p) => p.public_id !== product.public_id).slice(0, 3);
  }

  const productSchema = generateProductSchema(product);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    ...(product.category ? [{ name: product.category.name, url: `/products?category=${product.category.slug}` }] : []),
    { name: product.name, url: `/products/${product.slug}` },
  ]);

  return (
    <>
      {/* Structured Data (JSON-LD) for Bots & Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
        settings={settings}
      />
    </>
  );
}
