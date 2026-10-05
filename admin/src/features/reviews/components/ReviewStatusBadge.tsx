import { Badge } from '../../../components/ui/Badge';
import type { ReviewStatus } from '../../../types/review';
import { REVIEW_STATUS_CONFIG } from '../constants';

interface ReviewStatusBadgeProps {
  status: ReviewStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function ReviewStatusBadge({
  status,
  size = 'md',
  className = '',
}: ReviewStatusBadgeProps) {
  const meta = REVIEW_STATUS_CONFIG[status] || {
    label: status,
    variant: 'default',
    description: '',
  };

  return (
    <Badge
      variant={meta.variant}
      size={size}
      className={className}
      title={meta.description}
    >
      {meta.label}
    </Badge>
  );
}

export default ReviewStatusBadge;
