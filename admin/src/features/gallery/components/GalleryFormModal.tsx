import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../components/ui';
import {
  useCreateGalleryMutation,
  useUpdateGalleryMutation,
} from '../../../app/store/api';
import type { GalleryItem, GalleryStatus } from '../../../types/gallery';
import { GALLERY_CATEGORY_OPTIONS, generateSlug } from '../constants';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface GalleryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery?: GalleryItem | null;
}

interface InnerFormProps {
  gallery?: GalleryItem | null;
  onClose: () => void;
}

function GalleryFormContent({ gallery, onClose }: InnerFormProps) {
  const isEditing = Boolean(gallery);
  const { showToast } = useToast();

  const [createGallery, { isLoading: isCreating }] = useCreateGalleryMutation();
  const [updateGallery, { isLoading: isUpdating }] = useUpdateGalleryMutation();
  const isLoading = isCreating || isUpdating;

  const [title, setTitle] = useState(gallery?.title || '');
  const [slug, setSlug] = useState(gallery?.slug || '');
  const [category, setCategory] = useState(gallery?.category || 'residential');
  const [description, setDescription] = useState(gallery?.description || '');
  const [status, setStatus] = useState<GalleryStatus>(gallery?.status || 'draft');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(gallery));
  const [errorMsg, setErrorMsg] = useState('');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && !slugManuallyEdited) {
      setSlug(generateSlug(val));
    }
    if (errorMsg) setErrorMsg('');
  };

  const handleSlugChange = (val: string) => {
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    setSlugManuallyEdited(true);
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Project title is required.');
      return;
    }
    if (!slug.trim()) {
      setErrorMsg('URL Slug is required.');
      return;
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug.trim())) {
      setErrorMsg('Slug must contain only lowercase letters, numbers, and hyphens (no consecutive hyphens).');
      return;
    }

    try {
      if (isEditing && gallery) {
        await updateGallery({
          publicId: gallery.public_id,
          data: {
            title: title.trim(),
            slug: slug.trim(),
            category: category.trim() || null,
            description: description.trim() || null,
            status,
          },
        }).unwrap();

        showToast('success', `Project "${title}" updated successfully.`, 'Showcase Updated');
      } else {
        await createGallery({
          title: title.trim(),
          slug: slug.trim(),
          category: category.trim() || null,
          description: description.trim() || null,
          status,
        }).unwrap();

        showToast('success', `Project "${title}" created successfully.`, 'Showcase Created');
      }

      onClose();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to save gallery showcase.';
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

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Project Title <span className="text-[var(--color-error-500)]">*</span>
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. Modern Minimalist Stainless Steel Dining Set"
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            URL Slug <span className="text-[var(--color-error-500)]">*</span>
          </label>
          <Input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="e.g. modern-minimalist-ss-dining"
            required
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            URL-safe identifier (lowercase letters, numbers, hyphens).
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Category
          </label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {GALLERY_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Publication Status
        </label>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as GalleryStatus)}
        >
          <option value="draft">Draft (Private / In Progress)</option>
          <option value="published">Published (Public Portfolio)</option>
          <option value="archived">Archived (Internal Archive)</option>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Project Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Provide architectural background, material specifications, design context, and fabrication highlights..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-border)] bg-[var(--background-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
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
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          {isEditing ? 'Save Changes' : 'Create Showcase'}
        </Button>
      </div>
    </form>
  );
}

export function GalleryFormModal({
  isOpen,
  onClose,
  gallery,
}: GalleryFormModalProps) {
  const isEditing = Boolean(gallery);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Project Showcase' : 'Create New Project Showcase'}
      maxWidth="lg"
    >
      <GalleryFormContent
        key={gallery?.public_id || 'new'}
        gallery={gallery}
        onClose={onClose}
      />
    </Modal>
  );
}

export default GalleryFormModal;
