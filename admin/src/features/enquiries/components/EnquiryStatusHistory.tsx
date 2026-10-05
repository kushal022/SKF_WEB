import { History, ArrowRight, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui';
import { EnquiryStatusBadge } from './EnquiryStatusBadge';
import { formatDateTime } from '../../../utils/date';
import type { EnquiryStatusLog } from '../../../types/enquiry';

interface EnquiryStatusHistoryProps {
  statusLogs?: EnquiryStatusLog[];
}

export function EnquiryStatusHistory({ statusLogs = [] }: EnquiryStatusHistoryProps) {
  return (
    <Card className="shadow-xs border border-[var(--border-border)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[var(--brand-accent)]" />
          <CardTitle className="text-base font-semibold">Status History</CardTitle>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] font-medium">
            {statusLogs.length}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {statusLogs.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-lg bg-[var(--surface-muted)]/50 border border-dashed border-[var(--border-border)]">
            <p className="text-xs text-[var(--text-muted)]">
              No status transitions recorded yet. Changes in enquiry status will be logged chronologically here.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border-border)]">
            {statusLogs.map((log) => (
              <div key={log.public_id} className="relative group">
                {/* Timeline Node Bullet */}
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[var(--brand-accent)] border-2 border-[var(--surface-surface)] ring-2 ring-[var(--surface-muted)]" />

                <div className="p-3 rounded-lg border border-[var(--border-border)] bg-[var(--surface-muted)]/40 hover:bg-[var(--surface-muted)] transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <EnquiryStatusBadge status={log.from_status} size="sm" />
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <EnquiryStatusBadge status={log.to_status} size="sm" />
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>

                  {log.comment && (
                    <p className="text-xs text-[var(--text-secondary)] bg-[var(--surface-surface)] p-2.5 rounded border border-[var(--border-border)]/60 italic leading-relaxed">
                      "{log.comment}"
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <User className="w-3 h-3" />
                    <span>Updated by {log.changed_by?.name || 'Administrator'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnquiryStatusHistory;
