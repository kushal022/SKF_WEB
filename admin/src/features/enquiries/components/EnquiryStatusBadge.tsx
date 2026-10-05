import { Badge } from '../../../components/ui/Badge';
import type { EnquiryStatus } from '../../../types/enquiry';
import { ENQUIRY_STATUS_CONFIG } from '../constants';

interface EnquiryStatusBadgeProps {
  status: EnquiryStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export function EnquiryStatusBadge({
  status,
  size = 'md',
  className = '',
}: EnquiryStatusBadgeProps) {
  const config = ENQUIRY_STATUS_CONFIG[status as EnquiryStatus] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    variant: 'default' as const,
  };

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}

export default EnquiryStatusBadge;
