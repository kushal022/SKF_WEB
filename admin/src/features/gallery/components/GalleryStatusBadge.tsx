import { Badge } from '../../../components/ui/Badge';
import type { GalleryStatus } from '../../../types/gallery';
import { GALLERY_STATUS_CONFIG } from '../constants';

interface GalleryStatusBadgeProps {
  status: GalleryStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function GalleryStatusBadge({
  status,
  size = 'md',
  className = '',
}: GalleryStatusBadgeProps) {
  const meta = GALLERY_STATUS_CONFIG[status] || {
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

export default GalleryStatusBadge;
