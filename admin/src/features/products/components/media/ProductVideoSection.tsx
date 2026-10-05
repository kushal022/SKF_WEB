import React, { useState } from 'react';
import { Video, Plus, Trash2, ExternalLink } from 'lucide-react';
import {
  useGetProductVideosQuery,
  useAddProductVideoMutation,
  useDeleteProductVideoMutation,
} from '../../../../app/store/api';
import type { CreateVideoRequest } from '../../../../types/catalog';
import { Button, Input, Modal, Badge, useToast, Card, EmptyState, LoadingState, ImageUpload } from '../../../../components/ui';

interface ProductVideoSectionProps {
  productPublicId: string;
}

export function ProductVideoSection({ productPublicId }: ProductVideoSectionProps) {
  const { showToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [title, setTitle] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState('');

  // Queries & Mutations
  const { data: videosResponse, isLoading, refetch } = useGetProductVideosQuery(productPublicId);
  const [addVideo, { isLoading: isAdding }] = useAddProductVideoMutation();
  const [deleteVideo, { isLoading: isDeleting }] = useDeleteProductVideoMutation();

  const videos = videosResponse?.data?.videos || [];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      setFormError('Video URL is required');
      return;
    }

    try {
      const payload: CreateVideoRequest = {
        video_url: videoUrl.trim(),
        thumbnail_url: thumbnailUrl.trim() || null,
        title: title.trim() || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      };

      await addVideo({
        productPublicId,
        data: payload,
      }).unwrap();

      showToast('success', 'Product video added successfully.', 'Added');
      setVideoUrl('');
      setThumbnailUrl('');
      setTitle('');
      setSortOrder(0);
      setIsActive(true);
      setFormError('');
      setIsAddModalOpen(false);
      refetch();
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to add video.', 'Error');
    }
  };

  const handleDelete = async (videoPublicId: string) => {
    try {
      await deleteVideo({
        productPublicId,
        videoPublicId,
      }).unwrap();
      showToast('success', 'Video deleted.', 'Deleted');
      refetch();
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to delete video.', 'Error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Product Showcase Videos ({videos.length})
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Demonstrational videos, manufacturing highlights, and showroom walk-throughs.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Video
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-8">
          <LoadingState message="Loading videos..." />
        </Card>
      ) : videos.length === 0 ? (
        <Card className="p-8 border-dashed">
          <EmptyState
            title="No videos added yet"
            description="Attach product demonstration videos (e.g. YouTube, MP4 or CDN URLs)."
            actionText="Add Product Video"
            onAction={() => setIsAddModalOpen(true)}
            icon={<Video className="w-8 h-8" />}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((vid) => (
            <div
              key={vid.public_id}
              className="rounded-xl border border-[var(--border-border)] overflow-hidden bg-[var(--surface-surface)] flex flex-col justify-between"
            >
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[var(--surface-muted)] flex items-center justify-center text-[var(--brand-accent)]">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                        {vid.title || 'Product Video'}
                      </h4>
                      <Badge variant={vid.is_active ? 'success' : 'default'} size="sm" className="mt-0.5">
                        {vid.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDelete(vid.public_id)}
                    className="p-1 rounded text-[var(--status-error)] hover:bg-red-500/10 transition-colors"
                    title="Delete Video"
                    aria-label="Delete video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2">
                  <a
                    href={vid.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--brand-accent)] hover:underline flex items-center gap-1 font-mono break-all line-clamp-1"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {vid.video_url}
                  </a>
                </div>
              </div>

              <div className="px-4 py-2 bg-[var(--surface-muted)] border-t border-[var(--border-border)] text-[10px] text-[var(--text-muted)] flex justify-between">
                <span>Sort Order: {vid.sort_order}</span>
                <span>ID: {vid.public_id.slice(0, 8)}...</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Video Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Product Video"
        description="Attach a video demonstration link for this product."
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Video URL *"
            placeholder="https://youtube.com/watch?v=... or https://cdn.skf.com/video.mp4"
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              if (formError) setFormError('');
            }}
            error={formError}
            disabled={isAdding}
            helperText="YouTube, Vimeo, or direct MP4 URL"
            required
          />

          <Input
            label="Video Title"
            placeholder="e.g. Royal Bed Assembly & Strength Demonstration"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isAdding}
          />

          <ImageUpload
            label="Custom Thumbnail Image (Optional)"
            value={thumbnailUrl}
            onChange={(url) => setThumbnailUrl(url)}
            onRemove={() => setThumbnailUrl('')}
            folder="products"
            aspectRatio="video"
            disabled={isAdding}
            helperText="Upload custom video cover thumbnail (recommended: 16:9 JPG, PNG, or WEBP)"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sort Order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              disabled={isAdding}
            />

            <div className="flex flex-col justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">
                Visibility
              </span>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isAdding}
                  className="w-4 h-4 rounded border-[var(--border-border)] text-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Active
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isAdding}>
              {isAdding ? 'Adding Video...' : 'Add Video'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ProductVideoSection;
