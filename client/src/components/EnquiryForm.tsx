'use client';

import React, { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { submitEnquiry } from '@/lib/api';
import { buildWhatsAppUrl, buildGeneralEnquiryMessage } from '@/lib/whatsapp';
import type { WebsiteSettings } from '@/types';

export interface EnquiryFormProps {
  source?: string;
  settings?: WebsiteSettings | null;
  className?: string;
  defaultSubject?: string;
}

export function EnquiryForm({
  source = 'contact_page',
  settings,
  className = '',
  defaultSubject,
}: EnquiryFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(defaultSubject ? `Inquiry regarding: ${defaultSubject}` : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await submitEnquiry({
        customer_name: name.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        source,
        message: message.trim() || undefined,
      });

      setIsSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to submit enquiry right now. Please reach us via WhatsApp or direct call.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappUrl = buildWhatsAppUrl({
    phone: settings?.whatsapp_number,
    message: buildGeneralEnquiryMessage(settings?.site_name),
  });

  if (isSuccess) {
    return (
      <div className={`p-8 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs text-center space-y-4 ${className}`}>
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Enquiry Received!</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            Thank you! Your quotation request has been submitted successfully. Our engineering and sales team will contact you shortly.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsSuccess(false)}>
            Submit Another Inquiry
          </Button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Connect via WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-6 sm:p-8 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-4 ${className}`}
    >
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Send Us an Enquiry</h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Fill in your details for custom quotations, architectural blueprints, or catalog pricing.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="enquiry-name"
          label="Full Name *"
          placeholder="e.g. Ramesh Mehta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          id="enquiry-phone"
          label="Phone / Mobile Number *"
          type="tel"
          placeholder="e.g. +91 98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <Input
        id="enquiry-email"
        label="Email Address (Optional)"
        type="email"
        placeholder="e.g. ramesh@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="flex flex-col gap-1.5 text-xs">
        <label htmlFor="enquiry-message" className="font-medium text-[var(--text-secondary)]">
          Requirement & Dimensions (Optional)
        </label>
        <textarea
          id="enquiry-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] transition-all resize-none"
          placeholder="Describe your furniture requirement, preferred steel grade (304 or 316), PVD finish, delivery city..."
        />
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors border border-emerald-200"
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          Need Fast Response? WhatsApp Us
        </a>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          leftIcon={<Send className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Submit Enquiry
        </Button>
      </div>
    </form>
  );
}

export default EnquiryForm;
