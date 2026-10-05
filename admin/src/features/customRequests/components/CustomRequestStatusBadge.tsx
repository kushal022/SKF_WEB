import { Badge } from '../../../components/ui/Badge';
import type { CustomRequestStatus } from '../../../types/customRequest';
import { CUSTOM_REQUEST_STATUS_CONFIG } from '../constants';

interface CustomRequestStatusBadgeProps {
  status: CustomRequestStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function CustomRequestStatusBadge({
  status,
  size = 'md',
  className = '',
}: CustomRequestStatusBadgeProps) {
  const meta = CUSTOM_REQUEST_STATUS_CONFIG[status] || {
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

export default CustomRequestStatusBadge;
