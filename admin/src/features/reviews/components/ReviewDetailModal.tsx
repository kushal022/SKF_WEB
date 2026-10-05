import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ReviewStatusBadge } from './ReviewStatusBadge';
import { StarRating } from './StarRating';
import type { ReviewItem, ReviewStatus, UpdateReviewPayload } from '../../../types/review';
import {
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Package,
  Calendar,
  Edit2,
  Save,
  RotateCcw,
} from 'lucide-react';

interface ReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewItem | null;
  onUpdateStatus: (publicId: string, status: ReviewStatus) => Promise<void>;
  onToggleFeatured: (publicId: string, isFeatured: boolean) => Promise<void>;
  onUpdateReview: (publicId: string, payload: UpdateReviewPayload) => Promise<void>;
  isUpdatingStatus: boolean;
  isUpdatingFeatured: boolean;
  isUpdatingReview: boolean;
}

interface DetailContentProps {
  review: ReviewItem;
  onClose: () => void;
  onUpdateStatus: (publicId: string, status: ReviewStatus) => Promise<void>;
  onToggleFeatured: (publicId: string, isFeatured: boolean) => Promise<void>;
  onUpdateReview: (publicId: string, payload: UpdateReviewPayload) => Promise<void>;
  isUpdatingStatus: boolean;
  isUpdatingFeatured: boolean;
  isUpdatingReview: boolean;
}

function ReviewDetailContent({
  review,
  onClose,
  onUpdateStatus,
  onToggleFeatured,
  onUpdateReview,
  isUpdatingStatus,
  isUpdatingFeatured,
  isUpdatingReview,
}: DetailContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customerName, setCustomerName] = useState(review.customer_name);
  const [rating, setRating] = useState<number>(review.rating);
  const [reviewText, setReviewText] = useState(review.review_text);
  const [editError, setEditError] = useState<string | null>(null);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setEditError('Customer name cannot be empty');
      return;
    }
    if (!reviewText.trim()) {
      setEditError('Review text cannot be empty');
      return;
    }
    if (rating < 1 || rating > 5) {
      setEditError('Rating must be between 1 and 5');
      return;
    }

    try {
      setEditError(null);
      await onUpdateReview(review.public_id, {
        customer_name: customerName.trim(),
        rating,
        review_text: reviewText.trim(),
      });
      setIsEditing(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save review changes';
      setEditError(errorMsg);
    }
  };

  const cancelEdit = () => {
    setCustomerName(review.customer_name);
    setRating(review.rating);
    setReviewText(review.review_text);
    setEditError(null);
    setIsEditing(false);
  };

  const isBusy = isUpdatingStatus || isUpdatingFeatured || isUpdatingReview;

  return (
    <div className="space-y-6">
      {/* Top Banner / Status Overview */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)]">
        <div className="flex items-center gap-3">
          <ReviewStatusBadge status={review.status} size="md" />
          {review.is_featured && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              Featured Showcase
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={review.is_featured ? 'outline' : 'secondary'}
            onClick={() => onToggleFeatured(review.public_id, !review.is_featured)}
            disabled={isBusy}
            leftIcon={<Star className={`w-3.5 h-3.5 ${review.is_featured ? 'fill-amber-500 text-amber-500' : ''}`} />}
          >
            {review.is_featured ? 'Unfeature' : 'Feature on Site'}
          </Button>

          {!isEditing && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              disabled={isBusy}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Content
            </Button>
          )}
        </div>
      </div>

      {editError && (
        <div className="p-3 rounded-lg bg-[var(--color-error-500)]/10 border border-[var(--color-error-500)]/20 text-xs text-[var(--color-error-500)]">
          {editError}
        </div>
      )}

      {/* Main Review Information / Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Customer Name *
            </label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              disabled={isBusy}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Rating (1 to 5 Stars) *
            </label>
            <div className="flex items-center gap-3">
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="px-3 py-2 text-sm rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                disabled={isBusy}
              >
                <option value={5}>5 Stars ★★★★★</option>
                <option value={4}>4 Stars ★★★★☆</option>
                <option value={3}>3 Stars ★★★☆☆</option>
                <option value={2}>2 Stars ★★☆☆☆</option>
                <option value={1}>1 Star  ★☆☆☆☆</option>
              </select>
              <StarRating rating={rating} size="lg" showNumber />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Review Testimonial Text *
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] resize-y"
              placeholder="Customer feedback and testimonial..."
              disabled={isBusy}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelEdit}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingReview}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-semibold text-[var(--text-primary)] text-base">
                  {review.customer_name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.rating} size="md" showNumber />
                </div>
              </div>
              <div className="text-right text-xs text-[var(--text-secondary)] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(review.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--surface-background)] border border-[var(--border-border)]/60 text-sm text-[var(--text-primary)] leading-relaxed italic">
              &ldquo;{review.review_text}&rdquo;
            </div>

            {review.product && (
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-border)]/50 text-xs text-[var(--text-secondary)]">
                <Package className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>Reviewed Product:</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {review.product.name}
                </span>
                <span className="text-[var(--text-muted)]">({review.product.slug})</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Moderation Workflow Actions */}
      <div className="p-4 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Moderation Decisions
        </h4>
        <p className="text-xs text-[var(--text-muted)]">
          Change this review&apos;s publication state. Approved reviews will appear on the public customer website.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {review.status !== 'approved' && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isBusy}
              onClick={() => onUpdateStatus(review.public_id, 'approved')}
              leftIcon={<CheckCircle className="w-4 h-4 text-emerald-300" />}
            >
              Approve & Publish
            </Button>
          )}

          {review.status !== 'rejected' && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isBusy}
              onClick={() => onUpdateStatus(review.public_id, 'rejected')}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Reject Review
            </Button>
          )}

          {review.status !== 'pending' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => onUpdateStatus(review.public_id, 'pending')}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Move Back to Pending
            </Button>
          )}
        </div>
      </div>

      {/* Metadata Footprint */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>ID: {review.public_id}</span>
        </div>
        <div>
          Updated: {new Date(review.updated_at).toLocaleString()}
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-[var(--border-border)]">
        <Button type="button" variant="outline" onClick={onClose} disabled={isBusy}>
          Close
        </Button>
      </div>
    </div>
  );
}

export function ReviewDetailModal({
  isOpen,
  onClose,
  review,
  onUpdateStatus,
  onToggleFeatured,
  onUpdateReview,
  isUpdatingStatus,
  isUpdatingFeatured,
  isUpdatingReview,
}: ReviewDetailModalProps) {
  if (!isOpen || !review) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Review Moderation"
      maxWidth="md"
    >
      <ReviewDetailContent
        key={review.public_id}
        review={review}
        onClose={onClose}
        onUpdateStatus={onUpdateStatus}
        onToggleFeatured={onToggleFeatured}
        onUpdateReview={onUpdateReview}
        isUpdatingStatus={isUpdatingStatus}
        isUpdatingFeatured={isUpdatingFeatured}
        isUpdatingReview={isUpdatingReview}
      />
    </Modal>
  );
}

export default ReviewDetailModal;
