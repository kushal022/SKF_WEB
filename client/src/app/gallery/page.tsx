'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Maximize2,
  X,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Layers,
  Award,
  Sparkles,
  Calculator,
  ArrowRight,
  Camera,
} from 'lucide-react';
import { Button, Badge, Skeleton } from '@/components/ui';
import EnquiryModal from '@/components/EnquiryModal';
import { getPublicGalleries, getPublicSettings } from '@/lib/api';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import type { GalleryItem, WebsiteSettings } from '@/types';

const GALLERY_CATEGORIES = [
  'All',
  'Residential',
  'Dining',
  'Living',
  'Commercial',
  'Custom Projects',
];

const INITIAL_GALLERIES: GalleryItem[] = [
  {
    public_id: 'init-gal-1',
    title: 'Verona Sculptural Dining Suite Installation',
    slug: 'verona-dining-installation',
    category: 'Dining',
    description: 'Custom Grade 304 titanium gold dining table with integrated floor mountings and 12mm beveled crystal top.',
    status: 'published',
    images: [
      {
        public_id: 'img-1',
        image_url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
        alt_text: 'Verona Sculptural Dining Suite Installation',
        sort_order: 1,
      },
      {
        public_id: 'img-2',
        image_url: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=1200&q=80',
        alt_text: 'Stainless Steel Detail',
        sort_order: 2,
      },
    ],
  },
  {
    public_id: 'init-gal-2',
    title: 'Aura Minimalist Living Suite & Console',
    slug: 'aura-living-suite',
    category: 'Living',
    description: 'Brushed hairline finish with seamless corner joints in luxury penthouse residence.',
    status: 'published',
    images: [
      {
        public_id: 'img-3',
        image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
        alt_text: 'Aura Minimalist Living Suite & Console',
        sort_order: 1,
      },
    ],
  },
  {
    public_id: 'init-gal-3',
    title: 'Executive Boardroom Table & Display Partition',
    slug: 'executive-boardroom-suite',
    category: 'Commercial',
    description: '14-seater mirror-polished Grade 316 stainless steel boardroom centerpiece with hidden wire management.',
    status: 'published',
    images: [
      {
        public_id: 'img-4',
        image_url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
        alt_text: 'Executive Boardroom Table & Display Partition',
        sort_order: 1,
      },
    ],
  },
];

interface LightboxItem {
  url: string;
  title: string;
  description?: string | null;
  category?: string | null;
}

