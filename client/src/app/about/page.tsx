'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Factory,
  Award,
  Layers,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Send,
  Building2,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import EnquiryModal from '@/components/EnquiryModal';
import { getPublicSettings } from '@/lib/api';
import { buildWhatsAppUrl, buildGeneralEnquiryMessage } from '@/lib/whatsapp';
import type { WebsiteSettings } from '@/types';

export default function AboutPage() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const data = await getPublicSettings();
        if (isMounted && data) setSettings(data);
      } catch (err) {
        console.error('[AboutPage] Error loading settings:', err);
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const whatsappUrl = buildWhatsAppUrl({
    phone: settings?.whatsapp_number,
    message: buildGeneralEnquiryMessage(settings?.site_name),
  });

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Header Banner */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto space-y-4 relative z-10">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-semibold">About Us</span>
          </nav>
          <div className="max-w-3xl space-y-3">
            <Badge variant="info" size="sm">Master Metal Craftsmanship</Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Pioneering Luxury Stainless Steel Furniture
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              SKF Stainless Steel Furniture is an architectural metal fabrication atelier based in Ahmedabad, Gujarat. 
              We transform high-tensile austenitic stainless steel into enduring residential heirlooms and heavy-duty commercial installations.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Core Story & Manufacturing Capability */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider">
              <Factory className="w-4 h-4" />
              <span>Our Philosophy & Process</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Built to Outlast Generations. Zero Compromises on Metallurgy.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Traditional furniture made of wood or composite board suffers from humidity expansion, woodboring pests, termite infestations, and formaldehyde emissions. 
              SKF was established to eliminate these vulnerabilities by bringing high-grade austenitic stainless steel into interior living.
            </p>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Operating directly from our industrial fabrication facility in Vatva GIDC, Ahmedabad, our team couples high-precision fiber laser cutting and CNC tube bending with time-tested manual TIG welding and 800-grit mirror buffing.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-border)] space-y-1">
                <span className="block text-xl sm:text-2xl font-black text-[var(--text-primary)]">AISI 304 & 316</span>
                <span className="text-xs text-[var(--text-muted)]">Pure certified virgin steel only</span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-border)] space-y-1">
                <span className="block text-xl sm:text-2xl font-black text-[var(--brand-accent)]">Titanium PVD</span>
                <span className="text-xs text-[var(--text-muted)]">Scratch-proof vapor bonded colors</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-[var(--border-border)] bg-slate-100">
              <Image
                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80"
                alt="SKF Stainless Steel Workshop and Fabrication"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 600px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-900/90 text-white backdrop-blur-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">Ahmedabad Fabrication Facility</span>
                  <span className="text-[11px] text-slate-300">GIDC Phase 2, Vatva, Gujarat</span>
                </div>
                <Badge variant="primary" size="sm">Direct Factory</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 4 Metallurgical Pillars */}
      <section className="bg-[var(--surface-muted)] py-16 px-4 sm:px-6 lg:px-8 border-y border-[var(--border-border)]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="info" size="sm">Material Science</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Engineered Around Four Fundamental Standards
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Every table, bed, cabinet, and console leaving our factory floor adheres to rigorous structural criteria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">Anti-Corrosive Integrity</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Chromium and nickel content in our 304/316 steel forms a continuous passive self-healing oxide film that guarantees zero rust.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">Biological Immunity</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Completely impervious to termites, borer beetles, fungal mold, and bacterial colonies. 100% sterile and effortlessly sanitized.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">PVD Molecular Fusion</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Color is not sprayed paint. Titanium vapor bonds atomically to the steel under high vacuum, delivering lifetime luster and scratch resilience.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">Eco-Friendly Lifecycle</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Zero volatile organic compounds (VOCs), zero deforestation, and 100% endlessly recyclable at end of lifecycle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Residential & Commercial Capability */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider block">
            Scope of Service
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Tailored for Luxury Homes & Heavy Commercial Demands
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Residential Luxury Collections</h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Sculptural dining tables paired with genuine Italian Statuario and Nero Marquina marbles, bespoke 304 bedframes in Champagne Gold PVD, modular rust-free wardrobes, and curved lounge seating for discerning villas and penthouses.
            </p>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Custom dimensions to match architect floorplans</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Rose Gold, Champagne Gold & Obsidian Black PVD finishes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Blum German concealed soft-close motion hardware</span>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Commercial & Industrial Fabrication</h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Heavy-duty Grade 316 marine steel kitchen preparation stations, pharmaceutical cleanroom furniture, hospital crash carts, boutique hotel lounge seating, and architectural balustrades.
            </p>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Acid-resistant Grade 316 steel for pharmaceutical & food labs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Reinforced hat-channel damping for zero vibration</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Volume manufacturing with GST invoicing & pan-India logistics</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Conversion CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[var(--brand-primary)] text-white p-8 lg:p-12 text-center space-y-6 shadow-xl">
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Work Directly With Our Metal Crafters
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Have questions regarding stainless steel grades, custom measurements, or trade pricing? Contact our Ahmedabad workshop team today.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setQuoteModalOpen(true)}
              leftIcon={<Send className="w-4 h-4" />}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3"
            >
              Request Custom Quote
            </Button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Our Team</span>
            </a>
          </div>
        </div>
      </section>

      {/* Quote Modal */}
      <EnquiryModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        source="about_page"
        settings={settings}
      />
    </div>
  );
}
