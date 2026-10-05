import React, { useState } from 'react';
import { Modal, Button, Select, useToast } from '../../../components/ui';
import { EnquiryStatusBadge } from './EnquiryStatusBadge';
import { VALID_ENQUIRY_TRANSITIONS, ENQUIRY_STATUS_CONFIG } from '../constants';
import { useUpdateEnquiryStatusMutation } from '../../../app/store/api';
import type { EnquiryStatus } from '../../../types/enquiry';

interface EnquiryStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiryPublicId: string;
  currentStatus: EnquiryStatus;
}

export function EnquiryStatusModal({
  isOpen,
  onClose,
  enquiryPublicId,
  currentStatus,
}: EnquiryStatusModalProps) {
  const { showToast } = useToast();
  const [updateStatus, { isLoading }] = useUpdateEnquiryStatusMutation();

  const allowedTransitions = VALID_ENQUIRY_TRANSITIONS[currentStatus] || [];

  const [selectedStatus, setSelectedStatus] = useState<string>(
    allowedTransitions[0] || ''
  );
  const [comment, setComment] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenStatusChange = (val: string) => {
    setSelectedStatus(val);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      setFormError('Please select a target status.');
      return;
    }

    try {
      setFormError(null);
      await updateStatus({
        publicId: enquiryPublicId,
        data: {
          status: selectedStatus as EnquiryStatus,
          comment: comment.trim() ? comment.trim() : null,
        },
      }).unwrap();

      showToast(
        'success',
        `Status updated to ${ENQUIRY_STATUS_CONFIG[selectedStatus as EnquiryStatus]?.label || selectedStatus}.`,
        'Status Changed'
      );
      setComment('');
      onClose();
    } catch (err: any) {
      const serverMessage = err?.data?.message;
      const errorCode = err?.data?.code;

      if (errorCode === 'ENQUIRY_STATUS_TRANSITION_INVALID') {
        setFormError('This enquiry cannot be transitioned to the selected status.');
      } else if (serverMessage) {
        setFormError(serverMessage);
      } else {
        setFormError('Failed to update enquiry status. Please try again.');
      }
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
      title="Change Enquiry Status"
      description="Update customer sales pipeline state and log audit trail."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Status Row */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-border)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Current Status
          </span>
          <EnquiryStatusBadge status={currentStatus} />
        </div>

        {isTerminal ? (
          <div className="p-4 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-border)] text-sm text-[var(--text-secondary)] text-center">
            This enquiry is marked as <strong className="text-[var(--text-primary)]">Completed</strong> and cannot be transitioned further in the CRM pipeline.
          </div>
        ) : (
          <>
            {/* New Status Selection */}
            <div>
              <label
                htmlFor="new-status-select"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
              >
                Change To Status
              </label>
              <Select
                id="new-status-select"
                value={selectedStatus || allowedTransitions[0]}
                onChange={(e) => handleOpenStatusChange(e.target.value)}
                options={allowedTransitions.map((status) => ({
                  value: status,
                  label: ENQUIRY_STATUS_CONFIG[status]?.label || status,
                }))}
              />
            </div>

            {/* Transition Note / Comment */}
            <div>
              <label
                htmlFor="status-comment"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
              >
                Audit Comment / Note <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
              </label>
              <textarea
                id="status-comment"
                rows={3}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Reason for status change or update notes..."
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

export default EnquiryStatusModal;
