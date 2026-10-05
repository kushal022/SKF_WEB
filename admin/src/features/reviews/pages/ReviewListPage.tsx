import { useState, useMemo } from 'react';
import {
  Star,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Package,
  SlidersHorizontal,
  RotateCcw,
  Eye,
} from 'lucide-react';
import {
  useGetReviewsQuery,
  useUpdateReviewStatusMutation,
  useSetReviewFeaturedMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} from '../../../app/store/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card, CardContent } from '../../../components/ui/Card';
import { LoadingState } from '../../../components/ui';
import { useToast } from '../../../components/ui';
import type {
  ReviewItem,
  ReviewStatus,
  UpdateReviewPayload,
} from '../../../types/review';
import {
  REVIEW_SORT_OPTIONS,
  RATING_FILTER_OPTIONS,
} from '../constants';
import { ReviewStatusBadge } from '../components/ReviewStatusBadge';
import { StarRating } from '../components/StarRating';
import { ReviewDetailModal } from '../components/ReviewDetailModal';
import { ReviewDeleteDialog } from '../components/ReviewDeleteDialog';

export function ReviewListPage() {
  const { showToast } = useToast();

  // Query & Filter State
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | ''>('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [featuredFilter, setFeaturedFilter] = useState<string>('');
  const [sortOption, setSortOption] = useState('-created_at');

  // Modals state
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [deletingReview, setDeletingReview] = useState<ReviewItem | null>(null);

  // RTK Query
  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      page,
      limit,
      sort: sortOption,
    };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (statusFilter) params.status = statusFilter;
    if (ratingFilter) params.rating = Number(ratingFilter);
    if (featuredFilter === 'true') params.is_featured = true;
    if (featuredFilter === 'false') params.is_featured = false;
    return params;
  }, [page, limit, sortOption, searchTerm, statusFilter, ratingFilter, featuredFilter]);

  const { data: response, isLoading, isFetching, error, refetch } = useGetReviewsQuery(queryParams);

  const [updateReviewStatus, { isLoading: isUpdatingStatus }] = useUpdateReviewStatusMutation();
  const [setReviewFeatured, { isLoading: isUpdatingFeatured }] = useSetReviewFeaturedMutation();
  const [updateReview, { isLoading: isUpdatingReview }] = useUpdateReviewMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  const items = response?.data?.items || [];
  const pagination = response?.data?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  // Quick Action Handlers
  const handleStatusChange = async (publicId: string, newStatus: ReviewStatus) => {
    try {
      await updateReviewStatus({
        publicId,
        data: { status: newStatus },
      }).unwrap();

      const actionLabel =
        newStatus === 'approved'
          ? 'approved and published'
          : newStatus === 'rejected'
          ? 'rejected'
          : 'moved to pending';
      showToast('success', `Review has been ${actionLabel}.`, 'Status Updated');

      // Update selectedReview if currently opened in modal
      if (selectedReview && selectedReview.public_id === publicId) {
        setSelectedReview((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg = errObj?.data?.message || errObj?.message || 'Failed to update review status.';
      showToast('error', msg, 'Error');
    }
  };

  const handleToggleFeatured = async (publicId: string, isFeatured: boolean) => {
    try {
      await setReviewFeatured({
        publicId,
        data: { is_featured: isFeatured },
      }).unwrap();

      showToast(
        'success',
        isFeatured
          ? 'Review marked as featured showcase.'
          : 'Review removed from featured showcase.',
        'Featured State Updated'
      );

      if (selectedReview && selectedReview.public_id === publicId) {
        setSelectedReview((prev) => (prev ? { ...prev, is_featured: isFeatured } : null));
      }
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg = errObj?.data?.message || errObj?.message || 'Failed to update featured state.';
      showToast('error', msg, 'Error');
    }
  };

  const handleUpdateReview = async (publicId: string, payload: UpdateReviewPayload) => {
    try {
      const res = await updateReview({ publicId, data: payload }).unwrap();
      showToast('success', 'Review details updated successfully.', 'Review Saved');
      if (res.data) {
        setSelectedReview(res.data);
      }
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg = errObj?.data?.message || errObj?.message || 'Failed to update review.';
      showToast('error', msg, 'Error');
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReview) return;
    try {
      await deleteReview(deletingReview.public_id).unwrap();
      showToast('success', 'Customer review deleted successfully.', 'Deleted');
      setDeletingReview(null);
      if (selectedReview?.public_id === deletingReview.public_id) {
        setSelectedReview(null);
      }
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg = errObj?.data?.message || errObj?.message || 'Failed to delete review.';
      showToast('error', msg, 'Delete Failed');
    }
  };

  const hasActiveFilters = Boolean(
    searchTerm || statusFilter || ratingFilter || featuredFilter || sortOption !== '-created_at'
  );

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setRatingFilter('');
    setFeaturedFilter('');
    setSortOption('-created_at');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Customer Reviews &amp; Moderation
            </h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Review customer ratings, moderate feedback, approve testimonials, and curate featured highlights.
          </p>
        </div>
      </div>

      {/* Summary Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-[var(--border-border)]">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Total Reviews</span>
            <div className="text-xl font-bold text-[var(--text-primary)] mt-1">
              {pagination.total}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border cursor-pointer transition-all ${
            statusFilter === 'pending'
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-[var(--border-border)] hover:border-[var(--text-tertiary)]'
          }`}
          onClick={() => {
            setStatusFilter(statusFilter === 'pending' ? '' : 'pending');
            setPage(1);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Pending</span>
              <ReviewStatusBadge status="pending" size="sm" />
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">
              {statusFilter === 'pending' ? 'Active Filter' : 'Filter by Pending'}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border cursor-pointer transition-all ${
            statusFilter === 'approved'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-[var(--border-border)] hover:border-[var(--text-tertiary)]'
          }`}
          onClick={() => {
            setStatusFilter(statusFilter === 'approved' ? '' : 'approved');
            setPage(1);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Approved &amp; Live</span>
              <ReviewStatusBadge status="approved" size="sm" />
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">
              {statusFilter === 'approved' ? 'Active Filter' : 'Filter by Approved'}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border cursor-pointer transition-all ${
            featuredFilter === 'true'
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-[var(--border-border)] hover:border-[var(--text-tertiary)]'
          }`}
          onClick={() => {
            setFeaturedFilter(featuredFilter === 'true' ? '' : 'true');
            setPage(1);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Featured Showcases</span>
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">
              {featuredFilter === 'true' ? 'Active Filter' : 'Filter by Featured'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters Bar */}
      <Card className="border-[var(--border-border)]">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search by customer name or text..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search className="w-4 h-4 text-[var(--text-secondary)]" />}
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ReviewStatus | '');
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending Moderation' },
                  { value: 'approved', label: 'Approved & Live' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
            </div>

            {/* Rating Filter */}
            <div>
              <Select
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value);
                  setPage(1);
                }}
                options={RATING_FILTER_OPTIONS}
              />
            </div>

            {/* Sort */}
            <div>
              <Select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setPage(1);
                }}
                options={REVIEW_SORT_OPTIONS}
              />
            </div>
          </div>

          {/* Secondary Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-border)]/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)] font-medium">Showcase:</span>
              <button
                type="button"
                onClick={() => {
                  setFeaturedFilter('');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  featuredFilter === ''
                    ? 'bg-[var(--brand-primary)] text-white font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-surface)]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setFeaturedFilter('true');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  featuredFilter === 'true'
                    ? 'bg-amber-500 text-white font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-surface)]'
                }`}
              >
                <Star className="w-3 h-3 fill-current" />
                Featured Only
              </button>
              <button
                type="button"
                onClick={() => {
                  setFeaturedFilter('false');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  featuredFilter === 'false'
                    ? 'bg-[var(--surface-surface)] text-[var(--text-primary)] font-medium border border-[var(--border-border)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-surface)]'
                }`}
              >
                Standard Only
              </button>
            </div>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && <LoadingState message="Loading customer reviews..." />}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-[var(--color-error-500)]/30 bg-[var(--color-error-500)]/5">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-[var(--color-error-500)] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Failed to Load Reviews
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
              An error occurred while fetching review records. Please try again.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <Card className="border-[var(--border-border)]">
          <CardContent className="p-12 text-center">
            <Star className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              No Reviews Found
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No customer reviews match your active filter criteria. Try clearing some filters.'
                : 'No reviews have been submitted by customers yet.'}
            </p>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-4"
                leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Content: Desktop Table & Mobile Cards */}
      {!isLoading && !error && items.length > 0 && (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)] shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-border)] bg-[var(--surface-background)]/80 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Review Content</th>
                  <th className="py-3 px-4">Product Association</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-border)] text-sm">
                {items.map((review) => (
                  <tr
                    key={review.public_id}
                    className="hover:bg-[var(--surface-background)]/50 transition-colors"
                  >
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[var(--text-primary)]">
                        {review.customer_name}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        {new Date(review.created_at).toLocaleDateString(undefined, {
                          dateStyle: 'medium',
                        })}
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StarRating rating={review.rating} size="sm" showNumber />
                    </td>

                    {/* Review Content */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p
                        className="text-xs text-[var(--text-secondary)] line-clamp-2 italic cursor-pointer hover:text-[var(--text-primary)]"
                        onClick={() => setSelectedReview(review)}
                        title="Click to view full review"
                      >
                        &ldquo;{review.review_text}&rdquo;
                      </p>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {review.product ? (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-primary)]">
                          <Package className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                          <span className="font-medium max-w-[150px] truncate" title={review.product.name}>
                            {review.product.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">
                          General Review
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <ReviewStatusBadge status={review.status} size="sm" />
                    </td>

                    {/* Featured Toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(review.public_id, !review.is_featured)}
                        disabled={isUpdatingFeatured}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                          review.is_featured
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-medium'
                            : 'text-[var(--text-muted)] hover:text-amber-500 hover:bg-[var(--surface-surface)]'
                        }`}
                        title={review.is_featured ? 'Click to unfeature' : 'Click to feature'}
                      >
                        <Star className={`w-3.5 h-3.5 ${review.is_featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                        <span>{review.is_featured ? 'Featured' : 'Standard'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {review.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(review.public_id, 'approved')}
                            disabled={isUpdatingStatus}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Approve & Publish"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {review.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(review.public_id, 'rejected')}
                            disabled={isUpdatingStatus}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Reject Review"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedReview(review)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-background)] rounded-lg transition-colors"
                          title="View Details & Moderate"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingReview(review)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {items.map((review) => (
              <Card key={review.public_id} className="border-[var(--border-border)]">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                        {review.customer_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size="sm" showNumber />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ReviewStatusBadge status={review.status} size="sm" />
                      {review.is_featured && (
                        <span className="p-1 rounded bg-amber-500/10 text-amber-500" title="Featured">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] italic bg-[var(--surface-background)] p-3 rounded-lg border border-[var(--border-border)]/50">
                    &ldquo;{review.review_text}&rdquo;
                  </p>

                  {review.product && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <Package className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                      <span className="font-medium text-[var(--text-primary)]">
                        {review.product.name}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-border)]/60 text-xs">
                    <span className="text-[var(--text-muted)]">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1">
                      {review.status !== 'approved' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(review.public_id, 'approved')}
                          disabled={isUpdatingStatus}
                          className="h-8 px-2 text-emerald-600 hover:bg-emerald-500/10"
                        >
                          Approve
                        </Button>
                      )}

                      {review.status !== 'rejected' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(review.public_id, 'rejected')}
                          disabled={isUpdatingStatus}
                          className="h-8 px-2 text-red-500 hover:bg-red-500/10"
                        >
                          Reject
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReview(review)}
                        className="h-8 px-2.5"
                      >
                        Details
                      </Button>

                      <button
                        type="button"
                        onClick={() => setDeletingReview(review)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
              <div className="text-xs text-[var(--text-secondary)]">
                Showing{' '}
                <span className="font-medium text-[var(--text-primary)]">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium text-[var(--text-primary)]">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium text-[var(--text-primary)]">{pagination.total}</span>{' '}
                reviews
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1 || isFetching}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                <span className="text-xs text-[var(--text-secondary)] px-2">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages || isFetching}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Detail Modal */}
      <ReviewDetailModal
        isOpen={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
        review={selectedReview}
        onUpdateStatus={handleStatusChange}
        onToggleFeatured={handleToggleFeatured}
        onUpdateReview={handleUpdateReview}
        isUpdatingStatus={isUpdatingStatus}
        isUpdatingFeatured={isUpdatingFeatured}
        isUpdatingReview={isUpdatingReview}
      />

      {/* Delete Confirmation Dialog */}
      <ReviewDeleteDialog
        isOpen={Boolean(deletingReview)}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleDeleteConfirm}
        customerName={deletingReview?.customer_name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default ReviewListPage;
