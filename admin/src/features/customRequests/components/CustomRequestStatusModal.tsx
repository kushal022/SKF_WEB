import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui';
import { useUpdateCustomRequestStatusMutation } from '../../../app/store/api';
import type { CustomRequestStatus } from '../../../types/customRequest';
import {
  VALID_CUSTOM_REQUEST_TRANSITIONS,
  CUSTOM_REQUEST_STATUS_CONFIG,
} from '../constants';
import { CustomRequestStatusBadge } from './CustomRequestStatusBadge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface CustomRequestStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicId: string;
  currentStatus: CustomRequestStatus;
  customerName: string;
}

export function CustomRequestStatusModal({
  isOpen,
  onClose,
  publicId,
  currentStatus,
  customerName,
}: CustomRequestStatusModalProps) {
  const { showToast } = useToast();
  const [updateStatus, { isLoading }] = useUpdateCustomRequestStatusMutation();

  const allowedTransitions = VALID_CUSTOM_REQUEST_TRANSITIONS[currentStatus] || [];
  const [selectedStatus, setSelectedStatus] = useState<CustomRequestStatus | ''>(
    allowedTransitions.length > 0 ? allowedTransitions[0] : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      showToast('error', 'Please select a valid destination status.');
      return;
    }

    try {
      await updateStatus({
        publicId,
        data: { status: selectedStatus },
      }).unwrap();

      showToast(
        'success',
        `Request status transitioned to ${CUSTOM_REQUEST_STATUS_CONFIG[selectedStatus].label}.`,
        'Status Updated'
      );
      onClose();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to update request status.';
      showToast('error', msg, 'Transition Error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Custom Request Status"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-4 rounded-lg bg-[var(--background-secondary)] border border-[var(--border-border)] space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Customer:</span>
            <span className="font-medium text-[var(--text-primary)]">{customerName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Current Status:</span>
            <CustomRequestStatusBadge status={currentStatus} />
          </div>
        </div>

        {allowedTransitions.length === 0 ? (
          <div className="p-4 rounded-lg bg-[var(--background-secondary)] border border-[var(--border-border)] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Terminal Lifecycle State
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Custom requests in status &quot;{CUSTOM_REQUEST_STATUS_CONFIG[currentStatus]?.label || currentStatus}&quot;
                have completed their workflow and cannot be transitioned to another state.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Select Target Status
            </label>
            <div className="space-y-2">
              {allowedTransitions.map((target) => {
                const config = CUSTOM_REQUEST_STATUS_CONFIG[target];
                const isSelected = selectedStatus === target;
                return (
                  <label
                    key={target}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/10'
                        : 'border-[var(--border-border)] bg-[var(--background-primary)] hover:border-[var(--text-tertiary)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={target}
                      checked={isSelected}
                      onChange={() => setSelectedStatus(target)}
                      className="mt-1 text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {config.label}
                        </span>
                        <CustomRequestStatusBadge status={target} size="sm" />
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {config.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {allowedTransitions.length > 0 && (
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!selectedStatus}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm Status Change
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default CustomRequestStatusModal;
