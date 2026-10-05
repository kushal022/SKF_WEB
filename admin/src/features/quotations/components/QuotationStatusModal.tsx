import React, { useState } from 'react';
import { Modal, Button, Select, useToast } from '../../../components/ui';
import { QuotationStatusBadge } from './QuotationStatusBadge';
import { VALID_QUOTATION_TRANSITIONS, QUOTATION_STATUS_CONFIG } from '../constants';
import { useUpdateQuotationStatusMutation } from '../../../app/store/api';
import type { QuotationStatus } from '../../../types/quotation';

interface QuotationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationPublicId: string;
  quotationNumber: string;
  currentStatus: QuotationStatus;
}

export function QuotationStatusModal({
  isOpen,
  onClose,
  quotationPublicId,
  quotationNumber,
  currentStatus,
}: QuotationStatusModalProps) {
  const { showToast } = useToast();
  const [updateStatus, { isLoading }] = useUpdateQuotationStatusMutation();

  const allowedTransitions = VALID_QUOTATION_TRANSITIONS[currentStatus] || [];

  const [selectedStatus, setSelectedStatus] = useState<string>(
    allowedTransitions[0] || ''
  );
  const [comment, setComment] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      setFormError('Please select a target status.');
      return;
    }

    try {
      setFormError(null);
      await updateStatus({
        publicId: quotationPublicId,
        data: {
          status: selectedStatus as QuotationStatus,
          comment: comment.trim() ? comment.trim() : null,
        },
      }).unwrap();

      showToast(
        'success',
        `Quotation ${quotationNumber} moved to ${QUOTATION_STATUS_CONFIG[selectedStatus as QuotationStatus]?.label || selectedStatus}.`,
        'Status Changed'
      );
      setComment('');
      onClose();
    } catch (err: any) {
      const serverMessage = err?.data?.message;
      setFormError(serverMessage || 'Failed to update quotation status.');
    }
  };

  const isTerminal = allowedTransitions.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) {
          setFormError(null);
          setComment('');
          onClose();
        }
      }}
      title="Change Quotation Status"
      description={`Update status lifecycle for ${quotationNumber}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Status Row */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-border)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Current Status
          </span>
          <QuotationStatusBadge status={currentStatus} />
        </div>

        {isTerminal ? (
          <div className="p-4 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-border)] text-sm text-[var(--text-secondary)] text-center">
            This quotation is marked as <strong className="text-[var(--text-primary)]">Cancelled</strong> and cannot be transitioned further.
          </div>
        ) : (
          <>
            {/* New Status Selection */}
            <div>
              <label
                htmlFor="quotation-new-status-select"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
              >
                Change To Status
              </label>
              <Select
                id="quotation-new-status-select"
                value={selectedStatus || allowedTransitions[0]}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setFormError(null);
                }}
                options={allowedTransitions.map((status) => ({
                  value: status,
                  label: QUOTATION_STATUS_CONFIG[status]?.label || status,
                }))}
              />
            </div>

            {/* Transition Note / Comment */}
            <div>
              <label
                htmlFor="quotation-status-comment"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
              >
                Audit Comment / Note <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
              </label>
              <textarea
                id="quotation-status-comment"
                rows={3}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Reason for status change, customer feedback, client decision..."
                className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)] resize-none"
              />
              <p className="text-[11px] text-[var(--text-muted)] text-right mt-1">
                {comment.length} / 500 characters
              </p>
            </div>
          </>
        )}

        {/* Error message */}
        {formError && (
          <div className="p-3 rounded-lg bg-[var(--status-error)]/10 text-[var(--status-error)] text-xs font-medium border border-[var(--status-error)]/20">
            {formError}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-border)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          {!isTerminal && (
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
            >
              Update Status
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default QuotationStatusModal;
