'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Send,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import EnquiryModal from '@/components/EnquiryModal';
import { getPublicSettings } from '@/lib/api';
import { buildWhatsAppUrl, buildGeneralEnquiryMessage } from '@/lib/whatsapp';
import { generateFAQSchema } from '@/lib/seo';
import type { WebsiteSettings } from '@/types';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS_DATA: FAQItem[] = [
  {
    category: 'Material & Quality',
    question: 'What grades of stainless steel does SKF use for furniture?',
    answer: 'We exclusively fabricate using prime certified AISI Grade 304 and Grade 316 austenitic stainless steel. Grade 304 is ideal for luxury indoor and outdoor residential applications due to its high nickel-chromium composition. Grade 316 contains 2-3% molybdenum, making it superior for harsh marine environments, acid-exposed commercial kitchens, and medical laboratories.',
  },
  {
    category: 'Material & Quality',
    question: 'Will stainless steel furniture ever rust or corrode?',
    answer: 'Genuine Grade 304 and 316 stainless steel will never rust under standard residential or commercial conditions. The alloy naturally creates a transparent chromium-oxide passive film that repairs itself in the presence of oxygen. We provide a 10-Year anti-corrosion guarantee across all our structural frameworks.',
  },
  {
    category: 'Finishes & Colors',
    question: 'How are the Gold, Rose Gold, and Black colors applied?',
    answer: 'We utilize Physical Vapor Deposition (PVD) Titanium coating in high-vacuum chambers. Unlike electroplating or powder coating, PVD fuses titanium metal vapor into the stainless steel surface at a molecular level. This creates a finish that is scratch-resistant, UV-stable, non-tarnishing, and resistant to sweat and cleaning agents.',
  },
  {
    category: 'Customization',
    question: 'Can I order custom dimensions to fit my interior layout?',
    answer: 'Yes! Over 70% of our production consists of bespoke, made-to-order commissions. You can specify precise table lengths, bedframe heights, marble choices, and finish tones. Our design engineering team prepares shop drawings and CAD previews for your approval prior to laser cutting.',
  },
  {
    category: 'Customization',
    question: 'Can SKF match architectural drawings or interior designer blueprints?',
    answer: 'Absolutely. We regularly partner with interior designers, architects, and contractors across India. Send us your CAD drawings, PDF blueprints, or 3D renderings via WhatsApp or email, and we will produce an itemized engineering quote within 24-48 hours.',
  },
  {
    category: 'Delivery & Logistics',
    question: 'Do you deliver across India?',
    answer: 'Yes. We package all furniture in heavy-duty foam-lined export wooden crates with corner shock absorbers. We ship pan-India through insured surface freight logistics partners directly from our Ahmedabad factory to Mumbai, Delhi NCR, Bangalore, Hyderabad, Chennai, Kolkata, and tier-2 cities.',
  },
  {
    category: 'Installation & Assembly',
    question: 'How is the furniture installed at my home or site?',
    answer: 'Smaller furniture like chairs, consoles, and side tables arrive fully assembled. Larger pieces such as king bedframes, 10-seater dining tables, and modular wardrobes are engineered with modular concealed fasteners for quick 30-minute on-site assembly. For major projects in Gujarat and metropolitan cities, our installation technicians can be dispatched.',
  },
  {
    category: 'Ordering & Quotation',
    question: 'What is the quotation and payment process?',
    answer: 'Simply click "Request Quotation" or message us on WhatsApp with the product name or your dimensions. We issue a formal itemized quotation including steel specifications, PVD finish code, timeline, and freight. We initiate fabrication upon advance deposit, and final balance is payable prior to crated dispatch.',
  },
  {
    category: 'Maintenance & Care',
    question: 'How should I clean and maintain my stainless steel furniture?',
    answer: 'Routine maintenance requires nothing more than wiping with a clean microfiber cloth and warm water or mild dish soap. For PVD coated surfaces, avoid chlorine-based bleach or abrasive metal scouring pads. A quick wipe down preserves the lustrous factory shine indefinitely.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const data = await getPublicSettings();
        if (isMounted && data) setSettings(data);
      } catch (err) {
        console.error('[FAQPage] Load settings error:', err);
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const categoriesList = ['All', ...Array.from(new Set(FAQS_DATA.map((f) => f.category)))];

  const filteredFaqs = selectedCategory === 'All'
    ? FAQS_DATA
    : FAQS_DATA.filter((f) => f.category === selectedCategory);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const whatsappUrl = buildWhatsAppUrl({
    phone: settings?.whatsapp_number,
    message: buildGeneralEnquiryMessage(settings?.site_name),
  });

  const faqJsonLd = generateFAQSchema(FAQS_DATA);

  return (
    <div className="space-y-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Breadcrumb Header */}
      <div className="space-y-3 border-b border-[var(--border-border)] pb-6 text-center">
        <nav className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--text-primary)] font-semibold">FAQs</span>
        </nav>

        <Badge variant="info" size="sm">Client Knowledge Base</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
          Everything you need to know about our Grade 304/316 metallurgy, titanium PVD finishes, custom fabrication timelines, and pan-India crated delivery.
        </p>
      </div>

      {/* Filter Categories */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              setOpenIndex(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
              selectedCategory === cat
                ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-border)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)] overflow-hidden shadow-2xs transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-[var(--brand-accent)] shrink-0" />
                  <span className="font-bold text-sm sm:text-base text-[var(--text-primary)] leading-snug">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[var(--brand-accent)]' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-border)] bg-[var(--surface-muted)]/50">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still Have Questions Box */}
      <div className="rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <h3 className="font-bold text-lg text-[var(--text-primary)]">
          Still Have a Specific Question?
        </h3>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
          Our engineering team is readily available to discuss steel thicknesses, load ratings, or provide a quotation for custom blueprints.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setQuoteModalOpen(true)}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Ask Our Engineering Team
          </Button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Quote Modal */}
      <EnquiryModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        source="faq_page"
        settings={settings}
      />
    </div>
  );
}
