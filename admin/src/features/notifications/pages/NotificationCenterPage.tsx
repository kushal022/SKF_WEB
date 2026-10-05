import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Inbox,
  FileText,
  Sparkles,
  Star,
  Package,
  CheckCheck,
  Trash2,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} from '../../../app/store/api';
import { Button, Badge, Skeleton, Card, useToast } from '../../../components/ui';

function formatFullDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

function getNotificationTypeDetails(type: string) {
  switch (type.toLowerCase()) {
    case 'enquiry':
      return {
        icon: <Inbox className="w-5 h-5 text-sky-500" />,
        badgeVariant: 'primary' as const,
        label: 'Enquiry',
        route: '/admin/enquiries',
        actionLabel: 'View Enquiries',
      };
    case 'quotation':
      return {
        icon: <FileText className="w-5 h-5 text-emerald-500" />,
        badgeVariant: 'success' as const,
        label: 'Quotation',
        route: '/admin/quotations',
        actionLabel: 'View Quotations',
      };
    case 'custom_request':
      return {
        icon: <Sparkles className="w-5 h-5 text-amber-500" />,
        badgeVariant: 'warning' as const,
        label: 'Custom Request',
        route: '/admin/custom-requests',
        actionLabel: 'View Custom Requests',
      };
    case 'review':
      return {
        icon: <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />,
        badgeVariant: 'warning' as const,
        label: 'Review',
        route: '/admin/reviews',
        actionLabel: 'Moderate Reviews',
      };
    case 'order':
      return {
        icon: <Package className="w-5 h-5 text-indigo-500" />,
        badgeVariant: 'outline' as const,
        label: 'Order',
        route: '/admin/orders',
        actionLabel: 'View Orders',
      };
    default:
      return {
        icon: <Bell className="w-5 h-5 text-slate-400" />,
        badgeVariant: 'default' as const,
        label: type.replace('_', ' '),
        route: null,
        actionLabel: null,
      };
  }
}

