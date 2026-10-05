import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Images,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  UploadCloud,
  Archive,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  AlertCircle,
} from 'lucide-react';
import {
  useGetGalleriesQuery,
  usePublishGalleryMutation,
  useArchiveGalleryMutation,
  useDeleteGalleryMutation,
} from '../../../app/store/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card, CardContent } from '../../../components/ui/Card';
import { LoadingState } from '../../../components/ui';
import { useToast } from '../../../components/ui';
import { formatDate } from '../../../utils/date';
import type { GalleryItem, GalleryStatus } from '../../../types/gallery';
import {
  GALLERY_CATEGORY_OPTIONS,
  GALLERY_SORT_OPTIONS,
} from '../constants';
import { GalleryStatusBadge } from '../components/GalleryStatusBadge';
import { GalleryFormModal } from '../components/GalleryFormModal';
import { GalleryDeleteDialog } from '../components/GalleryDeleteDialog';

export function GalleryListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Query State
  const [page, setPage] = useState(1);
  const limit = 12;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<GalleryStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortOption, setSortOption] = useState('-created_at');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [deletingGallery, setDeletingGallery] = useState<GalleryItem | null>(null);

  // RTK Query
  const queryParams = useMemo(() => {
    const params: any = {
      page,
      limit,
      sort: sortOption,
    };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;
    return params;
  }, [page, limit, sortOption, searchTerm, statusFilter, categoryFilter]);

  const { data: response, isLoading, isFetching, error } = useGetGalleriesQuery(queryParams);
  const [publishGallery, { isLoading: isPublishing }] = usePublishGalleryMutation();
  const [archiveGallery, { isLoading: isArchiving }] = useArchiveGalleryMutation();
  const [deleteGallery, { isLoading: isDeleting }] = useDeleteGalleryMutation();

  const items = response?.data?.items || [];
  const pagination = response?.data?.pagination || {
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  };

  const handlePublish = async (publicId: string, title: string) => {
    try {
      await publishGallery(publicId).unwrap();
      showToast('success', `Project "${title}" published to live portfolio.`, 'Published');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to publish gallery.';
      showToast('error', msg, 'Error');
    }
  };

  const handleArchive = async (publicId: string, title: string) => {
    try {
      await archiveGallery(publicId).unwrap();
      showToast('info', `Project "${title}" moved to archive.`, 'Archived');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to archive gallery.';
      showToast('error', msg, 'Error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGallery) return;

    try {
      await deleteGallery(deletingGallery.public_id).unwrap();
      showToast('success', `Project "${deletingGallery.title}" deleted successfully.`, 'Deleted');
      setDeletingGallery(null);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to delete gallery.';
      showToast('error', msg, 'Delete Failed');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setSortOption('-created_at');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Images className="w-6 h-6 text-[var(--color-primary-500)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Gallery &amp; Project Showcase
            </h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Curate architectural stainless steel installations, bespoke residential suites, and commercial projects.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Project Showcase
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-[var(--border-border)]">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Total Showcases</span>
            <div className="text-xl font-bold text-[var(--text-primary)] mt-1">
              {pagination.total}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border cursor-pointer transition-all ${
            statusFilter === 'published'
              ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/10'
              : 'border-[var(--border-border)] hover:border-[var(--text-tertiary)]'
          }`}
          onClick={() => {
            setStatusFilter(statusFilter === 'published' ? '' : 'published');
            setPage(1);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Published</span>
              <GalleryStatusBadge status="published" size="sm" />
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">
              {statusFilter === 'published' ? 'Active Filter' : 'Filter by Published'}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border cursor-pointer transition-all ${
            statusFilter === 'draft'
              ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/10'
              : 'border-[var(--border-border)] hover:border-[var(--text-tertiary)]'
          }`}
          onClick={() => {
            setStatusFilter(statusFilter === 'draft' ? '' : 'draft');
            setPage(1);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Drafts</span>
              <GalleryStatusBadge status="draft" size="sm" />
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">
              {statusFilter === 'draft' ? 'Active Filter' : 'Filter by Draft'}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border cursor-pointer transition-all ${
            statusFilter === 'archived'
              ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/10'
              : 'border-[var(--border-border)] hover:border-[var(--text-tertiary)]'
          }`}
          onClick={() => {
            setStatusFilter(statusFilter === 'archived' ? '' : 'archived');
            setPage(1);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Archived</span>
              <GalleryStatusBadge status="archived" size="sm" />
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">
              {statusFilter === 'archived' ? 'Active Filter' : 'Filter by Archived'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-[var(--border-border)] shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search title, description, slug..."
                className="pl-9 text-sm"
              />
            </div>

            {/* Status */}
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as GalleryStatus | '');
                  setPage(1);
                }}
                className="text-sm"
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="text-sm"
              >
                <option value="">All Categories</option>
                {GALLERY_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Sort */}
            <div>
              <Select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setPage(1);
                }}
                className="text-sm"
              >
                {GALLERY_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {(searchTerm || statusFilter || categoryFilter) && (
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-border)] text-xs text-[var(--text-secondary)]">
              <span>Active filters applied</span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[var(--color-primary-500)] hover:underline font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-16">
          <LoadingState message="Loading gallery project showcases..." />
        </div>
      ) : error ? (
        <Card className="border-[var(--color-error-500)]/30 bg-[var(--color-error-500)]/10">
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[var(--color-error-500)] mx-auto" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Failed to load gallery projects
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              An error occurred while communicating with the backend gallery service.
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border-[var(--border-border)]">
          <CardContent className="p-12 text-center space-y-3">
            <Images className="w-12 h-12 text-[var(--text-tertiary)] mx-auto opacity-60" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              No gallery showcases found
            </h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
              {searchTerm || statusFilter || categoryFilter
                ? 'No project showcases matched your filter parameters.'
                : 'Create your first project showcase to display completed bespoke installations on the website.'}
            </p>
            {searchTerm || statusFilter || categoryFilter ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create First Showcase
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border border-[var(--border-border)] overflow-hidden bg-[var(--background-primary)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-border)] bg-[var(--background-secondary)] text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    <th className="py-3 px-4">Showcase / Cover</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Photos</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-border)]">
                  {items.map((item) => {
                    const coverImage = item.images && item.images.length > 0 ? item.images[0] : null;
                    return (
                      <tr
                        key={item.public_id}
                        className="hover:bg-[var(--background-secondary)]/50 transition-colors"
                      >
                        {/* Title & Cover */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg border border-[var(--border-border)] overflow-hidden bg-black/20 flex-shrink-0 flex items-center justify-center">
                              {coverImage ? (
                                <img
                                  src={coverImage.image_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div
                                onClick={() => navigate(`/admin/gallery/${item.public_id}`)}
                                className="font-semibold text-[var(--text-primary)] hover:text-[var(--color-primary-500)] cursor-pointer truncate max-w-xs"
                                title={item.title}
                              >
                                {item.title}
                              </div>
                              <div className="text-xs font-mono text-[var(--text-tertiary)] truncate">
                                /{item.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 capitalize text-xs text-[var(--text-secondary)]">
                          {item.category ? item.category.replace(/_/g, ' ') : 'General'}
                        </td>

                        {/* Photos count */}
                        <td className="py-3.5 px-4 text-xs font-medium text-[var(--text-primary)]">
                          <span className="px-2 py-0.5 rounded-full bg-[var(--background-secondary)] border border-[var(--border-border)]">
                            {item.images?.length || 0} photo(s)
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                          {formatDate(item.created_at)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <GalleryStatusBadge status={item.status} size="sm" />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/gallery/${item.public_id}`)}
                            title="View / Manage Photos"
                          >
                            <Eye className="w-4 h-4 text-[var(--color-primary-500)]" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingGallery(item)}
                            title="Edit Showcase Details"
                          >
                            <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" />
                          </Button>

                          {item.status !== 'published' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePublish(item.public_id, item.title)}
                              disabled={isPublishing}
                              title="Publish to Live Website"
                            >
                              <UploadCloud className="w-4 h-4 text-emerald-500" />
                            </Button>
                          )}

                          {item.status !== 'archived' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(item.public_id, item.title)}
                              disabled={isArchiving}
                              title="Archive Showcase"
                            >
                              <Archive className="w-4 h-4 text-amber-500" />
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingGallery(item)}
                            title="Delete Showcase"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {items.map((item) => {
              const coverImage = item.images && item.images.length > 0 ? item.images[0] : null;
              return (
                <Card key={item.public_id} className="border-[var(--border-border)]">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg border border-[var(--border-border)] overflow-hidden bg-black/20 flex-shrink-0 flex items-center justify-center">
                        {coverImage ? (
                          <img
                            src={coverImage.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-[var(--text-tertiary)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-mono text-[var(--text-tertiary)] truncate">
                            /{item.slug}
                          </span>
                          <GalleryStatusBadge status={item.status} size="sm" />
                        </div>
                        <h3 className="font-semibold text-sm text-[var(--text-primary)] mt-0.5 truncate">
                          {item.title}
                        </h3>
                        <div className="text-xs text-[var(--text-secondary)] capitalize mt-0.5">
                          {item.category?.replace(/_/g, ' ') || 'General'} • {item.images?.length || 0} photos
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-border)]">
                      <span>{formatDate(item.created_at)}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingGallery(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/admin/gallery/${item.public_id}`)}
                        >
                          Photos
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[var(--text-secondary)]">
              <div>
                Showing {(page - 1) * limit + 1} to{' '}
                {Math.min(page * limit, pagination.total)} of {pagination.total} showcases
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>

                <span className="px-2 font-medium">
                  Page {page} of {pagination.totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages || isFetching}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || editingGallery) && (
        <GalleryFormModal
          isOpen={isCreateModalOpen || Boolean(editingGallery)}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingGallery(null);
          }}
          gallery={editingGallery}
        />
      )}

      {/* Delete Dialog */}
      {deletingGallery && (
        <GalleryDeleteDialog
          isOpen={Boolean(deletingGallery)}
          onClose={() => setDeletingGallery(null)}
          onConfirm={handleDeleteConfirm}
          title={deletingGallery.title}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

export default GalleryListPage;
