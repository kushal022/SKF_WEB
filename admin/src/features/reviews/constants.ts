import type { ReviewStatus } from '../../types/review';
import type { BadgeProps } from '../../components/ui/Badge';

export type BadgeVariant = NonNullable<BadgeProps['variant']>;

export interface ReviewStatusMeta {
  label: string;
  variant: BadgeVariant;
  description: string;
}

export const REVIEW_STATUS_CONFIG: Record<ReviewStatus, ReviewStatusMeta> = {
  pending: {
    label: 'Pending Moderation',
    variant: 'warning',
    description: 'Awaiting administrator review and approval.',
  },
  approved: {
    label: 'Approved & Live',
    variant: 'success',
    description: 'Approved by administrator and publicly visible on website.',
  },
  rejected: {
    label: 'Rejected',
    variant: 'error',
    description: 'Declined during moderation and hidden from public display.',
  },
};

export const REVIEW_SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest First (Default)' },
  { value: 'created_at', label: 'Oldest First' },
  { value: '-rating', label: 'Highest Rating (5 to 1)' },
  { value: 'rating', label: 'Lowest Rating (1 to 5)' },
  { value: 'status', label: 'Status' },
];

export const RATING_FILTER_OPTIONS = [
  { value: '', label: 'All Ratings' },
  { value: '5', label: '5 Stars ★★★★★' },
  { value: '4', label: '4 Stars ★★★★☆' },
  { value: '3', label: '3 Stars ★★★☆☆' },
  { value: '2', label: '2 Stars ★★☆☆☆' },
  { value: '1', label: '1 Star  ★☆☆☆☆' },
];
