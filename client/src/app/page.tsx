'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Wrench,
  Factory,
  MessageSquare,
  Send,
  Star,
  ChevronRight,
  Award,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import EnquiryModal from '@/components/EnquiryModal';
import {
  getPublicSettings,
  getPublicCategories,
  getPublicProducts,
  getPublicGalleries,
  getPublicReviews,
} from '@/lib/api';
import {
  buildWhatsAppUrl,
  buildGeneralEnquiryMessage,
  buildProductEnquiryMessage,
  buildCustomEnquiryMessage,
} from '@/lib/whatsapp';
import type { WebsiteSettings, Category, Product, GalleryItem, Review } from '@/types';

const INITIAL_REVIEWS: Review[] = [
  {
    public_id: 'init-rev-1',
    customer_name: 'Rajesh Shah',
    rating: 5,
    review_text: 'We commissioned a custom 8-seater stainless steel dining table with Italian marble from SKF. The precision welding, mirror finish, and structural rigidity exceeded all our expectations. Truly world-class quality right here in Gujarat.',
    is_featured: true,
  },
  {
    public_id: 'init-rev-2',
    customer_name: 'Ananya Patel (Architect, Studio AP)',
    rating: 5,
    review_text: 'As an interior architect, finding stainless steel fabricators who maintain 1mm tolerances is rare. SKF fabricated our entire bedroom suite in Champagne Gold PVD. Impeccable execution, zero blemishes, and delivered ahead of schedule.',
    is_featured: true,
  },
  {
    public_id: 'init-rev-3',
    customer_name: 'Vikramaditya Singhania',
    rating: 5,
    review_text: 'Replaced our wooden wardrobes with SKF Grade 304 modular steel wardrobes due to high moisture issues in our coastal home. Not a single spec of rust, completely odorless, and the soft-close hardware feels incredibly premium.',
    is_featured: true,
  },
  {
    public_id: 'init-rev-4',
    customer_name: 'Chef Marcus Fernandez',
    rating: 5,
    review_text: 'SKF supplied all the Grade 316 commercial prep tables for our restaurant kitchen. The 14-gauge steel can handle heavy butchery and thermal shock with zero wobble. Easiest surfaces to sanitize after busy service shifts.',
    is_featured: true,
  },
];

