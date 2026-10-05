import type { GalleryStatus } from '../../types/gallery';
import type { BadgeProps } from '../../components/ui/Badge';

export type BadgeVariant = NonNullable<BadgeProps['variant']>;

export interface GalleryStatusMeta {
  label: string;
  variant: BadgeVariant;
  description: string;
}

export const GALLERY_STATUS_CONFIG: Record<GalleryStatus, GalleryStatusMeta> = {
  draft: {
    label: 'Draft',
    variant: 'secondary',
    description: 'Saved as draft, not visible on public project showcase.',
  },
  published: {
    label: 'Published',
    variant: 'success',
    description: 'Publicly visible in client gallery and project portfolio.',
  },
  archived: {
    label: 'Archived',
    variant: 'error',
    description: 'Archived project showcase, preserved for administrative reference.',
  },
};

export const GALLERY_CATEGORY_OPTIONS = [
  { value: 'residential', label: 'Residential Projects' },
  { value: 'commercial', label: 'Commercial & Hospitality' },
  { value: 'living_room', label: 'Living Room Furniture' },
  { value: 'bedroom', label: 'Bedroom Furniture' },
  { value: 'dining', label: 'Dining Sets & Tables' },
  { value: 'custom', label: 'Custom Architectural Metalwork' },
  { value: 'kitchen', label: 'Kitchen & Modular Countertops' },
  { value: 'outdoor', label: 'Outdoor & Patio Furniture' },
];

export const GALLERY_SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest First (Default)' },
  { value: 'created_at', label: 'Oldest First' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: '-title', label: 'Title (Z-A)' },
  { value: 'status', label: 'Status' },
];

/**
 * Converts a text title into a URL-friendly slug matching backend regex /^[a-z0-9]+(?:-[a-z0-9]+)*$/
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 220);
}
