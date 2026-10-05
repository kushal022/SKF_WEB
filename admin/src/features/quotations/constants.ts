import type { QuotationStatus } from '../../types/quotation';

export const QUOTATION_STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  expired: { label: 'Expired', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'default' },
};

export const VALID_QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['accepted', 'rejected', 'expired', 'cancelled'],
  accepted: ['cancelled'],
  rejected: ['draft'],
  expired: ['draft', 'cancelled'],
  cancelled: [],
};
