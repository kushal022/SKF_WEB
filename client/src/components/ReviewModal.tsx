'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2, Send } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { submitPublicReview } from '@/lib/api';

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productPublicId?: string;
  productName?: string;
}

export function ReviewModal({
  isOpen,
  onClose,
  productPublicId,
  productName,
}: ReviewModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = () => {
    setIsSuccess(false);
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!customerName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    if (!reviewText.trim() || reviewText.trim().length < 10) {
      setErrorMessage('Please share a few words about your experience (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await submitPublicReview({
        customer_name: customerName.trim(),
        rating,
        review_text: reviewText.trim(),
        product_public_id: productPublicId || undefined,
      });

      setIsSuccess(true);
      setCustomerName('');
      setReviewText('');
      setRating(5);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to submit review right now. Please try again later.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={productName ? `Review ${productName}` : 'Share Your SKF Furniture Experience'}
      maxWidth="md"
    >
      {isSuccess ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-[var(--text-primary)]">Review Submitted!</h4>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
              Thank you for sharing your feedback. Your review will be displayed publicly following quality verification.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Rating Stars */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-primary)] block">
              Your Rating <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-bold text-slate-700 ml-2">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
              Your Name / Title <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. Vikramaditya S. (Architect)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-primary)] block">
              Your Review / Commission Story <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share details about the fabrication quality, stainless steel finish, delivery timelines, or durability..."
              required
              className="w-full p-3 rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default ReviewModal;
