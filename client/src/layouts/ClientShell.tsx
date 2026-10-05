'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Download,
  Sparkles,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Mail,
  ShieldCheck,
  ChevronRight,
  Send,
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Drawer, Button, OfflineBanner } from '@/components/ui';
import EnquiryModal from '@/components/EnquiryModal';
import { getPublicSettings, getPublicCategories } from '@/lib/api';
import { buildWhatsAppUrl, buildGeneralEnquiryMessage } from '@/lib/whatsapp';
import type { WebsiteSettings, Category } from '@/types';

export interface ClientShellProps {
  children: React.ReactNode;
}

export function ClientShell({ children }: ClientShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const { canInstall, isOnline, promptInstall } = usePWAInstall();

  useEffect(() => {
    let isMounted = true;
    async function loadShellData() {
      try {
        const [settingsData, categoriesData] = await Promise.all([
          getPublicSettings(),
          getPublicCategories({ limit: 6 }),
        ]);
        if (!isMounted) return;
        if (settingsData) setSettings(settingsData);
        if (categoriesData?.items) setCategories(categoriesData.items);
      } catch (err) {
        console.error('[ClientShell] Data loading error:', err);
      }
    }
    loadShellData();
    return () => {
      isMounted = false;
    };
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'About', href: '/about' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ];

  const whatsappUrl = buildWhatsAppUrl({
    phone: settings?.whatsapp_number,
    message: buildGeneralEnquiryMessage(settings?.site_name),
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-background)] text-[var(--text-primary)]">
      {/* Offline Alert Bar */}
      {!isOnline && (
        <OfflineBanner message="You are currently browsing offline. Cached pages and product catalogs remain accessible." />
      )}

      {/* Top Value Proposition & Contact Bar */}
      <div className="bg-[var(--brand-primary)] text-white text-xs py-2 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate font-medium">
              {settings?.tagline || 'Precision 304 & 316 Stainless Steel Craftsmanship • Direct Manufacturer'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 shrink-0 text-slate-300">
            {settings?.phone && (
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Phone className="w-3 h-3 text-amber-400" />
                <span>{settings.phone}</span>
              </a>
            )}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
            </a>
            {canInstall && (
              <button
                onClick={promptInstall}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-medium text-[11px] transition-colors"
              >
                <Download className="w-3 h-3" />
                Install App
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Header & Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[var(--surface-surface)]/95 backdrop-blur-md border-b border-[var(--border-border)] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center text-white font-black tracking-widest text-sm shadow-md border border-slate-700 group-hover:scale-105 transition-transform">
              SKF
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)] block leading-tight">
                {settings?.site_name ? settings.site_name.replace(' Furniture', '') : 'SKF Stainless Steel'}
              </span>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-widest uppercase block">
                Architectural Furniture
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors py-1 relative ${
                    isActive
                      ? 'text-[var(--brand-primary)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-accent)] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setQuoteModalOpen(true)}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              Get Quote
            </Button>

            {/* Mobile Navigation Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="SKF Furniture Menu"
        position="right"
      >
        <div className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-1 text-sm font-medium">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3.5 py-3 rounded-lg flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-[var(--surface-muted)] font-bold text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[var(--border-border)] space-y-2.5">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                setQuoteModalOpen(true);
              }}
              leftIcon={<Send className="w-4 h-4" />}
              className="w-full"
            >
              Request Quote
            </Button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Chat on WhatsApp
            </a>

            {settings?.phone && (
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-muted)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--border-border)] transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Call {settings.phone}
              </a>
            )}

            {canInstall && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  promptInstall();
                }}
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full mt-2"
              >
                Install Client PWA
              </Button>
            )}
          </div>
        </div>
      </Drawer>

      {/* Main Page Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Quote / Enquiry Modal */}
      <EnquiryModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        source="header_quote_cta"
        settings={settings}
      />

      {/* Production Footer */}
      <footer className="bg-[var(--brand-primary)] text-white border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white text-slate-900 flex items-center justify-center font-black text-sm">
                  SKF
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-tight text-white block">
                    {settings?.site_name || 'SKF Stainless Steel Furniture'}
                  </span>
                  <span className="text-[11px] text-slate-400 tracking-wider uppercase block">
                    Manufacturer & Fabricator
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                Specializing in luxury architectural Grade 304 and 316 stainless steel furniture. 
                From bespoke residential dining suites and bedframes to certified commercial workstations.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>10-Year Rust Guarantee</span>
                </div>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400">100% Termite Proof</span>
              </div>
            </div>

            {/* Quick Navigation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3.5">
                Explore
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/products" className="hover:text-white transition-colors">Product Catalog</Link></li>
                <li><Link href="/gallery" className="hover:text-white transition-colors">Completed Projects</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">Our Manufacturing</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">Client FAQs</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact & Factory</Link></li>
              </ul>
            </div>

            {/* Product Categories */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3.5">
                Categories
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <li key={cat.public_id}>
                      <Link
                        href={`/products?category=${cat.slug}`}
                        className="hover:text-white transition-colors"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li><Link href="/products?category=ss-beds" className="hover:text-white">Beds</Link></li>
                    <li><Link href="/products?category=ss-dining-tables" className="hover:text-white">Dining Tables</Link></li>
                    <li><Link href="/products?category=ss-sofas" className="hover:text-white">Sofas</Link></li>
                    <li><Link href="/products?category=ss-wardrobes" className="hover:text-white">Wardrobes</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* Contact & Hours */}
            <div className="space-y-3 text-xs text-slate-400">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3.5">
                Factory & Showroom
              </h4>

              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {settings?.address || 'Plot No. 42, GIDC Industrial Estate, Phase 2, Vatva, Ahmedabad, Gujarat 382445, India'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href={`tel:${(settings?.phone || '+91 98765 43210').replace(/\s+/g, '')}`} className="hover:text-white">
                  {settings?.phone || '+91 98765 43210'}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href={`mailto:${settings?.email || 'sales@skffurniture.com'}`} className="hover:text-white">
                  {settings?.email || 'sales@skffurniture.com'}
                </a>
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-slate-800">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  {settings?.business_hours?.schedule || 'Mon - Sat: 9:00 AM - 7:30 PM (Sunday Closed)'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Badges */}
          <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} {settings?.site_name || 'SKF Stainless Steel Furniture'}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PWA Certified Offline Ready
              </span>
              <Link href="/contact" className="hover:text-slate-400 transition-colors">
                Privacy & Inquiries
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ClientShell;
