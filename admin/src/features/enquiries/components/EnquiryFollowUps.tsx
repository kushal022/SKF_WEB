import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, useToast } from '../../../components/ui';
import { formatDateTime } from '../../../utils/date';
import {
  useCreateEnquiryFollowUpMutation,
  useUpdateEnquiryFollowUpMutation,
  useDeleteEnquiryFollowUpMutation,
} from '../../../app/store/api';
import type { EnquiryFollowUp, FollowUpStatus } from '../../../types/enquiry';

function getCompletionTimestamp(status: FollowUpStatus): string | null {
  return status === 'completed' ? new Date().toISOString() : null;
}

interface EnquiryFollowUpsProps {
  enquiryPublicId: string;
  followUps?: EnquiryFollowUp[];
}

export function EnquiryFollowUps({
  enquiryPublicId,
  followUps = [],
}: EnquiryFollowUpsProps) {
  const { showToast } = useToast();
  const [isScheduling, setIsScheduling] = useState(false);
  const [followUpAt, setFollowUpAt] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [createFollowUp, { isLoading: isCreating }] = useCreateEnquiryFollowUpMutation();
  const [updateFollowUp, { isLoading: isUpdating }] = useUpdateEnquiryFollowUpMutation();
  const [deleteFollowUp, { isLoading: isDeleting }] = useDeleteEnquiryFollowUpMutation();

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpAt) {
      setFormError('Please select a date and time for the follow-up.');
      return;
    }

    const parsedDate = new Date(followUpAt);
    if (isNaN(parsedDate.getTime())) {
      setFormError('Invalid date/time specified.');
      return;
    }

    try {
      setFormError(null);
      await createFollowUp({
        publicId: enquiryPublicId,
        data: {
          follow_up_at: parsedDate.toISOString(),
          note: note.trim() ? note.trim() : null,
          status: 'pending',
        },
      }).unwrap();

      showToast('success', 'Follow-up scheduled successfully.', 'Follow-Up Created');
      setFollowUpAt('');
      setNote('');
      setIsScheduling(false);
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to schedule follow-up.');
    }
  };

  const handleStatusChange = async (followUp: EnquiryFollowUp, newStatus: FollowUpStatus) => {
    try {
      const completedAt = getCompletionTimestamp(newStatus);
      await updateFollowUp({
        publicId: enquiryPublicId,
        followUpPublicId: followUp.public_id,
        data: {
          status: newStatus,
          completed_at: completedAt,
        },
      }).unwrap();

      showToast(
        'success',
        `Follow-up marked as ${newStatus}.`,
        'Follow-up Updated'
      );
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to update follow-up.', 'Error');
    }
  };

  const handleDelete = async (followUpPublicId: string) => {
    if (!window.confirm('Delete this scheduled follow-up reminder?')) {
      return;
    }

    try {
      await deleteFollowUp({
        publicId: enquiryPublicId,
        followUpPublicId,
      }).unwrap();
      showToast('info', 'Follow-up reminder deleted.', 'Removed');
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to delete follow-up.', 'Error');
    }
  };

  const getStatusBadge = (status: FollowUpStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" size="sm">Cancelled</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning" size="sm">Pending</Badge>;
    }
  };

  return (
    <Card className="shadow-xs border border-[var(--border-border)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--brand-accent)]" />
          <CardTitle className="text-base font-semibold">Follow-ups</CardTitle>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] font-medium">
            {followUps.length}
          </span>
        </div>

        {!isScheduling && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsScheduling(true);
              setFormError(null);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Schedule
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Schedule Form */}
        {isScheduling && (
          <form
            onSubmit={handleScheduleSubmit}
            className="p-4 rounded-xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/5 space-y-3 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                Schedule Follow-up
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Calendar CRM Reminder
              </span>
            </div>

            <div>
              <label
                htmlFor="follow-up-date"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1"
              >
                Date & Time
              </label>
              <input
                id="follow-up-date"
                type="datetime-local"
                value={followUpAt}
                onChange={(e) => setFollowUpAt(e.target.value)}
                className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)]"
                required
              />
            </div>

            <div>
              <label
                htmlFor="follow-up-note"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1"
              >
                Reminder Note <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
              </label>
              <textarea
                id="follow-up-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Call customer back regarding quotation review or factory visit..."
                className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] p-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)] resize-none"
              />
            </div>

            {formError && (
              <p className="text-xs text-[var(--status-error)] font-medium">{formError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsScheduling(false);
                  setFollowUpAt('');
                  setNote('');
                  setFormError(null);
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isCreating}
              >
                Schedule Follow-up
              </Button>
            </div>
          </form>
        )}

        {/* Follow-up Reminders List */}
        {followUps.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-lg bg-[var(--surface-muted)]/50 border border-dashed border-[var(--border-border)]">
            <p className="text-xs text-[var(--text-muted)]">
              No follow-ups scheduled for this enquiry. Schedule a reminder to follow up on proposals, catalog samples, or measurements.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {followUps.map((item) => (
              <div
                key={item.public_id}
                className="p-3.5 rounded-lg border border-[var(--border-border)] bg-[var(--surface-muted)]/40 hover:bg-[var(--surface-muted)] transition-colors group"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {formatDateTime(item.follow_up_at)}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="flex items-center gap-1">
                    {item.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item, 'completed')}
                          disabled={isUpdating}
                          className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          title="Mark Completed"
                          aria-label="Mark Completed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item, 'cancelled')}
                          disabled={isUpdating}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-500/10 transition-colors"
                          title="Mark Cancelled"
                          aria-label="Mark Cancelled"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(item.public_id)}
                      disabled={isDeleting}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--status-error)] opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Reminder"
                      aria-label="Delete Reminder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.note && (
                  <p className="text-xs text-[var(--text-secondary)] pl-6 leading-relaxed">
                    {item.note}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mt-2 pt-2 border-t border-[var(--border-border)]/60 pl-6">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    {item.assigned_to?.name || 'Assigned to Sales Team'}
                  </span>
                  {item.completed_at && (
                    <span>Completed {formatDateTime(item.completed_at)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnquiryFollowUps;
