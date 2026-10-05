import type { EnquiryStatus, FollowUpStatus } from '../../types/enquiry';

export const ENQUIRY_STATUS_CONFIG: Record<
  EnquiryStatus,
  { label: string; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default' }
> = {
  new: { label: 'New', variant: 'primary' },
  contacted: { label: 'Contacted', variant: 'info' },
  quotation_sent: { label: 'Quotation Sent', variant: 'warning' },
  negotiation: { label: 'Negotiation', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  completed: { label: 'Completed', variant: 'success' },
  lost: { label: 'Lost', variant: 'error' },
};

export const VALID_ENQUIRY_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  new: ['contacted', 'quotation_sent', 'lost'],
  contacted: ['quotation_sent', 'negotiation', 'confirmed', 'lost'],
  quotation_sent: ['negotiation', 'confirmed', 'lost'],
  negotiation: ['quotation_sent', 'confirmed', 'lost'],
  confirmed: ['completed', 'lost'],
  completed: [],
  lost: ['new', 'contacted'],
};

export const FOLLOW_UP_STATUS_CONFIG: Record<
  FollowUpStatus,
  { label: string; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
};
