import { Printer, Share2, Info } from 'lucide-react';
import { Button, Card } from '../../../components/ui';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import type { QuotationDetail } from '../../../types/quotation';

interface QuotationPreviewProps {
  quotation: QuotationDetail;
}

export function QuotationPreview({ quotation }: QuotationPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello ${quotation.customer_name},\n\nHere is your official quotation from SKF Stainless Steel Furniture:\n` +
      `Quotation Ref: ${quotation.quotation_number}\n` +
      `Date: ${formatDate(quotation.created_at)}\n` +
      `Valid Until: ${quotation.valid_until ? formatDate(quotation.valid_until) : '30 Days'}\n` +
      `Total Amount: ${formatCurrency(quotation.total_amount)}\n\n` +
      `Please contact our sales team at +91-9876543210 for further assistance.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Top Action Ribbon (Hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs print:hidden">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Info className="w-4 h-4 text-[var(--brand-accent)] shrink-0" />
          <span>
            Printable commercial preview. Use browser print dialog to print or save directly as PDF.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsAppShare}
            leftIcon={<Share2 className="w-4 h-4 text-emerald-600" />}
          >
            WhatsApp Summary
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Quotation / PDF
          </Button>
        </div>
      </div>

      {/* Printable Quotation Paper Document */}
      <Card className="p-8 sm:p-12 shadow-sm border border-[var(--border-border)] bg-white text-slate-900 font-sans print:shadow-none print:border-none print:p-0 print:m-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-black tracking-tight text-slate-900">SKF</span>
              <span className="text-xs uppercase tracking-widest font-bold text-slate-600 border-l border-slate-300 pl-2">
                Stainless Steel Furniture
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
              Industrial & Architectural Stainless Steel Works • SS 304 / 316 Custom Fabrication • Modular Kitchens & Dining
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              GSTIN: 27AABCS1429B1Z • Mumbai & Pune Industrial Estate
            </p>
          </div>

          <div className="sm:text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded mb-2">
              Commercial Quotation
            </span>
            <div className="font-mono text-base font-bold text-slate-900">
              {quotation.quotation_number}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              <span>Date: </span>
              <strong>{formatDate(quotation.created_at)}</strong>
            </div>
            <div className="text-xs text-slate-600">
              <span>Valid Until: </span>
              <strong>{quotation.valid_until ? formatDate(quotation.valid_until) : '30 Days from date'}</strong>
            </div>
          </div>
        </div>

        {/* Bill To & Reference Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Quotation Prepared For
            </span>
            <h4 className="text-base font-bold text-slate-900">
              {quotation.customer_name}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Phone: {quotation.customer_phone}
            </p>
            {quotation.customer_email && (
              <p className="text-xs text-slate-600">
                Email: {quotation.customer_email}
              </p>
            )}
            {quotation.b2b_account && (
              <p className="text-xs text-slate-600 font-medium mt-1">
                Account: {quotation.b2b_account.company_name}
              </p>
            )}
          </div>

          <div className="sm:text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Commercial References
            </span>
            <p className="text-xs text-slate-600">
              Status: <span className="uppercase font-bold text-slate-900">{quotation.status}</span>
            </p>
            {quotation.enquiry && (
              <p className="text-xs text-slate-600">
                Enquiry Ref: #{quotation.enquiry.public_id.slice(0, 8)}
              </p>
            )}
            {quotation.created_by && (
              <p className="text-xs text-slate-600">
                Prepared By: {quotation.created_by.name}
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-2 w-10">#</th>
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
                    <td className="py-3 px-2 font-mono text-slate-400">{index + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{item.description}</div>
                      {item.product && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          SKU: {item.product.product_code || item.product.slug}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-medium">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {item.customization_amount > 0 ? `+${formatCurrency(item.customization_amount)}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-600">
                      {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary & Calculations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-900">
          {/* Notes & Terms */}
          <div className="text-xs text-slate-600 space-y-3">
            {quotation.notes && (
              <div>
                <span className="font-bold text-slate-900 block mb-1">Commercial Notes:</span>
                <p className="whitespace-pre-wrap leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                  {quotation.notes}
                </p>
              </div>
            )}

            <div>
              <span className="font-bold text-slate-900 block mb-1">Standard Terms & Conditions:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                <li>50% advance along with confirmed purchase order; balance before dispatch.</li>
                <li>Production lead time: 10-14 working days from technical approval.</li>
                <li>Rates quoted are valid for 30 days unless specified otherwise.</li>
                <li>Standard 5-year structural warranty against manufacturing defects.</li>
              </ul>
            </div>
          </div>

          {/* Totals Table */}
          <div className="sm:pl-8">
            <div className="space-y-2 text-xs">
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
                  <span>Transport & Logistics:</span>
                  <span className="font-mono">+{formatCurrency(quotation.transport_amount)}</span>
                </div>
              )}

              {quotation.installation_amount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>On-site Installation:</span>
                  <span className="font-mono">+{formatCurrency(quotation.installation_amount)}</span>
                </div>
              )}

              {quotation.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Special Discount:</span>
                  <span className="font-mono">-{formatCurrency(quotation.discount_amount)}</span>
                </div>
              )}

              {quotation.tax_amount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST / Taxes:</span>
                  <span className="font-mono">+{formatCurrency(quotation.tax_amount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
                <span>Total Amount (INR):</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  {formatCurrency(quotation.total_amount)}
                </span>
              </div>
            </div>

            {/* Signature Area */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
              <div>
                <span>Customer Acceptance Signature</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-900">For SKF Furniture</span>
                <p className="text-[10px]">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default QuotationPreview;
