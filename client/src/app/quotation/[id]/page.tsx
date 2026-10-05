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
} from 'lucide-react';

interface QuotationItemProduct {
  name: string;
  slug: string;
  product_code?: string;
}

interface QuotationItem {
  public_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  customization_amount: number;
  discount_amount: number;
  line_total: number;
  product?: QuotationItemProduct | null;
}

interface QuotationDetail {
  public_id: string;
  quotation_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  subtotal: number;
  customization_amount: number;
  transport_amount: number;
  installation_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  valid_until?: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  notes?: string | null;
  items: QuotationItem[];
  created_at: string;
}

export default function ClientPublicQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const quotationId = resolvedParams.id;

  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api/v1';

  useEffect(() => {
    let ignore = false;

    async function loadQuotation() {
      try {
        const res = await fetch(`${apiUrl}/quotations/${quotationId}`);
        const data = await res.json();
        if (!ignore) {
          if (!res.ok) {
            setError(data.message || 'Quotation not found or unavailable');
          } else {
            setQuotation(data.data?.quotation);
          }
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
      loadQuotation();
    }

    return () => {
      ignore = true;
    };
  }, [quotationId, apiUrl]);

  const handleAccept = async () => {
    try {
      setSubmittingAction(true);
      const res = await fetch(`${apiUrl}/quotations/${quotationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to accept quotation');
      }
      setQuotation(data.data?.quotation);
      setIsAcceptModalOpen(false);
      setActionFeedback('Quotation accepted successfully! Our project team will be in touch.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error accepting quotation');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmittingAction(true);
      const res = await fetch(`${apiUrl}/quotations/${quotationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to decline quotation');
      }
      setQuotation(data.data?.quotation);
      setIsRejectModalOpen(false);
      setActionFeedback('Quotation declined. Thank you for your review.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error declining quotation');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handlePrint = () => {
    if (quotation) {
      const orig = document.title;
      document.title = `SKF-Quotation-${quotation.quotation_number}`;
      window.print();
      document.title = orig;
    }
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
          <p className="text-sm font-medium text-slate-600">Loading secure quotation...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 text-center bg-white rounded-2xl shadow-md border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Quotation Unavailable</h2>
          <p className="text-sm text-slate-600 mt-2">{error || 'This quotation could not be found or has not been published.'}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Try Again
            </button>
            <a
              href="tel:+919876543210"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
            >
              Contact SKF Support
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

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner */}
        <div className="print:hidden">
          {actionFeedback && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 mb-4 text-xs font-medium">
              {actionFeedback}
            </div>
          )}

          {isAccepted && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Quotation Accepted</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  You have accepted this quotation. Order processing has been initiated by the SKF manufacturing team.
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
                  This quotation was marked as declined. Please contact our desk for revised specifications.
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
                  The validity period for this proposal has ended.
                </p>
              </div>
            </div>
          )}

          {isSent && (
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="font-bold text-sm">Ready for Your Review &amp; Approval</h4>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Please review the itemized specifications below. You can approve or decline this quotation online.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/30 text-white hover:bg-white/10"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => setIsAcceptModalOpen(true)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                >
                  Accept Quotation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Paper Document */}
        <div className="p-8 sm:p-12 shadow-md rounded-2xl border border-slate-200 bg-white text-slate-900 font-sans print:shadow-none print:border-none print:p-0 print:m-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-lg tracking-wider">
                  SKF
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
                    SKF Stainless Steel Furniture
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                    Industrial &amp; Architectural Stainless Steel
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-0.5 pt-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Plot No. 42, Industrial Estate, Mumbai &amp; Pune Expressway, Maharashtra</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> +91-9876543210
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> sales@skffurniture.com
                  </span>
                  <span className="font-semibold text-slate-700">GSTIN: 27AABCS1429B1Z</span>
                </div>
              </div>
            </div>

            {/* Document Info */}
            <div className="sm:text-right shrink-0">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded mb-2">
                Commercial Quotation
              </span>
              <div className="font-mono text-lg font-black text-slate-900">
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
                    {quotation.valid_until ? formatDate(quotation.valid_until) : '30 Days'}
                  </strong>
                </div>
              </div>
              <div className="mt-2.5 sm:flex sm:justify-end">
                <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-slate-100 text-slate-800">
                  {quotation.status}
                </span>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Prepared For:
              </span>
              <h4 className="text-base font-bold text-slate-900">{quotation.customer_name}</h4>
              <p className="text-xs text-slate-600 mt-1">{quotation.customer_phone}</p>
              {quotation.customer_email && (
                <p className="text-xs text-slate-600">{quotation.customer_email}</p>
              )}
            </div>

            <div className="sm:text-right text-xs text-slate-600 space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Terms:
              </span>
              <p>Standard 50% Advance</p>
              <p>Fabrication Grade: SS 304 / 316</p>
            </div>
          </div>

          {/* Table */}
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
                    <td className="py-3.5 px-2 text-right">{item.quantity} Nos</td>
                    <td className="py-3.5 px-3 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                      {item.customization_amount > 0 ? `+${formatCurrency(item.customization_amount)}` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-rose-600">
                      {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t-2 border-slate-900">
            <div className="text-xs text-slate-600 space-y-4">
              {quotation.notes && (
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Notes:</span>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap">
                    {quotation.notes}
                  </p>
                </div>
              )}
              <div>
                <span className="font-bold text-slate-900 block mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Commercial Terms:
                </span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                  <li>50% advance along with order confirmation; balance before dispatch.</li>
                  <li>10–14 working days production lead time.</li>
                  <li>5-year warranty on SS 304/316 structural elements.</li>
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
                    <span>Customization:</span>
                    <span className="font-mono">+{formatCurrency(quotation.customization_amount)}</span>
                  </div>
                )}
                {quotation.transport_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Transport:</span>
                    <span className="font-mono">+{formatCurrency(quotation.transport_amount)}</span>
                  </div>
                )}
                {quotation.installation_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Installation:</span>
                    <span className="font-mono">+{formatCurrency(quotation.installation_amount)}</span>
                  </div>
                )}
                {quotation.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatCurrency(quotation.discount_amount)}</span>
                  </div>
                )}
                {quotation.tax_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18%):</span>
                    <span className="font-mono">+{formatCurrency(quotation.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
                  <span>Total Amount (INR):</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {formatCurrency(quotation.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 print:hidden">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Questions? Call our sales desk at +91-9876543210</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            {isSent && (
              <button
                onClick={() => setIsAcceptModalOpen(true)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
              >
                Accept Quotation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Accept Modal */}
      {isAcceptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900">Confirm Acceptance</h3>
                <p className="text-xs text-slate-600 mt-1">
                  You are accepting Quotation <strong>{quotation.quotation_number}</strong> for the amount of <strong>{formatCurrency(quotation.total_amount)}</strong>.
                </p>
              </div>
            </div>
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
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {submittingAction ? 'Processing...' : 'Confirm Acceptance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-900">Decline Proposal</h3>
            <p className="text-xs text-slate-600">
              Please share your reason for declining to help us modify the proposal:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Dimensions need change, or postponed..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-500"
              >
                {submittingAction ? 'Processing...' : 'Decline Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
