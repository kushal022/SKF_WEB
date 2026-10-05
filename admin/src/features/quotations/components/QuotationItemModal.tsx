import React, { useState } from 'react';
import { Modal, Button, Input, Select, useToast } from '../../../components/ui';
import {
  useAddQuotationItemMutation,
  useUpdateQuotationItemMutation,
  useGetProductsQuery,
} from '../../../app/store/api';
import { formatCurrency } from '../../../utils/currency';
import type { QuotationItem } from '../../../types/quotation';

interface QuotationItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationPublicId: string;
  itemToEdit?: QuotationItem | null;
}

export function QuotationItemModal({
  isOpen,
  onClose,
  quotationPublicId,
  itemToEdit,
}: QuotationItemModalProps) {
  const { showToast } = useToast();
  const [addItem, { isLoading: isAdding }] = useAddQuotationItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateQuotationItemMutation();

  const isEditing = Boolean(itemToEdit);

  // Products from catalog for optional product picker
  const { data: productsRes } = useGetProductsQuery({ limit: 100 });
  const catalogProducts = productsRes?.data?.items || [];

  const [productPublicId, setProductPublicId] = useState<string>(
    itemToEdit?.product?.public_id || ''
  );
  const [description, setDescription] = useState<string>(
    itemToEdit?.description || ''
  );
  const [quantity, setQuantity] = useState<number>(
    itemToEdit ? Number(itemToEdit.quantity) : 1
  );
  const [unitPrice, setUnitPrice] = useState<number>(
    itemToEdit ? Number(itemToEdit.unit_price) : 0
  );
  const [customizationAmount, setCustomizationAmount] = useState<number>(
    itemToEdit ? Number(itemToEdit.customization_amount) : 0
  );
  const [discountAmount, setDiscountAmount] = useState<number>(
    itemToEdit ? Number(itemToEdit.discount_amount) : 0
  );
  const [formError, setFormError] = useState<string | null>(null);

  const handleProductSelect = (selectedId: string) => {
    setProductPublicId(selectedId);
    if (selectedId) {
      const prod = catalogProducts.find((p) => p.public_id === selectedId);
      if (prod) {
        if (!description || description === itemToEdit?.description) {
          setDescription(`${prod.name} (${prod.product_code || 'Standard'})`);
        }
      }
    }
  };

  // Preview line total calculation
  const previewLineTotal = Math.max(
    0,
    quantity * unitPrice + customizationAmount - discountAmount
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setFormError('Item description is required.');
      return;
    }
    if (quantity <= 0) {
      setFormError('Quantity must be greater than 0.');
      return;
    }
    if (unitPrice < 0) {
      setFormError('Unit price cannot be negative.');
      return;
    }

    try {
      setFormError(null);
      if (isEditing && itemToEdit) {
        await updateItem({
          publicId: quotationPublicId,
          itemPublicId: itemToEdit.public_id,
          data: {
            product_public_id: productPublicId || null,
            description: description.trim(),
            quantity,
            unit_price: unitPrice,
            customization_amount: customizationAmount,
            discount_amount: discountAmount,
          },
        }).unwrap();

        showToast('success', 'Quotation item updated successfully.', 'Item Updated');
      } else {
        await addItem({
          publicId: quotationPublicId,
          data: {
            product_public_id: productPublicId || null,
            description: description.trim(),
            quantity,
            unit_price: unitPrice,
            customization_amount: customizationAmount,
            discount_amount: discountAmount,
          },
        }).unwrap();

        showToast('success', 'Item added to quotation.', 'Item Added');
      }

      onClose();
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to save quotation item.');
    }
  };

  const isLoading = isAdding || isUpdating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) {
          onClose();
        }
      }}
      title={isEditing ? 'Edit Line Item' : 'Add Quotation Item'}
      description="Select from catalog or define a custom stainless steel line item."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Optional Catalog Product Select */}
        <div>
          <label
            htmlFor="item-catalog-product"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
          >
            Link Catalog Product <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
          </label>
          <Select
            id="item-catalog-product"
            value={productPublicId}
            onChange={(e) => handleProductSelect(e.target.value)}
            options={[
              { value: '', label: 'Custom / Unlinked Item' },
              ...catalogProducts.map((p) => ({
                value: p.public_id,
                label: `${p.name} (${p.product_code || 'SKU'})`,
              })),
            ]}
          />
        </div>

        {/* Item Description */}
        <div>
          <label
            htmlFor="item-description"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
          >
            Item Description <span className="text-[var(--status-error)]">*</span>
          </label>
          <textarea
            id="item-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Stainless Steel 304 Dining Table with Hairline Finish (6-seater)..."
            className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)] resize-none"
            required
          />
        </div>

        {/* Numerical Fields: Quantity & Unit Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="item-quantity"
            label="Quantity *"
            type="number"
            min="0.01"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />

          <Input
            id="item-unit-price"
            label="Unit Price (INR) *"
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            required
          />
        </div>

        {/* Customization & Discount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="item-customization"
            label="Customization Fee (INR)"
            type="number"
            min="0"
            step="0.01"
            value={customizationAmount}
            onChange={(e) => setCustomizationAmount(Number(e.target.value))}
            helperText="Custom dimensions, grade upgrade, laser engraving"
          />

          <Input
            id="item-discount"
            label="Line Discount (INR)"
            type="number"
            min="0"
            step="0.01"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
            helperText="Item-level promotional or bulk deduction"
          />
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="p-3.5 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-border)] flex items-center justify-between">
          <div className="text-xs text-[var(--text-secondary)]">
            <span>Formula: </span>
            <span className="font-mono text-[11px]">
              ({quantity} × {formatCurrency(unitPrice)}) + {formatCurrency(customizationAmount)} - {formatCurrency(discountAmount)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Line Total</span>
            <span className="text-base font-bold text-[var(--brand-accent)]">
              {formatCurrency(previewLineTotal)}
            </span>
          </div>
        </div>

        {formError && (
          <div className="p-3 rounded-lg bg-[var(--status-error)]/10 text-[var(--status-error)] text-xs font-medium border border-[var(--status-error)]/20">
            {formError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-border)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
          >
            {isEditing ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default QuotationItemModal;
