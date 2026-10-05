import { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import { Button, Card, useToast } from '../../../components/ui';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import type { QuotationDetail } from '../../../types/quotation';
import QuotationStatusBadge from './QuotationStatusBadge';
import { useGetSettingsQuery } from '../../../app/store/api';

interface QuotationPreviewProps {
  quotation: QuotationDetail;
}

export function QuotationPreview({ quotation }: QuotationPreviewProps) {
  const { showToast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Live website settings for business branding
  const { data: settingsRes } = useGetSettingsQuery();
  const settings = settingsRes?.data?.settings;

  const companyName = settings?.site_name || 'SKF Stainless Steel Furniture';
  const companyTagline =
    settings?.tagline ||
    'Architectural Stainless Steel Works • SS 304 / 316 Custom Fabrication • Modular Kitchens & Luxury Suites';
  const companyPhone = settings?.phone || '+91-9876543210';
  const companyEmail = settings?.email || 'sales@skffurniture.com';
  const companyAddress =
    settings?.address ||
    'Plot No. 42, Steel Fabricators Industrial Estate, Mumbai & Pune Expressway, Maharashtra 410206';
  const gstin = '27AABCS1429B1Z';

  // Handle Standard Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Handle Download PDF with correct filename
  const handleDownloadPdf = () => {
    try {
      setIsDownloading(true);
      const originalTitle = document.title;
      const pdfFileName = `SKF-Quotation-${quotation.quotation_number}`;

      // Temporarily set document title so browser defaults to this file name
      document.title = pdfFileName;

      showToast(
        'info',
        `Preparing PDF preview. Select "Save as PDF" to save as ${pdfFileName}.pdf`,
        'PDF Generation'
      );

      // Brief delay to allow DOM/title sync then trigger native print dialog
      setTimeout(() => {
        window.print();
        document.title = originalTitle;
        setIsDownloading(false);
      }, 250);
    } catch {
      showToast('error', 'Failed to generate PDF document.', 'Error');
      setIsDownloading(false);
    }
  };

  // Handle WhatsApp Share
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*Official Quotation from ${companyName}*\n\n` +
      `*Quotation No:* ${quotation.quotation_number}\n` +
      `*Customer:* ${quotation.customer_name}\n` +
      `*Date:* ${formatDate(quotation.created_at)}\n` +
      `*Valid Until:* ${quotation.valid_until ? formatDate(quotation.valid_until) : '30 Days from issue'}\n` +
      `*Total Amount:* ${formatCurrency(quotation.total_amount)} (Incl. applicable charges)\n\n` +
      `*For queries, contact our sales desk:* ${companyPhone} | ${companyEmail}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Handle Copy Quotation Summary
  const handleCopySummary = async () => {
    const summary =
      `Quotation ${quotation.quotation_number} - ${companyName}\n` +
      `Customer: ${quotation.customer_name} (${quotation.customer_phone})\n` +
      `Total Quoted: ${formatCurrency(quotation.total_amount)}\n` +
      `Status: ${quotation.status.toUpperCase()}\n` +
      `Valid Until: ${quotation.valid_until ? formatDate(quotation.valid_until) : '30 Days'}`;

    try {
      await navigator.clipboard.writeText(summary);
      setIsCopied(true);
      showToast('success', 'Quotation summary copied to clipboard.', 'Copied');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast('error', 'Could not copy to clipboard.', 'Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Ribbon (Always hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs print:hidden">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <FileCheck className="w-4 h-4 text-[var(--brand-accent)] shrink-0" />
          <span>
            Commercial A4 document preview. Print or export directly to high-fidelity PDF.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            leftIcon={isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          >
            {isCopied ? 'Copied' : 'Copy Summary'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleWhatsAppShare}
            leftIcon={<Share2 className="w-4 h-4 text-emerald-600" />}
          >
            WhatsApp Summary
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            isLoading={isDownloading}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download PDF
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Quotation
          </Button>
        </div>
      </div>

      {/* Centered A4 Paper Preview Container */}
      <div className="flex justify-center print:block">
        <Card className="w-full max-w-[850px] p-8 sm:p-12 shadow-md border border-[var(--border-border)] bg-white text-slate-900 font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-lg tracking-wider shadow-xs">
                  SKF
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
                    {companyName}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                    Premium Stainless Steel Craftsmanship
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                {companyTagline}
              </p>

              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
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

            {/* Document Number & Metadata */}
            <div className="sm:text-right shrink-0">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded mb-2">
                Commercial Quotation
              </span>
              <div className="font-mono text-lg font-black text-slate-900">
                {quotation.quotation_number}
              </div>
              <div className="text-xs text-slate-600 mt-1.5 space-y-0.5">
                <div className="flex sm:justify-end items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date: </span>
                  <strong className="text-slate-900">{formatDate(quotation.created_at)}</strong>
                </div>
                <div className="flex sm:justify-end items-center gap-1">
                  <span>Valid Until: </span>
                  <strong className="text-slate-900">
                    {quotation.valid_until ? formatDate(quotation.valid_until) : '30 Days from date'}
                  </strong>
                </div>
              </div>
              <div className="mt-2.5 sm:flex sm:justify-end">
                <QuotationStatusBadge status={quotation.status} size="sm" />
              </div>
            </div>
          </div>

          {/* Customer Snapshot & References */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Quotation Prepared For:
              </span>
              <h4 className="text-base font-bold text-slate-900">
                {quotation.customer_name}
              </h4>
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {quotation.customer_phone}
                </p>
                {quotation.customer_email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {quotation.customer_email}
                  </p>
                )}
                {quotation.b2b_account && (
                  <p className="flex items-center gap-1.5 font-medium text-slate-800 pt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Account: {quotation.b2b_account.company_name} ({quotation.b2b_account.contact_name})
                  </p>
                )}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Project & Commercial References:
              </span>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  Status:{' '}
                  <span className="uppercase font-bold text-slate-900">
                    {quotation.status}
                  </span>
                </p>
                {quotation.enquiry && (
                  <p>
                    CRM Enquiry Ref:{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      #{quotation.enquiry.public_id.slice(0, 8)}
                    </span>
                  </p>
                )}
                {quotation.created_by && (
                  <p>
                    Sales Officer:{' '}
                    <span className="font-medium text-slate-900">
                      {quotation.created_by.name}
                    </span>
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Payment Terms: Standard 50% Advance
                </p>
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
                    <th className="py-2.5 px-3">Item Description & Specifications</th>
                    <th className="py-2.5 px-2 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Customization</th>
                    <th className="py-2.5 px-3 text-right">Discount</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quotation.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                        No line items recorded on this quotation.
                      </td>
                    </tr>
                  ) : (
                    quotation.items.map((item, index) => (
                      <tr key={item.public_id} className="text-slate-800 break-inside-avoid">
                        <td className="py-3.5 px-2 text-center font-mono text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-900 break-words max-w-sm">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary & Calculations Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t-2 border-slate-900 print-avoid-break">
            {/* Notes & Commercial Terms */}
            <div className="text-xs text-slate-600 space-y-4">
              {quotation.notes && (
                <div>
                  <span className="font-bold text-slate-900 block mb-1">
                    Commercial Notes &amp; Scope:
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                    {quotation.notes}
                  </p>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-900 block mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Standard Commercial Terms &amp; Conditions:
                </span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li><strong>Payment:</strong> 50% advance along with confirmed purchase order; balance before dispatch.</li>
                  <li><strong>Production Lead Time:</strong> 10–14 working days from technical drawing confirmation.</li>
                  <li><strong>Validity:</strong> Rates quoted are valid for 30 days unless formally extended.</li>
                  <li><strong>Quality Guarantee:</strong> High-grade SS 304 / 316 with 5-year structural warranty against corrosion.</li>
                  <li><strong>Taxes:</strong> All applicable GST rates as per prevailing government statutory regulations.</li>
                </ul>
              </div>
            </div>

            {/* Totals Table */}
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
                    <span>Freight, Logistics &amp; Transport:</span>
                    <span className="font-mono font-medium">+{formatCurrency(quotation.transport_amount)}</span>
                  </div>
                )}

                {quotation.installation_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>On-site Installation &amp; Erection:</span>
                    <span className="font-mono font-medium">+{formatCurrency(quotation.installation_amount)}</span>
                  </div>
                )}

                {quotation.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Special Commercial Discount:</span>
                    <span className="font-mono">-{formatCurrency(quotation.discount_amount)}</span>
                  </div>
                )}

                {quotation.tax_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Statutory GST / Tax (18%):</span>
                    <span className="font-mono font-medium">+{formatCurrency(quotation.tax_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
                  <span>Final Quoted Amount (INR):</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {formatCurrency(quotation.total_amount)}
                  </span>
                </div>
              </div>

              {/* Signatures & Execution Area */}
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
      </div>
    </div>
  );
}

export default QuotationPreview;