export function NotificationCenterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [filterRead, setFilterRead] = useState<'all' | 'unread'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const limit = 10;

  // Query params for backend
  const queryParams = {
    page,
    limit,
    sort_order: 'desc' as const,
    ...(filterRead === 'unread' ? { is_read: 'false' as const } : {}),
    ...(filterType !== 'all' ? { type: filterType } : {}),
  };

  const {
    data: notificationsData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetNotificationsQuery(queryParams);

  const { data: unreadTotal = 0 } = useGetUnreadNotificationCountQuery();

  const [markAsRead, { isLoading: isMarkingSingle }] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();

  const items = notificationsData?.data?.items || [];
  const pagination = notificationsData?.data?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  };

  const handleMarkAsRead = async (publicId: string) => {
    try {
      await markAsRead(publicId).unwrap();
      showToast('success', 'Notification marked as read.', 'Updated');
    } catch {
      showToast('error', 'Failed to mark notification as read.', 'Error');
    }
  };

  const handleMarkAll = async () => {
    try {
      const res = await markAllAsRead().unwrap();
      showToast('success', `Marked ${res.data?.updated_count ?? ''} notifications as read.`, 'Complete');
    } catch {
      showToast('error', 'Failed to mark all as read.', 'Error');
    }
  };

  const handleDelete = async (publicId: string) => {
    try {
      await deleteNotification(publicId).unwrap();
      showToast('info', 'Notification deleted successfully.', 'Deleted');
    } catch {
      showToast('error', 'Failed to delete notification.', 'Error');
    }
  };

  const availableTypes: { id: string; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'enquiry', label: 'Enquiries' },
    { id: 'quotation', label: 'Quotations' },
    { id: 'custom_request', label: 'Custom Requests' },
    { id: 'review', label: 'Reviews' },
    { id: 'order', label: 'Orders' },
    { id: 'system', label: 'System' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-border)]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Notification Center
            </h1>
            {unreadTotal > 0 && (
              <Badge variant="error" size="sm">
                {unreadTotal} Unread
              </Badge>
            )}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Review real-time operational notifications, enquiry alerts, and quotation responses across the SKF platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
            disabled={isFetching}
          >
            Refresh
          </Button>

          {unreadTotal > 0 && (
            <Button
              variant="accent"
              size="sm"
              onClick={handleMarkAll}
              isLoading={isMarkingAll}
              leftIcon={<CheckCheck className="w-4 h-4" />}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs">
        {/* Read / Unread Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--surface-muted)] rounded-lg">
          <button
            type="button"
            onClick={() => {
              setFilterRead('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filterRead === 'all'
                ? 'bg-[var(--surface-surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Activity
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterRead('unread');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterRead === 'unread'
                ? 'bg-[var(--surface-surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Unread Only</span>
            {unreadTotal > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 ml-1 hidden sm:block" />
          {availableTypes.map((typeObj) => (
            <button
              key={typeObj.id}
              type="button"
              onClick={() => {
                setFilterType(typeObj.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                filterType === typeObj.id
                  ? 'bg-[var(--brand-accent)] text-white border-[var(--brand-accent)]'
                  : 'bg-[var(--surface-surface)] text-[var(--text-secondary)] border-[var(--border-border)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              {typeObj.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List Body */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4 flex items-start gap-4">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-48 h-4 rounded-sm" />
                <Skeleton className="w-full max-w-xl h-3 rounded-sm" />
                <Skeleton className="w-24 h-3 rounded-sm" />
              </div>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
            Unable to Retrieve Notifications
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-4">
            A network error occurred while communicating with the notification service.
          </p>
          <Button variant="primary" size="sm" onClick={() => refetch()}>
            Retry Request
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
            {filterRead === 'unread' ? 'All Caught Up!' : 'No Notifications Found'}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-4">
            {filterRead === 'unread'
              ? 'You have marked all notifications as read. Switch filter to "All Activity" to view past events.'
              : 'There are currently no operational notifications matching your selected criteria.'}
          </p>
          {filterRead === 'unread' && (
            <Button variant="outline" size="sm" onClick={() => setFilterRead('all')}>
              Show All Activity
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((notification) => {
            const details = getNotificationTypeDetails(notification.type);

            return (
              <div
                key={notification.public_id}
                className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                  !notification.is_read
                    ? 'bg-sky-500/5 border-sky-500/30 shadow-xs'
                    : 'bg-[var(--surface-surface)] border-[var(--border-border)] hover:border-slate-700'
                }`}
              >
                {/* Left section: Icon + Message */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-border)] shrink-0 mt-0.5">
                    {details.icon}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                        {details.label}
                      </span>
                      {!notification.is_read && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-white shadow-xs">
                          New
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatFullDateTime(notification.created_at)}
                      </span>
                    </div>

                    <h3
                      className={`text-sm sm:text-base font-semibold leading-snug ${
                        !notification.is_read ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {notification.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                      {notification.message}
                    </p>

                    {/* Metadata summary if present */}
                    {notification.data && Object.keys(notification.data).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[var(--border-border)]/60 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)] font-mono">
                        {Object.entries(notification.data).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-2 py-0.5 rounded bg-[var(--surface-muted)]"
                          >
                            {key}: <span className="text-[var(--text-secondary)]">{String(value)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right section: Action controls */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-border)] w-full sm:w-auto justify-end">
                  {details.route && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(details.route!)}
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      {details.actionLabel || 'Inspect'}
                    </Button>
                  )}

                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.public_id)}
                      disabled={isMarkingSingle}
                      leftIcon={<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                      className="text-xs text-[var(--text-secondary)] hover:text-emerald-500"
                      title="Mark as read"
                    >
                      Mark Read
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(notification.public_id)}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.total_pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border-border)] text-xs text-[var(--text-secondary)]">
          <div>
            Showing <span className="font-semibold text-[var(--text-primary)]">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {Math.min(page * limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold text-[var(--text-primary)]">{pagination.total}</span> notifications
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <span className="px-2 font-medium">
              Page {page} of {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages || isFetching}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenterPage;
