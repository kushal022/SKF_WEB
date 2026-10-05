import { useState } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import {
  useAddProductImageMutation,
  useDeleteProductImageMutation,
  useSetPrimaryProductImageMutation,
  useReorderProductImagesMutation,
} from '../../../../app/store/api';
import type { ProductImageItem, CreateImageRequest } from '../../../../types/catalog';
import { Button, Badge, useToast, Card, EmptyState } from '../../../../components/ui';
import ProductImageAddModal from './ProductImageAddModal';

interface ProductImageGalleryProps {
  productPublicId: string;
  images: ProductImageItem[];
}

export function ProductImageGallery({
  productPublicId,
  images = [],
}: ProductImageGalleryProps) {
  const { showToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [addImage, { isLoading: isAdding }] = useAddProductImageMutation();
  const [deleteImage, { isLoading: isDeleting }] = useDeleteProductImageMutation();
  const [setPrimary, { isLoading: isSettingPrimary }] = useSetPrimaryProductImageMutation();
  const [reorderImages, { isLoading: isReordering }] = useReorderProductImagesMutation();

  const handleAddSubmit = async (data: CreateImageRequest) => {
    try {
      await addImage({
        productPublicId,
        data,
      }).unwrap();
      showToast('success', 'Product image added successfully.', 'Added');
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to add image.', 'Error');
      throw err;
    }
  };

  const handleSetPrimary = async (imagePublicId: string) => {
    try {
      await setPrimary({
        productPublicId,
        imagePublicId,
      }).unwrap();
      showToast('success', 'Primary cover image updated.', 'Updated');
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to set primary image.', 'Error');
    }
  };

  const handleDeleteImage = async (imagePublicId: string) => {
    try {
      await deleteImage({
        productPublicId,
        imagePublicId,
      }).unwrap();
      showToast('success', 'Image removed from gallery.', 'Deleted');
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to delete image.', 'Error');
    }
  };

  const handleMove = async (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newOrder = [...images];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const items = newOrder.map((img, idx) => ({
      public_id: img.public_id,
      sort_order: idx,
    }));

    try {
      await reorderImages({
        productPublicId,
        items,
      }).unwrap();
      showToast('success', 'Gallery order updated.', 'Reordered');
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to update order.', 'Error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Product Images & Gallery ({images.length})
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            High-resolution studio renders, dimensions, and detail photography.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Image
        </Button>
      </div>

      {images.length === 0 ? (
        <Card className="p-8 border-dashed">
          <EmptyState
            title="No images uploaded yet"
            description="Add product cover photography and multi-angle renders to display in the catalog."
            actionText="Add Product Image"
            onAction={() => setIsAddModalOpen(true)}
            icon={<ImageIcon className="w-8 h-8" />}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div
              key={img.public_id}
              className={`group relative rounded-xl border overflow-hidden bg-[var(--surface-surface)] flex flex-col transition-all ${
                img.is_primary
                  ? 'border-[var(--brand-accent)] ring-2 ring-[var(--brand-accent)]/20'
                  : 'border-[var(--border-border)] hover:border-[var(--text-muted)]'
              }`}
            >
              {/* Image Preview Container */}
              <div className="relative aspect-4/3 bg-[var(--surface-muted)] overflow-hidden">
                <img
                  src={img.image_url}
                  alt={img.alt_text || 'Product image'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                {/* Primary Badge */}
                {img.is_primary && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="success" size="sm" className="shadow-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Primary Cover
                    </Badge>
                  </div>
                )}

                {/* Image Type Tag */}
                {img.image_type && (
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                      {img.image_type}
                    </span>
                  </div>
                )}
              </div>

              {/* Meta & Actions */}
              <div className="p-3 flex flex-col gap-2 flex-1 justify-between bg-[var(--surface-surface)]">
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-1">
                    {img.alt_text || 'No alt text provided'}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Order: {img.sort_order}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-border)]">
                  {/* Reordering Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0 || isReordering}
                      onClick={() => handleMove(index, 'left')}
                      className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:opacity-30 disabled:pointer-events-none"
                      title="Move left"
                      aria-label="Move image earlier"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1 || isReordering}
                      onClick={() => handleMove(index, 'right')}
                      className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:opacity-30 disabled:pointer-events-none"
                      title="Move right"
                      aria-label="Move image later"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {!img.is_primary && (
                      <button
                        type="button"
                        disabled={isSettingPrimary}
                        onClick={() => handleSetPrimary(img.public_id)}
                        className="text-xs text-[var(--brand-accent)] hover:underline flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        Make Primary
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDeleteImage(img.public_id)}
                      className="p-1 rounded text-[var(--status-error)] hover:bg-red-500/10 transition-colors ml-1"
                      title="Delete Image"
                      aria-label="Delete image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Image Modal */}
      <ProductImageAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
        isLoading={isAdding}
      />
    </div>
  );
}

export default ProductImageGallery;
