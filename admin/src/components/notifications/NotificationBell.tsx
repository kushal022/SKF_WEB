import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Inbox,
  FileText,
  Sparkles,
  Star,
  Package,
  CheckCircle,
  ExternalLink,
  CheckCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  type NotificationItem,
} from '../../app/store/api';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

function getNotificationIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'enquiry':
      return <Inbox className="w-4 h-4 text-sky-500" />;
    case 'quotation':
      return <FileText className="w-4 h-4 text-emerald-500" />;
    case 'custom_request':
      return <Sparkles className="w-4 h-4 text-amber-500" />;
    case 'review':
      return <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
    case 'order':
      return <Package className="w-4 h-4 text-indigo-500" />;
    default:
      return <Bell className="w-4 h-4 text-slate-400" />;
  }
}

function getDestinationRoute(notification: NotificationItem): string | null {
  const type = notification.type.toLowerCase();
  const entityType = notification.related_entity_type?.toLowerCase();

  if (type === 'enquiry' || entityType === 'enquiry') {
    return '/admin/enquiries';
  }
  if (type === 'quotation' || entityType === 'quotation') {
    return '/admin/quotations';
  }
  if (type === 'custom_request' || entityType === 'customrequest' || entityType === 'custom_request') {
    return '/admin/custom-requests';
  }
  if (type === 'review' || entityType === 'review') {
    return '/admin/reviews';
  }
  return null;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Queries & Mutations
  const { data: unreadCount = 0, isLoading: countLoading } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 30000,
  });

  const {
    data: notificationsData,
    isLoading: listLoading,
    isError,
    refetch,
  } = useGetNotificationsQuery(
    { limit: 6, sort_order: 'desc' },
    { skip: !isOpen }
  );

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();

  const rawNotifications = notificationsData?.data?.items || [];
  // Strict deduplication by public_id prevents duplicate items from socket updates + refetches
  const notifications = Array.from(
    new Map(rawNotifications.map((item) => [item.public_id, item])).values()
  );

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.public_id).unwrap();
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    const destination = getDestinationRoute(notification);
    setIsOpen(false);
    if (destination) {
      navigate(destination);
    } else {
      navigate('/admin/notifications');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-accent)]"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />

        {/* Unread Badge */}
        {!countLoading && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-[var(--surface-surface)] shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--surface-surface)] border border-[var(--border-border)] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-[var(--surface-muted)]/60 border-b border-[var(--border-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-xs text-[var(--brand-accent)] hover:text-[var(--brand-accent-hover)] font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                title="Mark all as read"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[var(--border-border)]">
            {listLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-[var(--text-muted)] gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-accent)]" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : isError ? (
              <div className="py-6 px-4 text-center">
                <AlertCircle className="w-6 h-6 text-[var(--status-error)] mx-auto mb-2" />
                <p className="text-xs text-[var(--text-secondary)] mb-2">Failed to load notifications</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="text-xs text-[var(--brand-accent)] hover:underline font-medium"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-muted)] flex items-center justify-center mx-auto mb-2 text-[var(--text-muted)]">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-xs font-medium text-[var(--text-primary)]">All caught up!</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">No recent notifications</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.public_id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-[var(--surface-muted)]/70 transition-colors cursor-pointer group ${
                    !item.is_read ? 'bg-sky-500/5' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className="mt-0.5 p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-border)] shrink-0 group-hover:border-[var(--brand-accent)]/40 transition-colors">
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          !item.is_read
                            ? 'font-semibold text-[var(--text-primary)]'
                            : 'font-medium text-[var(--text-secondary)]'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span
                          className="w-2 h-2 rounded-full bg-[var(--brand-accent)] shrink-0"
                          title="Unread"
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-[var(--text-muted)]">
                      <span>{formatRelativeTime(item.created_at)}</span>
                      <span className="capitalize px-1.5 py-0.2 rounded bg-[var(--surface-muted)] font-mono">
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[var(--surface-muted)]/40 border-t border-[var(--border-border)] text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/admin/notifications');
              }}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-[var(--brand-accent)] hover:text-white hover:bg-[var(--brand-accent)] flex items-center justify-center gap-1.5 transition-all"
            >
              <span>View all notifications</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
