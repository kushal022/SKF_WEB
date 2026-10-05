import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Images,
  Edit2,
  Trash2,
  UploadCloud,
  Archive,
  ImagePlus,
  ExternalLink,
  Eye,
  AlertCircle,
} from 'lucide-react';
import {
  useGetGalleryByPublicIdQuery,
  usePublishGalleryMutation,
  useArchiveGalleryMutation,
  useDeleteGalleryMutation,
  useDeleteGalleryImageMutation,
} from '../../../app/store/api';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { LoadingState } from '../../../components/ui';
import { useToast } from '../../../components/ui';
import { formatDate } from '../../../utils/date';
import type { GalleryImage } from '../../../types/gallery';
import { GalleryStatusBadge } from '../components/GalleryStatusBadge';
import { GalleryFormModal } from '../components/GalleryFormModal';
import { GalleryImageModal } from '../components/GalleryImageModal';
import { GalleryDeleteDialog } from '../components/GalleryDeleteDialog';
import { GalleryImageLightbox } from '../components/GalleryImageLightbox';

export function GalleryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: response, isLoading, error } = useGetGalleryByPublicIdQuery(id || '', {
    skip: !id,
  });

  const [publishGallery, { isLoading: isPublishing }] = usePublishGalleryMutation();
  const [archiveGallery, { isLoading: isArchiving }] = useArchiveGalleryMutation();
  const [deleteGallery, { isLoading: isDeletingGallery }] = useDeleteGalleryMutation();
  const [deleteGalleryImage, { isLoading: isDeletingImage }] = useDeleteGalleryImageMutation();

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const gallery = response?.data;
  const images = gallery?.images || [];

  const handlePublish = async () => {
    if (!id || !gallery) return;
    try {
      await publishGallery(id).unwrap();
      showToast('success', `Project "${gallery.title}" published to live portfolio.`, 'Published');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to publish gallery.';
      showToast('error', msg, 'Error');
    }
  };

  const handleArchive = async () => {
    if (!id || !gallery) return;
    try {
      await archiveGallery(id).unwrap();
      showToast('info', `Project "${gallery.title}" archived.`, 'Archived');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to archive gallery.';
      showToast('error', msg, 'Error');
    }
  };

  const handleDeleteGallery = async () => {
    if (!id || !gallery) return;
    try {
      await deleteGallery(id).unwrap();
      showToast('success', `Project "${gallery.title}" deleted successfully.`, 'Deleted');
      navigate('/admin/gallery');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to delete gallery.';
      showToast('error', msg, 'Delete Failed');
    }
  };

  const handleDeleteImage = async (imagePublicId: string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to remove this project photo?')) {
      return;
    }

    try {
      await deleteGalleryImage({
        publicId: id,
        imagePublicId,
      }).unwrap();
      showToast('success', 'Project photo removed.', 'Photo Deleted');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to delete image.';
      showToast('error', msg, 'Delete Failed');
    }
  };

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingState message="Loading project showcase details..." />
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/gallery')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Gallery
        </Button>
        <Card className="border-[var(--color-error-500)]/30 bg-[var(--color-error-500)]/10">
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[var(--color-error-500)] mx-auto" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Gallery Project Not Found
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              The requested gallery portfolio showcase does not exist or has been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/gallery')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-xs -ml-2 text-[var(--text-secondary)]"
          >
            Back to Gallery Portfolio
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Images className="w-6 h-6 text-[var(--color-primary-500)]" />
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {gallery.title}
              </h1>
            </div>
            <GalleryStatusBadge status={gallery.status} />
          </div>
          <div className="text-xs font-mono text-[var(--text-tertiary)] flex items-center gap-3">
            <span>Slug: /{gallery.slug}</span>
            <span>•</span>
            <span>Created: {formatDate(gallery.created_at)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {gallery.status !== 'published' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePublish}
              isLoading={isPublishing}
              leftIcon={<UploadCloud className="w-4 h-4 text-emerald-500" />}
            >
              Publish
            </Button>
          )}

          {gallery.status !== 'archived' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleArchive}
              isLoading={isArchiving}
              leftIcon={<Archive className="w-4 h-4 text-amber-500" />}
            >
              Archive
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit2 className="w-4 h-4" />}
          >
            Edit Details
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4 text-red-400" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Project Photos Manager */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[var(--border-border)] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border-border)]">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
                  Project Portfolio Photos
                </CardTitle>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--background-secondary)] text-[var(--text-secondary)] font-medium">
                  {images.length} {images.length === 1 ? 'photo' : 'photos'}
                </span>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsAddImageModalOpen(true)}
                leftIcon={<ImagePlus className="w-4 h-4" />}
              >
                Attach Photo
              </Button>
            </CardHeader>

            <CardContent className="pt-4">
              {images.length === 0 ? (
                <div className="py-12 text-center space-y-3 border border-dashed border-[var(--border-border)] rounded-lg bg-[var(--background-secondary)]/30">
                  <ImagePlus className="w-10 h-10 text-[var(--text-tertiary)] mx-auto opacity-60" />
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    No project photos attached yet
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                    Attach high-resolution photographs, CAD drawings, or finishes renders to display this showcase in the public portfolio.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddImageModalOpen(true)}
                    leftIcon={<ImagePlus className="w-4 h-4" />}
                  >
                    Attach First Photo
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((img, idx) => (
                    <div
                      key={img.public_id}
                      className="group relative rounded-xl border border-[var(--border-border)] overflow-hidden bg-[var(--background-secondary)] flex flex-col"
                    >
                      {/* Image Frame */}
                      <div className="relative aspect-video bg-black/30 overflow-hidden">
                        <img
                          src={img.image_url}
                          alt={img.alt_text || `Photo ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />

                        {/* Order Badge */}
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                          #{img.sort_order}
                        </div>

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setLightboxIndex(idx)}
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                            title="Fullscreen view"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingImage(img)}
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                            title="Edit metadata"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.public_id)}
                            disabled={isDeletingImage}
                            className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                            title="Delete photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Metadata footer */}
                      <div className="p-2.5 text-xs space-y-1">
                        <div className="text-[var(--text-primary)] truncate font-medium">
                          {img.alt_text || 'No caption/alt-text specified'}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-mono">
                          <span>Order: {img.sort_order}</span>
                          <a
                            href={img.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-0.5"
                          >
                            <span>Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Project Details & Metadata */}
        <div className="space-y-6">
          <Card className="border-[var(--border-border)] shadow-sm">
            <CardHeader className="pb-3 border-b border-[var(--border-border)]">
              <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="text-xs text-[var(--text-secondary)] font-medium">Category</span>
                <div className="text-sm font-semibold text-[var(--text-primary)] capitalize mt-0.5">
                  {gallery.category ? gallery.category.replace(/_/g, ' ') : 'General'}
                </div>
              </div>

              <div>
                <span className="text-xs text-[var(--text-secondary)] font-medium">Public URL Path</span>
                <div className="text-xs font-mono text-[var(--color-primary-500)] mt-0.5 bg-[var(--background-secondary)] p-2 rounded border border-[var(--border-border)] truncate">
                  /gallery/{gallery.slug}
                </div>
              </div>

              <div>
                <span className="text-xs text-[var(--text-secondary)] font-medium">Description</span>
                <div className="mt-1 p-3 rounded-lg bg-[var(--background-secondary)] text-xs text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed border border-[var(--border-border)]">
                  {gallery.description || 'No detailed architectural description entered.'}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-border)] text-xs space-y-1 text-[var(--text-tertiary)]">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-[var(--text-secondary)]">{formatDate(gallery.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Modified:</span>
                  <span className="text-[var(--text-secondary)]">{formatDate(gallery.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Showcase Modal */}
      {isEditModalOpen && (
        <GalleryFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          gallery={gallery}
        />
      )}

      {/* Delete Showcase Dialog */}
      {isDeleteModalOpen && (
        <GalleryDeleteDialog
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteGallery}
          title={gallery.title}
          isLoading={isDeletingGallery}
        />
      )}

      {/* Add / Edit Image Modal */}
      {(isAddImageModalOpen || editingImage) && (
        <GalleryImageModal
          isOpen={isAddImageModalOpen || Boolean(editingImage)}
          onClose={() => {
            setIsAddImageModalOpen(false);
            setEditingImage(null);
          }}
          galleryPublicId={gallery.public_id}
          image={editingImage}
        />
      )}

      {/* Lightbox Preview */}
      {lightboxIndex !== null && (
        <GalleryImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={(idx) => setLightboxIndex(idx)}
        />
      )}
    </div>
  );
}

export default GalleryDetailPage;
