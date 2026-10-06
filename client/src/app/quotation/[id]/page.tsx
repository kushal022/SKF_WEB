'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  HelpCircle,
  Share2,
  Copy,
  Check,
  MessageSquare,
  FileEdit,
} from 'lucide-react';
import {
  getPublicQuotation,
  acceptPublicQuotation,
  rejectPublicQuotation,
  getPublicSettings,
} from '@/lib/api';
import { buildWhatsAppUrl, buildQuotationShareMessage } from '@/lib/whatsapp';
import type { QuotationDetail, WebsiteSettings } from '@/types';

export default function ClientPublicQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const quotationId = resolvedParams.id;

  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Action States
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [quotationData, settingsData] = await Promise.all([
          getPublicQuotation(quotationId),
          getPublicSettings(),
        ]);
        if (!ignore) {
          setQuotation(quotationData);
          if (settingsData) setSettings(settingsData);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load quotation');
          setLoading(false);
        }
      }
    }

    if (quotationId) {
      loadData();
    }

    return () => {
      ignore = true;
    };
  }, [quotationId]);

  const handleAccept = async () => {
    try {
      setSubmittingAction(true);
      const updated = await acceptPublicQuotation(quotationId);
      setQuotation(updated);
      setIsAcceptModalOpen(false);
      setActionFeedback('Quotation accepted successfully! Our project team has been notified.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error accepting quotation');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmittingAction(true);
      const updated = await rejectPublicQuotation(quotationId, rejectReason.trim());
      setQuotation(updated);
      setIsRejectModalOpen(false);
      setActionFeedback('Quotation marked as declined. Thank you for your review.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error declining quotation');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRequestChange = () => {
    if (!quotation) return;
    const msg = [
      `Hello ${settings?.site_name || 'SKF Furniture'},`,
      `Regarding Quotation No: ${quotation.quotation_number} (${quotation.customer_name}):`,
      changeNotes.trim() ? `Requested Changes: ${changeNotes.trim()}` : `I would like to discuss revisions to specifications/dimensions.`,
      `Please connect with me.`,
    ].join('\n');

    const url = buildWhatsAppUrl({
      phone: settings?.whatsapp_number,
      message: msg,
    });

    window.open(url, '_blank');
    setIsChangeModalOpen(false);
    setActionFeedback('Change request forwarded to your sales representative via WhatsApp.');
  };

  const handlePrint = () => {
    if (quotation) {
      const orig = document.title;
      document.title = `SKF-Quotation-${quotation.quotation_number}`;
      window.print();
      document.title = orig;
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    if (!quotation) return;
    const shareMessage = buildQuotationShareMessage(
      {
        quotation_number: quotation.quotation_number,
        customer_name: quotation.customer_name,
        total_amount: quotation.total_amount,
        valid_until: quotation.valid_until ? formatDate(quotation.valid_until) : null,
      },
      settings?.site_name
    );
    const fullText = `${shareMessage}\n\nReview Proposal Link: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading secure quotation proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 text-center bg-white rounded-2xl shadow-md border border-slate-200 space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Quotation Unavailable</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {error || 'This quotation could not be found or has not yet been published for public review.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Try Again
            </button>
            <a
              href={`tel:${(settings?.phone || '+91-9876543210').replace(/\s+/g, '')}`}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Call SKF Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isSent = quotation.status === 'sent';
  const isAccepted = quotation.status === 'accepted';
  const isRejected = quotation.status === 'rejected';
  const isExpired = quotation.status === 'expired';

  const companyName = settings?.site_name || 'SKF Stainless Steel Furniture';
  const companyTagline = settings?.tagline || 'Industrial & Architectural Stainless Steel Works';
  const companyPhone = settings?.phone || '+91-9876543210';
  const companyEmail = settings?.email || 'sales@skffurniture.com';
  const companyAddress = settings?.address || 'Plot No. 42, GIDC Industrial Estate, Phase 2, Vatva, Ahmedabad, Gujarat 382445, India';
  const gstin = '27AABCS1429B1Z';

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner Controls (Hidden in Print) */}
        <div className="print:hidden space-y-3">
          {actionFeedback && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium flex items-center justify-between">
              <span>{actionFeedback}</span>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-blue-700 hover:text-blue-900 text-xs underline font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {isAccepted && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Quotation Accepted</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  You have accepted this quotation. Order processing and fabrication queue scheduling have been initiated.
                </p>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-900">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Quotation Declined</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  This quotation was marked as declined. Please contact our desk if you wish to receive a revised proposal.
                </p>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Quotation Expired</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  The validity period for this proposal has ended. Please connect with our sales desk to renew pricing.
                </p>
              </div>
            </div>
          )}

          {isSent && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="font-bold text-sm">Ready for Your Review &amp; Approval</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Please review the itemized specifications below. You can approve, decline, or request modifications to this commercial quotation online.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsChangeModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/20 text-slate-200 hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Request Change</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-400/40 text-rose-300 hover:bg-rose-950/40 transition-colors"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => setIsAcceptModalOpen(true)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
                >
                  Accept Quotation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Paper Document / Quotation Invoice */}
        <div className="p-8 sm:p-12 shadow-md rounded-2xl border border-slate-200 bg-white text-slate-900 font-sans print:shadow-none print:border-none print:p-0 print:m-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-lg tracking-wider">
                  SKF
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
                    {companyName}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                    {companyTagline}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-0.5 pt-2">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{companyAddress}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {companyPhone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> {companyEmail}
                  </span>
                  <span className="font-semibold text-slate-700">GSTIN: {gstin}</span>
                </div>
              </div>
            </div>

            {/* Document Info */}
            <div className="sm:text-right shrink-0">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded mb-2">
                Commercial Proposal
              </span>
              <div className="font-mono text-xl font-black text-slate-900">
                {quotation.quotation_number}
              </div>
              <div className="text-xs text-slate-600 mt-1.5 space-y-0.5">
                <div>
                  <span>Date: </span>
                  <strong className="text-slate-900">{formatDate(quotation.created_at)}</strong>
                </div>
                <div>
                  <span>Valid Until: </span>
                  <strong className="text-slate-900">
                    {quotation.valid_until ? formatDate(quotation.valid_until) : '30 Days from issue'}
                  </strong>
                </div>
              </div>
              <div className="mt-2.5 sm:flex sm:justify-end">
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                    isAccepted
                      ? 'bg-emerald-100 text-emerald-800'
                      : isRejected
                      ? 'bg-rose-100 text-rose-800'
                      : isExpired
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  Status: {quotation.status}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Project Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Prepared For:
              </span>
              <h4 className="text-base font-bold text-slate-900">{quotation.customer_name}</h4>
              <p className="text-xs text-slate-600 mt-0.5">{quotation.customer_phone}</p>
              {quotation.customer_email && (
                <p className="text-xs text-slate-600">{quotation.customer_email}</p>
              )}
            </div>

            <div className="sm:text-right text-xs text-slate-600 space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Terms &amp; Fabrication:
              </span>
              <p>50% Advance with Order; Balance before Dispatch</p>
              <p>Fabrication Grade: SS 304 / 316 Architectural</p>
              <p>Standard Lead Time: 10–14 Working Days</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-6 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-2 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-2 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Customization</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quotation.items.map((item, index) => (
                  <tr key={item.public_id} className="text-slate-800">
                    <td className="py-3.5 px-2 text-center font-mono text-slate-400">{index + 1}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900">{item.description}</td>
                    <td className="py-3.5 px-2 text-right whitespace-nowrap">{item.quantity} Nos</td>
                    <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                      {item.customization_amount > 0 ? `+${formatCurrency(item.customization_amount)}` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-rose-600 whitespace-nowrap">
                      {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t-2 border-slate-900">
            <div className="text-xs text-slate-600 space-y-4">
              {quotation.notes && (
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Proposal Notes:</span>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {quotation.notes}
                  </p>
                </div>
              )}
              <div>
                <span className="font-bold text-slate-900 block mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Commercial &amp; Quality Warranty:
                </span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>5-year rust-free warranty on Grade 304 and 10-year on Grade 316.</li>
                  <li>Tolerance standards maintained within ±1mm per architectural drawing.</li>
                  <li>Standard 18% GST invoice provided upon receipt of commercial payments.</li>
                </ul>
              </div>
            </div>

            <div className="sm:pl-6 space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal:</span>
                  <span className="font-mono">{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.customization_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Customization Charges:</span>
                    <span className="font-mono">+{formatCurrency(quotation.customization_amount)}</span>
                  </div>
                )}
                {quotation.transport_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Transport / Logistics:</span>
                    <span className="font-mono">+{formatCurrency(quotation.transport_amount)}</span>
                  </div>
                )}
                {quotation.installation_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Site Installation:</span>
                    <span className="font-mono">+{formatCurrency(quotation.installation_amount)}</span>
                  </div>
                )}
                {quotation.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Special Discount:</span>
                    <span className="font-mono">-{formatCurrency(quotation.discount_amount)}</span>
                  </div>
                )}
                {quotation.tax_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Applicable GST / Taxes:</span>
                    <span className="font-mono">+{formatCurrency(quotation.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
                  <span>Final Total Amount (INR):</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {formatCurrency(quotation.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-slate-200 print:hidden gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Questions? Call our sales desk at {companyPhone}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            {isSent && (
              <button
                onClick={() => setIsAcceptModalOpen(true)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
              >
                Accept Quotation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Accept Modal */}
      {isAcceptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Confirm Proposal Acceptance</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  You are approving Quotation <strong>{quotation.quotation_number}</strong> for the total amount of <strong>{formatCurrency(quotation.total_amount)}</strong>.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Upon confirmation, our production team will lock your fabrication slot and reach out with the CAD shop drawings.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAcceptModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50"
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={submittingAction}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs"
              >
                {submittingAction ? 'Processing...' : 'Confirm Acceptance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-900 text-base">Decline Proposal</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Please share your reason for declining to help us modify or renegotiate the proposal:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Dimensions need change, budget mismatch, postponed..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50"
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submittingAction}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-500 shadow-xs"
              >
                {submittingAction ? 'Processing...' : 'Decline Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Change Modal */}
      {isChangeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-base">Request Specification Changes</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Let us know what changes you would like on Quotation <strong>{quotation.quotation_number}</strong>:
            </p>
            <textarea
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Change dining table width to 1000mm, change finish to PVD Rose Gold..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsChangeModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChange}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-xs flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
