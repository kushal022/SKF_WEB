'use client';

import React, { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { submitEnquiry } from '@/lib/api';
import { buildWhatsAppUrl, buildProductEnquiryMessage, buildGeneralEnquiryMessage } from '@/lib/whatsapp';
import type { WebsiteSettings } from '@/types';

export interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  productCode?: string;
  productPublicId?: string;
  source?: string;
  settings?: WebsiteSettings | null;
}

export function EnquiryModal({
  isOpen,
  onClose,
  productName,
  productCode,
  productPublicId,
  source = 'website',
  settings,
}: EnquiryModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const defaultMessage = productName && productCode
    ? `I am interested in ${productName} (Code: ${productCode}). Please share quotation, lead time, and customization options.`
    : 'I would like to enquire about your stainless steel furniture collection and receive a quotation.';

  const displayMessage = customMessage || defaultMessage;

  const handleClose = () => {
    setIsSuccess(false);
    setErrorMessage('');
    onClose();
  };

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
        product_public_id: productPublicId || undefined,
        source: source || 'quote_modal',
        message: displayMessage.trim() || undefined,
      });

      setIsSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setCustomMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to submit enquiry right now. Please try via WhatsApp or call us directly.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappUrl = buildWhatsAppUrl({
    phone: settings?.whatsapp_number,
    message: productName && productCode
      ? buildProductEnquiryMessage(productName, productCode, settings?.site_name)
      : buildGeneralEnquiryMessage(settings?.site_name),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={productName ? `Request Quotation — ${productName}` : 'Request a Custom Quotation'}
      maxWidth="md"
    >
      {isSuccess ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-[var(--text-primary)]">Enquiry Submitted!</h4>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
              Thank you! Your quotation request has been submitted successfully. Our engineering and sales team will contact you shortly.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Close
            </Button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Chat on WhatsApp Now
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {productName && (
            <div className="p-3 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-border)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[var(--text-primary)] block">{productName}</span>
                <span className="text-[var(--text-muted)]">Code: {productCode}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[var(--surface-surface)] border border-[var(--border-border)] font-medium text-[var(--brand-primary)]">
                Selected Item
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <Input
            id="quote-name"
            label="Full Name *"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            id="quote-phone"
            label="Phone Number (Mobile / WhatsApp) *"
            type="tel"
            placeholder="e.g. +91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Input
            id="quote-email"
            label="Email Address (Optional)"
            type="email"
            placeholder="e.g. rahul@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex flex-col gap-1.5 text-xs">
            <label htmlFor="quote-message" className="font-medium text-[var(--text-secondary)]">
              Requirement / Customization Details
            </label>
            <textarea
              id="quote-message"
              rows={3}
              value={displayMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] transition-all resize-none"
              placeholder="Specify custom dimensions, finish preference, quantity, or delivery city..."
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
              Prefer WhatsApp? Click Here
            </a>

            <div className="w-full sm:w-auto flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send Request
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default EnquiryModal;
