import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { AlertCircle, Trash2 } from 'lucide-react';

interface ReviewDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customerName: string;
  isLoading: boolean;
}

export function ReviewDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  isLoading,
}: ReviewDeleteDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Customer Review"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-[var(--color-error-500)]/10 border border-[var(--color-error-500)]/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--color-error-500)] flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-semibold text-[var(--text-primary)]">
              Permanently Delete Review?
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Are you sure you want to delete the review submitted by{' '}
              <span className="font-semibold text-[var(--text-primary)]">&quot;{customerName}&quot;</span>?
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Review
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ReviewDeleteDialog;
