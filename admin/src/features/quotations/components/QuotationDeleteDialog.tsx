import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from '../../../components/ui';

interface QuotationDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quotationNumber: string;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  errorMessage?: string | null;
}

export function QuotationDeleteDialog({
  isOpen,
  onClose,
  quotationNumber,
  onConfirm,
  isLoading,
  errorMessage,
}: QuotationDeleteDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      title="Delete Quotation"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-sm">Are you sure you want to delete this quotation?</p>
            <p className="text-[var(--text-secondary)]">
              This will permanently remove quotation <strong className="text-[var(--text-primary)]">{quotationNumber}</strong> and all its associated line items and status history.
            </p>
            <p className="text-amber-600 font-medium pt-1">
              Note: Only draft quotations can be deleted. This action cannot be undone.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-[var(--status-error)]/10 text-[var(--status-error)] text-xs font-medium border border-[var(--status-error)]/20">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-border)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Delete Quotation
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default QuotationDeleteDialog;