export default function GalleryPage() {
  const [galleries, setGalleries] = useState<GalleryItem[]>(INITIAL_GALLERIES);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);

  // Multi-image Lightbox State
  const [lightboxItems, setLightboxItems] = useState<LightboxItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // Quote modal
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedProjectTitle, setSelectedProjectTitle] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadGalleries() {
      setLoading(true);
      try {
        const [galRes, settingsRes] = await Promise.all([
          getPublicGalleries({
            category: activeCategory !== 'All' ? activeCategory : undefined,
            limit: 30,
          }),
          getPublicSettings(),
        ]);

        if (!isMounted) return;
        if (galRes?.items?.length > 0) {
          setGalleries(galRes.items);
        } else if (activeCategory !== 'All') {
          setGalleries([]);
        }
        setSettings(settingsRes);
      } catch (err) {
        console.error('[GalleryPage] Load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGalleries();

    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  const openQuoteForProject = (title: string) => {
    setSelectedProjectTitle(title);
    setQuoteModalOpen(true);
  };

  const openLightbox = (item: GalleryItem, initialIndex = 0) => {
    const images: LightboxItem[] = (item.images && item.images.length > 0)
      ? item.images.map((img) => ({
          url: img.image_url,
          title: item.title,
          description: item.description,
          category: item.category,
        }))
      : [
          {
            url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
            title: item.title,
            description: item.description,
            category: item.category,
          },
        ];

    setLightboxItems(images);
    setCurrentIndex(initialIndex);
  };

  const closeLightbox = () => {
    setCurrentIndex(-1);
    setLightboxItems([]);
  };

  const showNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < lightboxItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (lightboxItems.length > 1) {
      setCurrentIndex(0); // loop
    }
  }, [currentIndex, lightboxItems.length]);

  const showPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (lightboxItems.length > 1) {
      setCurrentIndex(lightboxItems.length - 1); // loop
    }
  }, [currentIndex, lightboxItems.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentIndex === -1) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, showNext, showPrev]);

  const currentItem = currentIndex >= 0 ? lightboxItems[currentIndex] : null;

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Header */}
      <div className="space-y-3 border-b border-[var(--border-border)] pb-6">
        <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--text-primary)] font-semibold">Gallery</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>Fabrication Portfolio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
              Executed Installations &amp; Architectural Projects
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
              Explore bespoke stainless steel furniture, partition jalis, dining sets, and commercial prep suites delivered to our clients across India.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/custom-furniture">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--brand-accent)]" />}
                className="text-xs"
              >
                Custom Order
              </Button>
            </Link>
            <div className="text-xs text-[var(--text-muted)] shrink-0 font-medium hidden sm:block">
              Showing <span className="font-bold text-[var(--text-primary)]">{galleries.length}</span> installations
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {GALLERY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-colors ${
              activeCategory === cat
                ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-border)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border-border)] p-4 space-y-3 bg-[var(--surface-surface)]">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : galleries.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--surface-surface)] rounded-2xl border border-[var(--border-border)] space-y-3 max-w-md mx-auto">
          <Layers className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
          <h3 className="font-bold text-base text-[var(--text-primary)]">No Projects Found</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            No projects in this category currently. Try selecting &apos;All&apos; to view all installations.
          </p>
          <Button variant="outline" size="sm" onClick={() => setActiveCategory('All')}>
            View All Projects
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleries.map((item) => {
            const firstImg = item.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80';
            const imgCount = item.images?.length || 1;
            const whatsappUrl = buildWhatsAppUrl({
              phone: settings?.whatsapp_number,
              message: `Hello SKF Furniture, I saw your project "${item.title}" in the gallery and would like to enquire about similar custom fabrication.`,
            });

            return (
              <div
                key={item.public_id}
                className="rounded-2xl overflow-hidden bg-[var(--surface-surface)] border border-[var(--border-border)] hover:border-[var(--brand-accent)] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                {/* Image Container with Lightbox Trigger */}
                <div
                  className="relative aspect-[4/3] overflow-hidden bg-slate-100 cursor-pointer"
                  onClick={() => openLightbox(item, 0)}
                >
                  <Image
                    src={firstImg}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  {item.category && (
                    <Badge variant="primary" size="sm" className="absolute top-3 left-3">
                      {item.category}
                    </Badge>
                  )}

                  {imgCount > 1 && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold flex items-center gap-1 backdrop-blur-xs">
                      <Camera className="w-3 h-3" />
                      <span>{imgCount} Photos</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors"
                    aria-label={`Enlarge ${item.title}`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--brand-accent)] transition-colors">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[var(--border-border)] flex flex-wrap items-center justify-between gap-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/custom-furniture?type=${encodeURIComponent(item.title)}`}
                        className="text-[11px] font-semibold text-[var(--brand-accent)] hover:underline"
                      >
                        Custom Size
                      </Link>
                      <span className="text-[var(--border-border)]">•</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openQuoteForProject(item.title)}
                        className="text-xs"
                      >
                        Enquire
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prominent Conversion Banner */}
      <section className="p-8 sm:p-12 rounded-3xl bg-[var(--brand-primary)] text-white shadow-xl space-y-6">
        <div className="max-w-2xl space-y-2">
          <Badge variant="warning" size="sm">
            Architectural Custom Fabrication
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Have a Bespoke Vision for Your Home or Commercial Project?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every piece in our gallery was manufactured from custom CAD drawings. We fabricate custom dining tables, console frames, partition screens, and kitchen prep suites in Grade 304 &amp; 316.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link href="/custom-furniture">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4 text-slate-950" />}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              Custom Furniture Studio
            </Button>
          </Link>

          <Link href="/estimator">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Calculator className="w-4 h-4" />}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Instant Cost Estimator
            </Button>
          </Link>

          <Link href="/products">
            <Button
              variant="ghost"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="text-slate-300 hover:text-white"
            >
              Browse Catalog
            </Button>
          </Link>
        </div>
      </section>

      {/* Enhanced Lightbox Modal */}
      {currentItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
          onClick={closeLightbox}
        >
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded">
                {currentIndex + 1} / {lightboxItems.length}
              </span>
              {currentItem.category && (
                <span className="text-xs text-amber-400 font-semibold">
                  {currentItem.category}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={closeLightbox}
              className="p-2.5 text-white/80 hover:text-white bg-white/10 rounded-full focus:outline-none transition-colors"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Arrows */}
          {lightboxItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full focus:outline-none transition-colors z-10"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full focus:outline-none transition-colors z-10"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Main Photo View */}
          <div
            className="relative max-w-5xl max-h-[75vh] w-full h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentItem.url}
              alt={currentItem.title}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Caption & Project Context */}
          <div className="text-center text-white mt-4 max-w-lg space-y-1.5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-base">{currentItem.title}</h3>
            {currentItem.description && (
              <p className="text-xs text-slate-300 leading-relaxed">{currentItem.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Enquiry Modal */}
      <EnquiryModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        productName={selectedProjectTitle}
        source="gallery_page"
        settings={settings}
      />
    </div>
  );
}
