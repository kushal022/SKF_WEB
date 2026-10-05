import { Badge } from '../../../components/ui/Badge';
import type { QuotationStatus } from '../../../types/quotation';
import { QUOTATION_STATUS_CONFIG } from '../constants';

interface QuotationStatusBadgeProps {
  status: QuotationStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export function QuotationStatusBadge({
  status,
  size = 'md',
  className = '',
}: QuotationStatusBadgeProps) {
  const config = QUOTATION_STATUS_CONFIG[status as QuotationStatus] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    variant: 'default' as const,
  };

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}

export default QuotationStatusBadge;
