import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast, ImageUpload } from '../../../components/ui';
import { useAddCustomRequestImageMutation } from '../../../app/store/api';
import { ImagePlus, AlertCircle } from 'lucide-react';

interface CustomRequestImageAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicId: string;
}

export function CustomRequestImageAddModal({
  isOpen,
  onClose,
  publicId,
}: CustomRequestImageAddModalProps) {
  const { showToast } = useToast();
  const [addImage, { isLoading }] = useAddCustomRequestImageMutation();

  const [imageUrl, setImageUrl] = useState('');
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError('Please select or upload a reference image.');
      return;
    }

    try {
      await addImage({
        publicId,
        data: {
          image_url: imageUrl.trim(),
          cloudinary_public_id: cloudinaryPublicId.trim() || undefined,
        },
      }).unwrap();

      showToast('success', 'Reference image successfully attached.', 'Image Added');
      setImageUrl('');
      setCloudinaryPublicId('');
      setError('');
      onClose();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to attach image.';
      showToast('error', msg, 'Upload Error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attach Reference Image"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-[var(--color-error-500)]/10 border border-[var(--color-error-500)]/20 flex items-center gap-2 text-sm text-[var(--color-error-500)]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ImageUpload
          label="Reference Photo / Technical Drawing"
          value={imageUrl}
          publicId={cloudinaryPublicId}
          onChange={(url, publicId) => {
            setImageUrl(url);
            if (publicId !== undefined) {
              setCloudinaryPublicId(publicId);
            }
            if (error) setError('');
          }}
          onRemove={() => {
            setImageUrl('');
            setCloudinaryPublicId('');
          }}
          folder="custom_requests"
          required
          disabled={isLoading}
          helperText="Upload reference sketch, blueprint render, or inspiration photo (PNG, JPG, WEBP up to 10MB)"
        />

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Cloudinary Public ID (Optional)
          </label>
          <Input
            type="text"
            value={cloudinaryPublicId}
            onChange={(e) => setCloudinaryPublicId(e.target.value)}
            placeholder="Auto-populated on upload or enter custom ID"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<ImagePlus className="w-4 h-4" />}
          >
            Attach Image
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CustomRequestImageAddModal;
