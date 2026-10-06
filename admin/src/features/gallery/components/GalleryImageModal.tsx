import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast, ImageUpload } from '../../../components/ui';
import {
  useAddGalleryImageMutation,
  useUpdateGalleryImageMutation,
} from '../../../app/store/api';
import type { GalleryImage } from '../../../types/gallery';
import { ImagePlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface GalleryImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryPublicId: string;
  image?: GalleryImage | null;
}

interface InnerImageFormProps {
  galleryPublicId: string;
  image?: GalleryImage | null;
  onClose: () => void;
}

function GalleryImageFormContent({ galleryPublicId, image, onClose }: InnerImageFormProps) {
  const isEditing = Boolean(image);
  const { showToast } = useToast();

  const [addImage, { isLoading: isAdding }] = useAddGalleryImageMutation();
  const [updateImage, { isLoading: isUpdating }] = useUpdateGalleryImageMutation();
  const isLoading = isAdding || isUpdating;

  const [imageUrl, setImageUrl] = useState(image?.image_url || '');
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState(image?.cloudinary_public_id || '');
  const [altText, setAltText] = useState(image?.alt_text || '');
  const [sortOrder, setSortOrder] = useState<number>(image?.sort_order || 0);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setErrorMsg('Please select or upload a project image.');
      return;
    }

    try {
      if (isEditing && image) {
        await updateImage({
          publicId: galleryPublicId,
          imagePublicId: image.public_id,
          data: {
            image_url: imageUrl.trim(),
            cloudinary_public_id: cloudinaryPublicId.trim() || null,
            alt_text: altText.trim() || null,
            sort_order: Number(sortOrder) || 0,
          },
        }).unwrap();

        showToast('success', 'Project image updated successfully.', 'Image Updated');
      } else {
        await addImage({
          publicId: galleryPublicId,
          data: {
            image_url: imageUrl.trim(),
            cloudinary_public_id: cloudinaryPublicId.trim() || null,
            alt_text: altText.trim() || null,
            sort_order: Number(sortOrder) || 0,
          },
        }).unwrap();

        showToast('success', 'Project image added successfully.', 'Image Attached');
      }

      onClose();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to save gallery image.';
      setErrorMsg(msg);
      showToast('error', msg, 'Save Error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 rounded-lg bg-[var(--color-error-500)]/10 border border-[var(--color-error-500)]/20 flex items-center gap-2 text-sm text-[var(--color-error-500)]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <ImageUpload
        label="Project Photograph"
        value={imageUrl}
        publicId={cloudinaryPublicId}
        onChange={(url, publicId) => {
          setImageUrl(url);
          if (publicId !== undefined) {
            setCloudinaryPublicId(publicId);
          }
          if (errorMsg) setErrorMsg('');
        }}
        onRemove={() => {
          setImageUrl('');
          setCloudinaryPublicId('');
        }}
        folder="gallery"
        required
        disabled={isLoading}
        helperText="Upload showcase architectural render or photo (PNG, JPG, WEBP up to 10MB)"
      />

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Alt Text / Caption
        </label>
        <Input
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="e.g. Mirror finish 316 stainless steel dining table in modern penthouse"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Cloudinary Public ID (Optional)
          </label>
          <Input
            type="text"
            value={cloudinaryPublicId}
            onChange={(e) => setCloudinaryPublicId(e.target.value)}
            placeholder="Auto-populated on upload or enter custom ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Display Sort Order
          </label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            placeholder="0, 1, 2..."
            min={0}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-border)]">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          leftIcon={isEditing ? <CheckCircle2 className="w-4 h-4" /> : <ImagePlus className="w-4 h-4" />}
        >
          {isEditing ? 'Update Photo' : 'Attach Photo'}
        </Button>
      </div>
    </form>
  );
}

export function GalleryImageModal({
  isOpen,
  onClose,
  galleryPublicId,
  image,
}: GalleryImageModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={image ? 'Edit Project Image' : 'Attach Project Photo / CAD Render'}
      maxWidth="md"
    >
      <GalleryImageFormContent
        key={image?.public_id || 'new'}
        galleryPublicId={galleryPublicId}
        image={image}
        onClose={onClose}
      />
    </Modal>
  );
}

export default GalleryImageModal;
