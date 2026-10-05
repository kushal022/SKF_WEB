import React, { useState } from 'react';
import { Modal, Input, Select, Button } from '../../../../components/ui';
import type { CreateImageRequest } from '../../../../types/catalog';

interface ProductImageAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateImageRequest) => Promise<void>;
  isLoading: boolean;
}

export function ProductImageAddModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: ProductImageAddModalProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [imageType, setImageType] = useState('gallery');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError('Image URL is required');
      return;
    }

    try {
      await onSubmit({
        image_url: imageUrl.trim(),
        alt_text: altText.trim() || null,
        image_type: imageType || 'gallery',
        sort_order: Number(sortOrder) || 0,
        is_primary: isPrimary,
      });
      // reset
      setImageUrl('');
      setAltText('');
      setImageType('gallery');
      setSortOrder(0);
      setIsPrimary(false);
      setError('');
      onClose();
    } catch {
      // toast shown in parent
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Product Image"
      description="Add a high-resolution product photograph or render to this product's gallery."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Image URL *"
          placeholder="https://images.skffurniture.com/products/bed-angle-1.webp"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            if (error) setError('');
          }}
          error={error}
          disabled={isLoading}
          helperText="Direct HTTP/HTTPS link to image asset"
          required
        />

        {imageUrl && (
          <div className="p-3 bg-[var(--surface-muted)] rounded-lg border border-[var(--border-border)] flex items-center gap-3">
            <img
              src={imageUrl}
              alt="Asset Preview"
              className="w-16 h-16 rounded object-cover border border-[var(--border-border)]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="text-xs text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--text-primary)]">Image Asset Preview</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Asset successfully loaded</p>
            </div>
          </div>
        )}

        <Input
          label="Alt Text (SEO & Accessibility)"
          placeholder="e.g. SKF Stainless Steel Bed Headboard Close-up"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          disabled={isLoading}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Image Perspective / Type"
            value={imageType}
            onChange={(e) => setImageType(e.target.value)}
            disabled={isLoading}
            options={[
              { value: 'gallery', label: 'General Gallery' },
              { value: 'primary', label: 'Primary Catalog' },
              { value: 'lifestyle', label: 'Lifestyle / Room' },
              { value: 'dimension', label: 'Dimension / Blueprint' },
              { value: 'detail', label: 'Material & Joinery' },
            ]}
          />

          <Input
            label="Display Sort Order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            disabled={isLoading}
            helperText="0 is first"
          />
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-[var(--border-border)] text-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Set as Primary Cover Image (Shown on catalog listings)
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Adding Image...' : 'Add Image'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductImageAddModal;
