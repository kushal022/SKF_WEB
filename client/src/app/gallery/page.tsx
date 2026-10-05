'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Maximize2,
  X,
  ChevronRight,
  MessageSquare,
  Layers,
  Award,
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

export default function GalleryPage() {
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    title: string;
    description?: string | null;
  } | null>(null);

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
        setGalleries(galRes.items);
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
              Executed Installations & Architectural Projects
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
              Explore bespoke stainless steel furniture, partition jalis, dining sets, and commercial prep suites delivered to our clients.
            </p>
          </div>
          <div className="text-xs text-[var(--text-muted)] shrink-0 font-medium">
            Showing <span className="font-bold text-[var(--text-primary)]">{galleries.length}</span> installations
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
            const whatsappUrl = buildWhatsAppUrl({
              phone: settings?.whatsapp_number,
              message: `Hello SKF Furniture, I saw your project "${item.title}" in the gallery and would like to enquire about similar fabrication.`,
            });

            return (
              <div
                key={item.public_id}
                className="rounded-2xl overflow-hidden bg-[var(--surface-surface)] border border-[var(--border-border)] hover:border-[var(--brand-accent)] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                {/* Image Container with Lightbox Trigger */}
                <div
                  className="relative aspect-[4/3] overflow-hidden bg-slate-100 cursor-pointer"
                  onClick={() => setLightboxImage({ url: firstImg, title: item.title, description: item.description })}
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

                  <div className="pt-3 border-t border-[var(--border-border)] flex items-center justify-between gap-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ask via WhatsApp</span>
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openQuoteForProject(item.title)}
                      className="text-xs"
                    >
                      Enquire Similar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2.5 text-white/80 hover:text-white bg-white/10 rounded-full focus:outline-none"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-5xl max-h-[75vh] w-full h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightboxImage.url}
              alt={lightboxImage.title}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          <div className="text-center text-white mt-4 max-w-lg space-y-1" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-base">{lightboxImage.title}</h3>
            {lightboxImage.description && (
              <p className="text-xs text-slate-300">{lightboxImage.description}</p>
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