export default function HomePage() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);

  // Quote modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    name: string;
    code: string;
    publicId: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      try {
        const [
          settingsRes,
          categoriesRes,
          productsRes,
          galleriesRes,
          reviewsRes,
        ] = await Promise.all([
          getPublicSettings(),
          getPublicCategories({ limit: 8, sort: 'sort_order' }),
          getPublicProducts({ featured: true, limit: 6 }),
          getPublicGalleries({ limit: 4 }),
          getPublicReviews({ limit: 4 }),
        ]);

        if (!isMounted) return;
        setSettings(settingsRes);
        setCategories(categoriesRes.items);
        setFeaturedProducts(productsRes.items);
        setGalleries(galleriesRes.items);
        setReviews(reviewsRes.items);
      } catch (err) {
        console.error('[HomePage] Data load error:', err);
      }
    }

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const openQuoteForProduct = (product: Product) => {
    setSelectedProduct({
      name: product.name,
      code: product.product_code,
      publicId: product.public_id,
    });
    setQuoteModalOpen(true);
  };

  const openGeneralQuote = () => {
    setSelectedProduct(null);
    setQuoteModalOpen(true);
  };

  const generalWhatsappUrl = buildWhatsAppUrl({
    phone: settings?.whatsapp_number,
    message: buildGeneralEnquiryMessage(settings?.site_name),
  });

  const customWhatsappUrl = buildWhatsAppUrl({
    phone: settings?.whatsapp_number,
    message: buildCustomEnquiryMessage(settings?.site_name),
  });

  return (
    <div className="space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Architectural Grade 304 & 316 Stainless Steel</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Luxury Stainless Steel Furniture Built for Modern Spaces.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Handcrafted in Ahmedabad with medical-grade 304 alloy, titanium PVD finishes, and laser-cut precision. 
              100% termite proof, zero-rust guaranteed, and engineered for generations.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href="/products">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 shadow-lg shadow-amber-500/20"
                >
                  Explore Collection
                </Button>
              </Link>

              <Button
                variant="outline"
                size="lg"
                onClick={openGeneralQuote}
                leftIcon={<Send className="w-4 h-4" />}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Request Quotation
              </Button>

              <a
                href={generalWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Micro Trust Indicators */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-left">
              <div>
                <span className="block text-xl sm:text-2xl font-black text-white">Grade 304</span>
                <span className="text-xs text-slate-400">Pure Austenitic Alloy</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-black text-amber-400">10-Year</span>
                <span className="text-xs text-slate-400">Anti-Corrosion Warranty</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-black text-emerald-400">100%</span>
                <span className="text-xs text-slate-400">Termite & Pest Proof</span>
              </div>
            </div>
          </div>

          {/* Hero Media Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-slate-800">
              <div className="aspect-[4/3] sm:aspect-[16/11] relative">
                <Image
                  src="https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80"
                  alt="SKF Stainless Steel Luxury Dining Table with Italian Marble Top"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 text-white flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-amber-300 block">Featured Craftsmanship</span>
                    <span className="text-sm font-bold block">Verona Sculptural Dining Set</span>
                  </div>
                  <Badge variant="info" size="sm">Mirror Chrome</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Catalog Collections</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Explore by Furniture Category
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              Engineered with heavy-gauge stainless steel for residential living and commercial projects.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-accent)] hover:underline"
          >
            <span>View All Products</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.public_id}
              href={`/products?category=${cat.slug}`}
              className="group block rounded-xl overflow-hidden bg-[var(--surface-surface)] border border-[var(--border-border)] hover:border-[var(--brand-accent)] shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Layers className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                <span className="absolute bottom-3 left-3 text-white font-bold text-base drop-shadow-sm">
                  {cat.name}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {cat.description || `Luxury grade 304 stainless steel ${cat.name.toLowerCase()} fabricated with custom dimensions.`}
                </p>
                <div className="flex items-center text-xs font-semibold text-[var(--brand-primary)] group-hover:text-[var(--brand-accent)] transition-colors pt-1">
                  <span>View Products</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Flagship Designs</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Featured Stainless Steel Creations
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              Customizable in Champagne Gold, Rose Gold, Obsidian Black, and Mirror Polishes.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-accent)] hover:underline"
          >
            <span>Browse Full Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => {
            const productImg = product.primary_image?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
            const productWhatsappUrl = buildWhatsAppUrl({
              phone: settings?.whatsapp_number,
              message: buildProductEnquiryMessage(product.name, product.product_code, settings?.site_name),
            });

            return (
              <div
                key={product.public_id}
                className="rounded-xl overflow-hidden bg-[var(--surface-surface)] border border-[var(--border-border)] hover:border-[var(--brand-accent)] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                {/* Image */}
                <Link href={`/products/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image
                    src={productImg}
                    alt={product.primary_image?.alt_text || product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <Badge variant="primary" size="sm">
                      {product.product_code}
                    </Badge>
                    {product.finish && (
                      <Badge variant="info" size="sm">
                        {product.finish.split(' ')[0]}
                      </Badge>
                    )}
                  </div>
                  {product.category && (
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold">
                      {product.category.name}
                    </span>
                  )}
                </Link>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <Link href={`/products/${product.slug}`} className="block">
                      <h3 className="font-bold text-base text-[var(--text-primary)] hover:text-[var(--brand-accent)] transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {product.short_description || 'High-tensile Grade 304 stainless steel craftsmanship with custom sizing.'}
                    </p>
                    {product.material && (
                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 pt-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{product.material}</span>
                      </div>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="pt-3 border-t border-[var(--border-border)] flex items-center justify-between gap-2">
                    <Link href={`/products/${product.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        View Details
                      </Button>
                    </Link>
                    <a
                      href={productWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      title="Chat on WhatsApp about this product"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                    </a>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openQuoteForProduct(product)}
                      className="text-xs"
                    >
                      Quote
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. WHY SKF TRUST SECTION */}
      <section className="bg-[var(--surface-muted)] py-16 px-4 sm:px-6 lg:px-8 border-y border-[var(--border-border)]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="info" size="sm">The SKF Advantage</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Why Discerning Architects & Homeowners Choose SKF
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              We fabricate stainless steel furniture to architectural engineering standards. No hollow compromises, no cheap electroplating.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)]">Genuine Grade 304 & 316</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Fabricated with high-nickel austenitic stainless steel certified against corrosion, acidic exposure, and coastal humidity.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)]">100% Termite & Moisture Proof</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Unlike wooden or particle-board alternatives, stainless steel never rots, absorbs water, swells, or attracts woodboring pests.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)]">Titanium PVD Color Coatings</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Physical Vapor Deposition (PVD) molecular bonding creates ultra-hard, scratch-resistant finishes in Champagne Gold, Rose Gold, and Obsidian Black.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)]">Seamless Robotic Welds</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Every joint is precision TIG-welded and ground flush by seasoned craftsmen, resulting in seamless monocoque strength with no visible screws.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Factory className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)]">Direct Manufacturer Pricing</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                You purchase directly from our Gujarat industrial fabrication facility, bypassing dealer markups with transparent custom quotes.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)]">Bespoke Customization</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Need specific table lengths, marble combinations, or corporate logo laser etching? Our in-house engineering team executes your exact blueprints.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CUSTOM FURNITURE CALL-OUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 lg:p-12 border border-slate-700 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center lg:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
              Bespoke Fabrication Service
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Have a Custom Stainless Steel Architectural Concept?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We collaborate with luxury homeowners, architects, and hospitality designers. Share your sketches, dimensions, or 3D models with our engineering team for instant quotation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link href="/contact">
              <Button variant="primary" size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold">
                Submit Drawing / Contact
              </Button>
            </Link>
            <a
              href={customWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Discuss via WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* 6. GALLERY PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>Project Showcase</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Completed Client Installations
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              Real stainless steel furniture installations executed across high-end villas, restaurants, and penthouses.
            </p>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-accent)] hover:underline"
          >
            <span>View Full Gallery</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {galleries.map((item) => {
            const firstImg = item.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80';
            return (
              <Link
                key={item.public_id}
                href="/gallery"
                className="group block rounded-xl overflow-hidden bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs hover:shadow-lg transition-all"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                  <Image
                    src={firstImg}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    {item.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                        {item.category}
                      </span>
                    )}
                    <h4 className="font-bold text-sm line-clamp-1">{item.title}</h4>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 7. VERIFIED REVIEWS SECTION */}
      {reviews.length > 0 && (
        <section className="bg-[var(--surface-muted)] py-16 px-4 sm:px-6 lg:px-8 border-y border-[var(--border-border)]">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <Badge variant="success" size="sm">Client Testimonials</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Trusted by Homeowners & Architects
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                Authentic feedback from clients who commissioned bespoke stainless steel furniture from SKF.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {reviews.map((rev) => (
                <div
                  key={rev.public_id}
                  className="p-6 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                      &ldquo;{rev.review_text}&rdquo;
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[var(--border-border)]">
                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                      {rev.customer_name}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Commission
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. FINAL CONVERSION CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[var(--brand-primary)] text-white p-8 lg:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Transform Your Space
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Ready to Upgrade to Surgical-Grade Stainless Steel?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Connect with SKF Furniture today. Request an itemized quotation, discuss custom dimensions with our engineering team, or visit our Ahmedabad factory.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={openGeneralQuote}
              leftIcon={<Send className="w-4 h-4" />}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3"
            >
              Request a Free Quote
            </Button>

            <a
              href={generalWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Instant WhatsApp Inquiry</span>
            </a>

            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Factory Location & Map
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quote Modal */}
      <EnquiryModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        productName={selectedProduct?.name}
        productCode={selectedProduct?.code}
        productPublicId={selectedProduct?.publicId}
        source="home_page"
        settings={settings}
      />
    </div>
  );
}
