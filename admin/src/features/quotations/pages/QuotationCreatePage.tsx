import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import {
  useCreateQuotationMutation,
  useGetEnquiryByPublicIdQuery,
  useGetProductsQuery,
} from '../../../app/store/api';
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  LoadingState,
  useToast,
} from '../../../components/ui';
import { formatCurrency } from '../../../utils/currency';
import type { CreateQuotationItemPayload } from '../../../types/quotation';

interface LineItemDraft extends CreateQuotationItemPayload {
  tempId: string;
}

interface QuotationCreateFormProps {
  initialCustomerName: string;
  initialCustomerPhone: string;
  initialCustomerEmail: string;
  initialNotes: string;
  initialItems: LineItemDraft[];
  enquiryId: string | null;
  catalogProducts: Array<{ public_id: string; name: string; product_code?: string }>;
}

function QuotationCreateForm({
  initialCustomerName,
  initialCustomerPhone,
  initialCustomerEmail,
  initialNotes,
  initialItems,
  enquiryId,
  catalogProducts,
}: QuotationCreateFormProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [createQuotation, { isLoading }] = useCreateQuotationMutation();

  // Form Fields
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [customerEmail, setCustomerEmail] = useState(initialCustomerEmail);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState(initialNotes);

  // Additional commercial header fees
  const [customizationAmount, setCustomizationAmount] = useState(0);
  const [transportAmount, setTransportAmount] = useState(0);
  const [installationAmount, setInstallationAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);

  // Line Items
  const [items, setItems] = useState<LineItemDraft[]>(initialItems);
  const [formError, setFormError] = useState<string | null>(null);

  // Line Items Handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        unit_price: 0,
        customization_amount: 0,
        discount_amount: 0,
        product_public_id: null,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setFormError('Quotation must contain at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItemDraft, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleProductSelect = (index: number, productPublicId: string) => {
    const prod = catalogProducts.find((p) => p.public_id === productPublicId);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        product_public_id: productPublicId || null,
        description: prod
          ? `${prod.name} (${prod.product_code || 'Standard'})`
          : copy[index].description,
      };
      return copy;
    });
  };

  // Preview Totals Calculation
  const itemsSubtotal = items.reduce((acc, it) => {
    const lineSubtotal = Number(it.quantity || 0) * Number(it.unit_price || 0);
    const lineTotal = lineSubtotal + Number(it.customization_amount || 0) - Number(it.discount_amount || 0);
    return acc + Math.max(0, lineTotal);
  }, 0);

  const previewGrandTotal = Math.max(
    0,
    itemsSubtotal +
      Number(customizationAmount) +
      Number(transportAmount) +
      Number(installationAmount) +
      Number(taxAmount) -
      Number(discountAmount)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setFormError('Customer name is required.');
      return;
    }
    if (!customerPhone.trim()) {
      setFormError('Customer phone number is required.');
      return;
    }
    if (items.length === 0) {
      setFormError('At least one quotation item is required.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].description.trim()) {
        setFormError(`Item #${i + 1} requires a description.`);
        return;
      }
      if (items[i].quantity <= 0) {
        setFormError(`Item #${i + 1} quantity must be greater than 0.`);
        return;
      }
    }

    try {
      setFormError(null);
      const res = await createQuotation({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() ? customerEmail.trim() : null,
        enquiry_public_id: enquiryId || null,
        valid_until: validUntil || null,
        notes: notes.trim() ? notes.trim() : null,
        customization_amount: Number(customizationAmount),
        transport_amount: Number(transportAmount),
        installation_amount: Number(installationAmount),
        discount_amount: Number(discountAmount),
        tax_amount: Number(taxAmount),
        items: items.map((it) => ({
          product_public_id: it.product_public_id || null,
          description: it.description.trim(),
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          customization_amount: Number(it.customization_amount),
          discount_amount: Number(it.discount_amount),
        })),
      }).unwrap();

      showToast(
        'success',
        `Quotation ${res.data?.quotation_number} created successfully.`,
        'Quotation Created'
      );

      navigate(`/admin/quotations/${res.data?.public_id}`);
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to create quotation. Please check your inputs.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/quotations')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Create Commercial Quotation
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              {enquiryId ? (
                <span className="text-[var(--brand-accent)] font-medium">
                  Linked to Enquiry #{enquiryId.slice(0, 8)}
                </span>
              ) : (
                'Prepare a custom stainless steel commercial proposal.'
              )}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information Card */}
        <Card className="shadow-xs border border-[var(--border-border)]">
          <CardHeader className="pb-3 border-b border-[var(--border-border)]">
            <CardTitle className="text-base font-semibold">Customer Information</CardTitle>
          </CardHeader>

          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="quote-customer-name"
              label="Customer / Client Name *"
              placeholder="e.g. Rajesh Sharma / Hotel Grand"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />

            <Input
              id="quote-customer-phone"
              label="Phone Number *"
              placeholder="e.g. +91 9876543210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />

            <Input
              id="quote-customer-email"
              label="Email Address"
              type="email"
              placeholder="client@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />

            <Input
              id="quote-valid-until"
              label="Quotation Validity (YYYY-MM-DD)"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              helperText="Standard validity is 30 days from creation."
            />
          </CardContent>
        </Card>

        {/* Line Items Card */}
        <Card className="shadow-xs border border-[var(--border-border)]">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border-border)]">
            <div>
              <CardTitle className="text-base font-semibold">Quotation Line Items</CardTitle>
              <p className="text-xs text-[var(--text-muted)]">
                Add products from the catalog or define customized stainless steel fabrication items.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Item
            </Button>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {items.map((item, index) => {
              const itemTotal = Math.max(
                0,
                Number(item.quantity || 0) * Number(item.unit_price || 0) +
                  Number(item.customization_amount || 0) -
                  Number(item.discount_amount || 0)
              );

              return (
                <div
                  key={item.tempId}
                  className="p-4 rounded-xl border border-[var(--border-border)] bg-[var(--surface-muted)]/30 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-accent)]">
                      Item #{index + 1}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                        Line Total: {formatCurrency(itemTotal)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--status-error)] transition-colors"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label
                        htmlFor={`catalog-prod-${index}`}
                        className="block text-[11px] font-semibold uppercase text-[var(--text-secondary)] mb-1"
                      >
                        Catalog Preset (Optional)
                      </label>
                      <Select
                        id={`catalog-prod-${index}`}
                        value={item.product_public_id || ''}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        options={[
                          { value: '', label: 'Custom / Ad-hoc Item' },
                          ...catalogProducts.map((p) => ({
                            value: p.public_id,
                            label: `${p.name} (${p.product_code || 'SKU'})`,
                          })),
                        ]}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor={`item-desc-${index}`}
                        className="block text-[11px] font-semibold uppercase text-[var(--text-secondary)] mb-1"
                      >
                        Description *
                      </label>
                      <input
                        id={`item-desc-${index}`}
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="e.g. Stainless Steel 304 Working Table with Under-shelf"
                        className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label
                        htmlFor={`item-qty-${index}`}
                        className="block text-[11px] font-semibold uppercase text-[var(--text-secondary)] mb-1"
                      >
                        Qty *
                      </label>
                      <input
                        id={`item-qty-${index}`}
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-2 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`item-rate-${index}`}
                        className="block text-[11px] font-semibold uppercase text-[var(--text-secondary)] mb-1"
                      >
                        Unit Rate (INR) *
                      </label>
                      <input
                        id={`item-rate-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                        className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-2 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`item-cust-${index}`}
                        className="block text-[11px] font-semibold uppercase text-[var(--text-secondary)] mb-1"
                      >
                        Customization
                      </label>
                      <input
                        id={`item-cust-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.customization_amount}
                        onChange={(e) =>
                          handleItemChange(index, 'customization_amount', Number(e.target.value))
                        }
                        className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-2 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`item-disc-${index}`}
                        className="block text-[11px] font-semibold uppercase text-[var(--text-secondary)] mb-1"
                      >
                        Discount
                      </label>
                      <input
                        id={`item-disc-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount_amount}
                        onChange={(e) =>
                          handleItemChange(index, 'discount_amount', Number(e.target.value))
                        }
                        className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Commercial Charges & Notes Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Header Fees & Taxes */}
          <Card className="shadow-xs border border-[var(--border-border)]">
            <CardHeader className="pb-3 border-b border-[var(--border-border)]">
              <CardTitle className="text-base font-semibold">Commercial Overhead & Taxes</CardTitle>
            </CardHeader>

            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="quote-customization-fee"
                label="Customization Surcharge"
                type="number"
                min="0"
                step="0.01"
                value={customizationAmount}
                onChange={(e) => setCustomizationAmount(Number(e.target.value))}
              />

              <Input
                id="quote-transport-fee"
                label="Transport / Logistics"
                type="number"
                min="0"
                step="0.01"
                value={transportAmount}
                onChange={(e) => setTransportAmount(Number(e.target.value))}
              />

              <Input
                id="quote-install-fee"
                label="Installation / Fitting"
                type="number"
                min="0"
                step="0.01"
                value={installationAmount}
                onChange={(e) => setInstallationAmount(Number(e.target.value))}
              />

              <Input
                id="quote-discount-fee"
                label="Commercial Discount"
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
              />

              <div className="sm:col-span-2">
                <Input
                  id="quote-tax-fee"
                  label="GST / Taxes"
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Number(e.target.value))}
                  helperText="Goods and Services Tax calculated on subtotal."
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes & Live Financial Summary */}
          <div className="space-y-6">
            <Card className="shadow-xs border border-[var(--border-border)]">
              <CardHeader className="pb-3 border-b border-[var(--border-border)]">
                <CardTitle className="text-base font-semibold">Notes & Terms</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <textarea
                  id="quote-notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special client terms, finish requirements, dispatch schedules..."
                  className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20"
                />
              </CardContent>
            </Card>

            {/* Financial Summary Card */}
            <Card className="p-5 shadow-xs border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/5">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-semibold">{formatCurrency(itemsSubtotal)}</span>
                </div>
                {customizationAmount > 0 && (
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Customization:</span>
                    <span className="font-mono">+{formatCurrency(customizationAmount)}</span>
                  </div>
                )}
                {transportAmount > 0 && (
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Transport:</span>
                    <span className="font-mono">+{formatCurrency(transportAmount)}</span>
                  </div>
                )}
                {installationAmount > 0 && (
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Installation:</span>
                    <span className="font-mono">+{formatCurrency(installationAmount)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>GST:</span>
                    <span className="font-mono">+{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[var(--border-border)] flex justify-between items-center text-sm font-bold text-[var(--text-primary)]">
                  <span>Estimated Total:</span>
                  <span className="text-xl font-black text-[var(--brand-accent)] font-mono">
                    {formatCurrency(previewGrandTotal)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {formError && (
          <div className="p-4 rounded-lg bg-[var(--status-error)]/10 text-[var(--status-error)] text-xs font-medium border border-[var(--status-error)]/20">
            {formError}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-border)]">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/quotations')}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Save & Create Draft Quotation
          </Button>
        </div>
      </form>
    </div>
  );
}

export function QuotationCreatePage() {
  const [searchParams] = useSearchParams();
  const enquiryId = searchParams.get('enquiryId');

  const { data: enquiryRes, isLoading: isEnquiryLoading } = useGetEnquiryByPublicIdQuery(enquiryId || '', {
    skip: !enquiryId,
  });
  const linkedEnquiry = enquiryRes?.data;

  const { data: productsRes } = useGetProductsQuery({ limit: 100 });
  const catalogProducts = productsRes?.data?.items || [];

  if (enquiryId && isEnquiryLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading linked enquiry customer details..." />
      </div>
    );
  }

  const defaultItems: LineItemDraft[] = linkedEnquiry?.product
    ? [
        {
          tempId: 'item-enquiry-1',
          description: `${linkedEnquiry.product.name} (Custom Enquiry Spec)`,
          quantity: 1,
          unit_price: 0,
          customization_amount: 0,
          discount_amount: 0,
          product_public_id: linkedEnquiry.product.public_id,
        },
      ]
    : [
        {
          tempId: 'item-1',
          description: '',
          quantity: 1,
          unit_price: 0,
          customization_amount: 0,
          discount_amount: 0,
          product_public_id: null,
        },
      ];

  return (
    <QuotationCreateForm
      key={linkedEnquiry?.public_id || 'direct'}
      initialCustomerName={linkedEnquiry?.customer_name || ''}
      initialCustomerPhone={linkedEnquiry?.phone || ''}
      initialCustomerEmail={linkedEnquiry?.email || ''}
      initialNotes={
        linkedEnquiry?.message
          ? `Customer requirement from enquiry:\n${linkedEnquiry.message}`
          : ''
      }
      initialItems={defaultItems}
      enquiryId={enquiryId}
      catalogProducts={catalogProducts}
    />
  );
}

export default QuotationCreatePage;
