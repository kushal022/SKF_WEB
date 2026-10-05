'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Send,
  Wrench,
  Maximize2,
  X,
  Package,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import EnquiryModal from '@/components/EnquiryModal';
import { buildWhatsAppUrl, buildProductEnquiryMessage } from '@/lib/whatsapp';
import type { Product, WebsiteSettings } from '@/types';

export interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  settings: WebsiteSettings | null;
}

export function ProductDetailClient({
  product,
  relatedProducts,
  settings,
}: ProductDetailClientProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState<boolean>(false);

  // Construct images list
  const allImages = product.images && product.images.length > 0
    ? product.images
    : product.primary_image
      ? [
          {
            public_id: product.primary_image.public_id,
            image_url: product.primary_image.image_url,
            alt_text: product.primary_image.alt_text,
            sort_order: 1,
            is_primary: true,
          },
        ]
      : [
          {
            public_id: 'fallback',
            image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
            alt_text: product.name,
            sort_order: 1,
            is_primary: true,
          },
        ];

  const currentActiveImage = allImages[activeImageIndex] || allImages[0];

  const whatsappUrl = buildWhatsAppUrl({
    phone: settings?.whatsapp_number,
    message: buildProductEnquiryMessage(product.name, product.product_code, settings?.site_name),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-14">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-[var(--text-primary)] transition-colors">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[var(--text-primary)] font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: Gallery */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Active Image View */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-[var(--border-border)] shadow-xs group">
            <Image
              src={currentActiveImage.image_url}
              alt={currentActiveImage.alt_text || product.name}
              fill
              priority
              className="object-cover transition-transform duration-500 group-hover:scale-102"
              sizes="(max-width: 1024px) 100vw, 700px"
            />
            {/* Lightbox Trigger Button */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-slate-900/75 hover:bg-slate-900 text-white backdrop-blur-md transition-all shadow-md focus:outline-none"
              aria-label="View full resolution image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <Badge variant="primary" size="md">
                {product.product_code}
              </Badge>
              {product.customizable && (
                <Badge variant="success" size="md">
                  Custom Sizing Available
                </Badge>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {allImages.map((img, idx) => (
                <button
                  key={img.public_id || idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-[var(--brand-accent)] ring-2 ring-[var(--brand-accent)]/20 scale-102'
                      : 'border-[var(--border-border)] hover:border-[var(--text-muted)] opacity-75 hover:opacity-100'
                  }`}
                  aria-label={`Switch to image ${idx + 1}`}
                >
                  <Image
                    src={img.image_url}
                    alt={img.alt_text || `${product.name} thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Value Assurance Badges */}
          <div className="grid grid-cols-3 gap-3 pt-3">
            <div className="p-3 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] text-center space-y-1">
              <ShieldCheck className="w-5 h-5 text-amber-500 mx-auto" />
              <span className="font-bold text-xs text-[var(--text-primary)] block">Grade 304/316</span>
              <span className="text-[10px] text-[var(--text-muted)]">Medical Grade Alloy</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] text-center space-y-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
              <span className="font-bold text-xs text-[var(--text-primary)] block">Zero Rust</span>
              <span className="text-[10px] text-[var(--text-muted)]">10-Year Anti-Corrosion</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] text-center space-y-1">
              <Wrench className="w-5 h-5 text-sky-500 mx-auto" />
              <span className="font-bold text-xs text-[var(--text-primary)] block">Made to Order</span>
              <span className="text-[10px] text-[var(--text-muted)]">Custom Blueprints</span>
            </div>
          </div>
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {product.category && (
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider hover:underline"
                >
                  {product.category.name}
                </Link>
              )}
              <span className="text-[var(--text-muted)]">•</span>
              <span className="text-xs text-[var(--text-muted)]">Item: {product.product_code}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
              {product.name}
            </h1>

            {product.short_description && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-1">
                {product.short_description}
              </p>
            )}
          </div>

          {/* Quick Specifications Cards */}
          <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-border)] grid grid-cols-2 gap-3 text-xs">
            {product.material && (
              <div>
                <span className="text-[var(--text-muted)] block font-medium">Material:</span>
                <span className="font-bold text-[var(--text-primary)]">{product.material}</span>
              </div>
            )}
            {product.finish && (
              <div>
                <span className="text-[var(--text-muted)] block font-medium">Finish Coating:</span>
                <span className="font-bold text-[var(--text-primary)]">{product.finish}</span>
              </div>
            )}
            {product.color && (
              <div>
                <span className="text-[var(--text-muted)] block font-medium">Color Tone:</span>
                <span className="font-bold text-[var(--text-primary)]">{product.color}</span>
              </div>
            )}
            <div>
              <span className="text-[var(--text-muted)] block font-medium">Fabrication:</span>
              <span className="font-bold text-[var(--text-primary)]">Robotic Laser & TIG Weld</span>
            </div>
          </div>

          {/* Available Sizes / Dimensions */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider block">
                Standard Dimension Options
              </label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] text-xs font-semibold text-[var(--text-secondary)] shadow-2xs"
                  >
                    {size}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] italic">
                Custom dimensions can be engineered to your exact interior architectural drawings.
              </p>
            </div>
          )}

          {/* Key Features */}
          {product.features && product.features.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--border-border)]">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Key Structural Advantages
              </h3>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conversion Actions */}
          <div className="pt-4 border-t border-[var(--border-border)] space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setQuoteModalOpen(true)}
                leftIcon={<Send className="w-4 h-4" />}
                className="w-full sm:flex-1 py-3 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10"
              >
                Get Quotation
              </Button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] text-center">
              Direct factory pricing with itemized GST invoices. Shipping across India.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Technical Specifications Table */}
      {product.specs && product.specs.length > 0 && (
        <section className="pt-8 border-t border-[var(--border-border)] space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[var(--brand-accent)]" />
            <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Engineering & Material Specifications
            </h2>
          </div>

          <div className="rounded-xl border border-[var(--border-border)] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-[var(--border-border)]">
                {product.specs.map((sp, idx) => (
                  <tr
                    key={sp.public_id || idx}
                    className={idx % 2 === 0 ? 'bg-[var(--surface-surface)]' : 'bg-[var(--surface-muted)]'}
                  >
                    <td className="py-3 px-4 font-semibold text-[var(--text-secondary)] w-1/3">
                      {sp.spec_name}
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                      {sp.spec_value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Extended Product Description */}
      {product.description && (
        <section className="pt-6 border-t border-[var(--border-border)] space-y-3">
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Detailed Overview
          </h2>
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed space-y-4 max-w-4xl">
            {product.description.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-[var(--border-border)] space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider block mb-1">
                Same Collection
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                Related Stainless Steel Designs
              </h2>
            </div>
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-xs font-semibold text-[var(--brand-accent)] hover:underline"
              >
                View Category
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.slice(0, 3).map((rel) => {
              const relImg = rel.primary_image?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';
              return (
                <Link
                  key={rel.public_id}
                  href={`/products/${rel.slug}`}
                  className="rounded-xl overflow-hidden bg-[var(--surface-surface)] border border-[var(--border-border)] hover:border-[var(--brand-accent)] shadow-xs hover:shadow-md transition-all group block"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                    <Image
                      src={relImg}
                      alt={rel.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                    <Badge variant="primary" size="sm" className="absolute top-3 left-3">
                      {rel.product_code}
                    </Badge>
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--brand-accent)] transition-colors line-clamp-1">
                      {rel.name}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {rel.short_description || rel.material || 'Grade 304 stainless steel fabrication.'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 rounded-full focus:outline-none"
            aria-label="Close image lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-5xl max-h-[85vh] w-full h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentActiveImage.image_url}
              alt={currentActiveImage.alt_text || product.name}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
        </div>
      )}

      {/* Quote Modal */}
      <EnquiryModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        productName={product.name}
        productCode={product.product_code}
        productPublicId={product.public_id}
        source="product_detail"
        settings={settings}
      />
    </div>
  );
}

export default ProductDetailClient;
