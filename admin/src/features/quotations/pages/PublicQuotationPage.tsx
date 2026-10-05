import { useState } from 'react';
import { useParams } from 'react-router-dom';
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
import {
  useGetPublicQuotationQuery,
  useAcceptPublicQuotationMutation,
  useRejectPublicQuotationMutation,
  useGetSettingsQuery,
} from '../../../app/store/api';
import { Button, Card, LoadingState, Modal, useToast } from '../../../components/ui';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import QuotationStatusBadge from '../components/QuotationStatusBadge';

export function PublicQuotationPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: quoteRes, isLoading, isError, error, refetch } = useGetPublicQuotationQuery(id || '', {
    skip: !id,
  });

  const { data: settingsRes } = useGetSettingsQuery();
  const settings = settingsRes?.data?.settings;

  const [acceptQuotation, { isLoading: isAccepting }] = useAcceptPublicQuotationMutation();
  const [rejectQuotation, { isLoading: isRejecting }] = useRejectPublicQuotationMutation();

  const quotation = quoteRes?.data?.quotation;

  const companyName = settings?.site_name || 'SKF Stainless Steel Furniture';
  const companyPhone = settings?.phone || '+91-9876543210';
  const companyEmail = settings?.email || 'sales@skffurniture.com';
  const companyAddress =
    settings?.address ||
    'Plot No. 42, Steel Fabricators Industrial Estate, Mumbai & Pune Expressway, Maharashtra 410206';
  const gstin = '27AABCS1429B1Z';

  const handleAcceptConfirm = async () => {
    if (!id) return;
    try {
      await acceptQuotation(id).unwrap();
      showToast('success', 'Quotation accepted successfully! Our project team will be in touch.', 'Accepted');
      setIsAcceptModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      showToast('error', errObj?.data?.message || errObj?.message || 'Failed to accept quotation.', 'Error');
    }
  };

  const handleRejectConfirm = async () => {
    if (!id) return;
    try {
      await rejectQuotation({ publicId: id, reason: rejectReason.trim() }).unwrap();
      showToast('info', 'Quotation declined. Thank you for your feedback.', 'Quotation Declined');
      setIsRejectModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      showToast('error', errObj?.data?.message || errObj?.message || 'Failed to decline quotation.', 'Error');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LoadingState message="Loading secure quotation document..." />
      </div>
    );
  }

  if (isError || !quotation) {
    const errorMsg = (error as { data?: { message?: string } })?.data?.message || 'The requested quotation could not be found or is not yet published.';
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white shadow-md border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Quotation Unavailable</h2>
          <p className="text-sm text-slate-600 mt-2">{errorMsg}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
            <a
              href={`tel:${companyPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800"
            >
              Contact Support
            </a>
          </div>
        </Card>
      </div>
    );
  }

  const isSent = quotation.status === 'sent';
  const isAccepted = quotation.status === 'accepted';
  const isRejected = quotation.status === 'rejected';
  const isExpired = quotation.status === 'expired';

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Customer Status Banner */}
        <div className="print:hidden">
          {isAccepted && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Quotation Accepted</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  You have accepted this quotation proposal. Our engineering and customer service desk is processing your order requirements.
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
                  This quotation was marked as declined. Please contact our sales team if you require a revised proposal or customized specifications.
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
                  The validity period for this proposal has ended. Please request a refreshed quote reflecting current material rates.
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
                  Please review the itemized specifications and totals below. You can approve or decline this quotation online.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="bg-transparent text-white border-white/30 hover:bg-white/10"
                >
                  Decline
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAcceptModalOpen(true)}
                  leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white border-none font-semibold"
                >
                  Accept Quotation
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Printable Paper Document */}
        <Card className="p-8 sm:p-12 shadow-md border border-slate-200 bg-white text-slate-900 font-sans print:shadow-none print:border-none print:p-0 print:m-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-lg tracking-wider">
                  SKF
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
                    {companyName}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                    Industrial &amp; Architectural Stainless Steel
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-0.5 pt-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{companyAddress}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {companyPhone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> {companyEmail}
                  </span>
                  <span className="font-semibold text-slate-700">
                    GSTIN: {gstin}
                  </span>
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
                    {quotation.valid_until ? formatDate(quotation.valid_until) : '30 Days from issue'}
                  </strong>
                </div>
              </div>
              <div className="mt-2.5 sm:flex sm:justify-end">
                <QuotationStatusBadge status={quotation.status} size="sm" />
              </div>
            </div>
          </div>

          {/* Customer & Bill To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Prepared For:
              </span>
              <h4 className="text-base font-bold text-slate-900">
                {quotation.customer_name}
              </h4>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {quotation.customer_phone}
              </p>
              {quotation.customer_email && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {quotation.customer_email}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Quotation Reference:
              </span>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p>Status: <strong className="uppercase text-slate-900">{quotation.status}</strong></p>
                <p>Standard Terms: 50% Advance</p>
                <p>Fabrication Grade: SS 304 / 316 Food &amp; Architectural Standard</p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6">
            <div className="overflow-x-auto">
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
                    <tr key={item.public_id} className="text-slate-800 break-inside-avoid">
                      <td className="py-3.5 px-2 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900 max-w-sm">
                          {item.description}
                        </div>
                        {item.product && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            SKU: {item.product.product_code || item.product.slug} • Model: {item.product.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-right font-medium whitespace-nowrap">
                        {item.quantity} Nos
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                        {formatCurrency(item.unit_price)}
                      </td>
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
          </div>

          {/* Financial Totals & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t-2 border-slate-900 print-avoid-break">
            {/* Notes & Commercial Terms */}
            <div className="text-xs text-slate-600 space-y-4">
              {quotation.notes && (
                <div>
                  <span className="font-bold text-slate-900 block mb-1">
                    Scope &amp; Technical Notes:
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                    {quotation.notes}
                  </p>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-900 block mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Commercial Terms &amp; Warranty:
                </span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li><strong>Payment:</strong> 50% advance along with formal approval; 50% balance before delivery.</li>
                  <li><strong>Lead Time:</strong> 10–14 working days from approved technical specifications.</li>
                  <li><strong>Validity:</strong> Quoted rates are firm for 30 calendar days.</li>
                  <li><strong>Warranty:</strong> 5-year structural warranty on genuine SS 304 / SS 316.</li>
                </ul>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="sm:pl-6 space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-medium">{formatCurrency(quotation.subtotal)}</span>
                </div>

                {quotation.customization_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Custom Fabrication Charges:</span>
                    <span className="font-mono font-medium">+{formatCurrency(quotation.customization_amount)}</span>
                  </div>
                )}

                {quotation.transport_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Transport &amp; Freight:</span>
                    <span className="font-mono font-medium">+{formatCurrency(quotation.transport_amount)}</span>
                  </div>
                )}

                {quotation.installation_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Installation &amp; Assembly:</span>
                    <span className="font-mono font-medium">+{formatCurrency(quotation.installation_amount)}</span>
                  </div>
                )}

                {quotation.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Special Discount:</span>
                    <span className="font-mono">-{formatCurrency(quotation.discount_amount)}</span>
                  </div>
                )}

                {quotation.tax_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Applicable GST (18%):</span>
                    <span className="font-mono font-medium">+{formatCurrency(quotation.tax_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
                  <span>Total Amount (INR):</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {formatCurrency(quotation.total_amount)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-[11px] text-slate-500">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
                  <span className="font-semibold text-slate-800 block">Customer Acceptance</span>
                  <p className="text-[10px]">Authorized Signature &amp; Date</p>
                </div>
                <div className="text-right">
                  <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
                  <span className="font-semibold text-slate-900 block">For {companyName}</span>
                  <p className="text-[10px]">Authorized Commercial Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Bottom Actions Bar (Screen Only) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-xs print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Have questions about this quotation? Call our direct desk at {companyPhone}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print / Save PDF
            </Button>

            {isSent && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsAcceptModalOpen(true)}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Accept Quotation
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Accept Confirmation Modal */}
      <Modal
        isOpen={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        title="Accept Quotation Proposal"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-semibold text-slate-900">
                Confirm Acceptance
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                You are accepting Quotation <strong className="font-mono text-slate-900">{quotation.quotation_number}</strong> for the total amount of <strong className="text-slate-900">{formatCurrency(quotation.total_amount)}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAcceptModalOpen(false)}
              disabled={isAccepting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAcceptConfirm}
              isLoading={isAccepting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Confirm &amp; Accept
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Decline Quotation Proposal"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Please let us know if you require modified measurements, different material finishes, or budget adjustments.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Feedback or Reason (Optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Dimensions need modification, or project timeline postponed..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleRejectConfirm}
              isLoading={isRejecting}
            >
              Decline Proposal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PublicQuotationPage;
