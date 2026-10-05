import type { CustomRequestStatus } from '../../types/customRequest';
import type { BadgeProps } from '../../components/ui/Badge';

export type BadgeVariant = NonNullable<BadgeProps['variant']>;

export const VALID_CUSTOM_REQUEST_TRANSITIONS: Record<CustomRequestStatus, CustomRequestStatus[]> = {
  new: ['reviewing', 'rejected'],
  reviewing: ['quoted', 'rejected'],
  quoted: ['approved', 'rejected'],
  approved: ['completed'],
  rejected: ['reviewing', 'new'],
  completed: [],
};

export interface StatusMeta {
  label: string;
  variant: BadgeVariant;
  description: string;
  stepIndex: number;
}

export const CUSTOM_REQUEST_STATUS_CONFIG: Record<CustomRequestStatus, StatusMeta> = {
  new: {
    label: 'New Request',
    variant: 'info',
    description: 'Submitted by customer, pending initial review.',
    stepIndex: 1,
  },
  reviewing: {
    label: 'Under Review',
    variant: 'warning',
    description: 'Engineering and design team assessing feasibility & specifications.',
    stepIndex: 2,
  },
  quoted: {
    label: 'Quoted',
    variant: 'secondary',
    description: 'Commercial quotation prepared and delivered to customer.',
    stepIndex: 3,
  },
  approved: {
    label: 'Approved',
    variant: 'success',
    description: 'Customer approved specifications and formal commercial proposal.',
    stepIndex: 4,
  },
  completed: {
    label: 'Completed',
    variant: 'default',
    description: 'Fabrication finished and delivered to customer.',
    stepIndex: 5,
  },
  rejected: {
    label: 'Rejected',
    variant: 'error',
    description: 'Request was declined or cancelled.',
    stepIndex: -1,
  },
};

export const CUSTOM_REQUEST_SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest First (Default)' },
  { value: 'created_at', label: 'Oldest First' },
  { value: '-updated_at', label: 'Recently Updated' },
  { value: 'customer_name', label: 'Customer Name (A-Z)' },
  { value: '-customer_name', label: 'Customer Name (Z-A)' },
  { value: 'quantity', label: 'Quantity (Ascending)' },
  { value: '-quantity', label: 'Quantity (Descending)' },
  { value: 'status', label: 'Status' },
];
