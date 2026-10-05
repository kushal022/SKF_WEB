import { Modal, Button } from '../../../components/ui';
import { AlertTriangle } from 'lucide-react';
import type { CategoryItem } from '../../../types/catalog';

interface CategoryDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  category: CategoryItem | null;
  isLoading: boolean;
  errorMessage?: string | null;
}

export function CategoryDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  category,
  isLoading,
  errorMessage,
}: CategoryDeleteDialogProps) {
  if (!category) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Category"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-[var(--status-error)]/10 border border-[var(--status-error)]/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-[var(--status-error)] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-[var(--status-error)]">
              Are you sure you want to delete this category?
            </p>
            <p className="text-[var(--text-secondary)] mt-1">
              You are about to delete <span className="font-semibold text-[var(--text-primary)]">"{category.name}"</span> (slug: <code className="text-xs bg-[var(--surface-muted)] px-1 py-0.5 rounded">{category.slug}</code>).
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Note: If any products are assigned to this category, the deletion will be blocked to protect catalog integrity.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-medium">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white border-red-700"
          >
            {isLoading ? 'Deleting...' : 'Delete Category'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CategoryDeleteDialog;
