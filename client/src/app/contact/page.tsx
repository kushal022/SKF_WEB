'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  Building2,
} from 'lucide-react';
import EnquiryForm from '@/components/EnquiryForm';
import { getPublicSettings } from '@/lib/api';
import { buildWhatsAppUrl, buildGeneralEnquiryMessage } from '@/lib/whatsapp';
import { generateLocalBusinessSchema } from '@/lib/seo';
import type { WebsiteSettings } from '@/types';

export default function ContactPage() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const data = await getPublicSettings();
        if (isMounted && data) setSettings(data);
      } catch (err) {
        console.error('[ContactPage] Load settings error:', err);
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const phone = settings?.phone || '+91 98765 43210';
  const email = settings?.email || 'sales@skffurniture.com';
  const address = settings?.address || 'Plot No. 42, GIDC Industrial Estate, Phase 2, Vatva, Ahmedabad, Gujarat 382445, India';
  const hours = settings?.business_hours?.schedule || 'Mon - Sat: 9:00 AM - 7:30 PM (Sunday Closed)';

  const cleanPhone = phone.replace(/\s+/g, '');
  const encodedAddress = encodeURIComponent(address);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const embedMapsUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  const whatsappUrl = buildWhatsAppUrl({
    phone: settings?.whatsapp_number,
    message: buildGeneralEnquiryMessage(settings?.site_name),
  });

  const localBusinessSchema = generateLocalBusinessSchema(settings);

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Structured Data (JSON-LD) LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* Breadcrumb Header */}
      <div className="space-y-3 border-b border-[var(--border-border)] pb-6">
        <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--text-primary)] font-semibold">Contact & Factory</span>
        </nav>

        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>Factory & Atelier</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
            Connect With SKF Furniture
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Reach out to our engineering and estimation team. Request custom itemized quotations, discuss bulk projects, or visit our manufacturing workshop in Ahmedabad.
          </p>
        </div>
      </div>

      {/* Main Contact Grid: Info Cards + Enquiry Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Info Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-[var(--border-border)] bg-[var(--surface-surface)] p-6 space-y-5 shadow-xs">
            <h2 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-border)] pb-3">
              Direct Contact Details
            </h2>

            {/* Phone */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--text-primary)] block">Phone Inquiries</span>
                <a
                  href={`tel:${cleanPhone}`}
                  className="text-sm font-semibold text-[var(--brand-accent)] hover:underline block"
                >
                  {phone}
                </a>
                <span className="text-[11px] text-[var(--text-muted)]">Monday to Saturday, 9 AM - 7:30 PM</span>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--text-primary)] block">WhatsApp Support</span>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-emerald-600 hover:underline block"
                >
                  {settings?.whatsapp_number || phone}
                </a>
                <span className="text-[11px] text-[var(--text-muted)]">Instant drawing sharing & quotes</span>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--text-primary)] block">Email Department</span>
                <a
                  href={`mailto:${email}`}
                  className="text-sm font-semibold text-[var(--text-primary)] hover:underline block"
                >
                  {email}
                </a>
                <span className="text-[11px] text-[var(--text-muted)]">Formal RFQs & CAD drawings</span>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--text-primary)] block">Manufacturing Works</span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {address}
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-accent)] hover:underline pt-1"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-3.5 pt-1 border-t border-[var(--border-border)]">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[var(--text-primary)] block">Working Hours</span>
                <span className="text-xs text-[var(--text-secondary)]">{hours}</span>
              </div>
            </div>
          </div>

          {/* Direct CTA Buttons Grid */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] hover:bg-[var(--surface-muted)] text-xs font-bold text-[var(--text-primary)] transition-colors shadow-2xs"
            >
              <Phone className="w-4 h-4 text-amber-500" />
              <span>Call Us</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors shadow-2xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            <a
              href={`mailto:${email}`}
              className="inline-flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] hover:bg-[var(--surface-muted)] text-xs font-bold text-[var(--text-primary)] transition-colors shadow-2xs"
            >
              <Mail className="w-4 h-4 text-sky-500" />
              <span>Email RFQ</span>
            </a>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] hover:bg-[var(--surface-muted)] text-xs font-bold text-[var(--text-primary)] transition-colors shadow-2xs"
            >
              <MapPin className="w-4 h-4 text-purple-500" />
              <span>Google Maps</span>
            </a>
          </div>
        </div>

        {/* Right Column: Reusable Enquiry Form */}
        <div className="lg:col-span-7">
          <EnquiryForm source="contact_page" settings={settings} />
        </div>
      </div>

      {/* Embedded Google Maps Section */}
      <section className="space-y-4 pt-4 border-t border-[var(--border-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Factory Location
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Industrial Area, Phase 2, Vatva, Ahmedabad, Gujarat
            </p>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] hover:bg-[var(--surface-muted)] text-xs font-semibold text-[var(--brand-accent)] transition-colors"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="rounded-2xl overflow-hidden border border-[var(--border-border)] shadow-xs aspect-[16/7] w-full bg-slate-100 relative">
          <iframe
            title="SKF Stainless Steel Furniture Workshop Location"
            src={embedMapsUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
        </div>
      </section>
    </div>
  );
}
