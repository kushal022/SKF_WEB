import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Sliders,
  Trash2,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useGetQuotationsQuery,
  useDeleteQuotationMutation,
} from '../../../app/store/api';
import type {
  QuotationListItem,
  QuotationStatus,
  QuotationQueryParams,
} from '../../../types/quotation';
import {
  Button,
  Input,
  Select,
  Card,
  LoadingState,
  EmptyState,
  ErrorState,
  useToast,
} from '../../../components/ui';
import QuotationStatusBadge from '../components/QuotationStatusBadge';
import QuotationStatusModal from '../components/QuotationStatusModal';
import QuotationDeleteDialog from '../components/QuotationDeleteDialog';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';

export function QuotationListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Status Modal State
  const [statusModalQuotation, setStatusModalQuotation] = useState<QuotationListItem | null>(null);

  // Delete Dialog State
  const [deleteQuotationItem, setDeleteQuotationItem] = useState<QuotationListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // RTK Query
  const queryParams = useMemo(() => {
    const params: QuotationQueryParams = {
      page,
      limit,
      sort_by: sortField as any,
      sort_order: sortOrder,
    };

    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter as QuotationStatus;
    }

    return params;
  }, [searchTerm, statusFilter, sortField, sortOrder, page, limit]);

  const {
    data: quotationsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetQuotationsQuery(queryParams);

  const [deleteQuotationMutation, { isLoading: isDeleting }] = useDeleteQuotationMutation();

  const quotations: QuotationListItem[] = quotationsResponse?.data?.items || [];
  const pagination = quotationsResponse?.data?.pagination || {
    total: quotations.length,
    totalPages: Math.ceil(quotations.length / limit) || 1,
    page,
    limit,
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortField('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteQuotationItem) return;
    try {
      setDeleteError(null);
      await deleteQuotationMutation(deleteQuotationItem.public_id).unwrap();
      showToast('success', `Quotation ${deleteQuotationItem.quotation_number} deleted.`, 'Deleted');
      setDeleteQuotationItem(null);
    } catch (err: any) {
      setDeleteError(err?.data?.message || 'Failed to delete quotation.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Quotations
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-semibold">
              {pagination.total} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Manage commercial proposals, line items, pricing, and client proposals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/quotations/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Quotation
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 shadow-xs border border-[var(--border-border)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Search Box */}
          <div>
            <Input
              id="quotation-search"
              placeholder="Search by customer, quote #, phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Status Filter */}
          <Select
            id="quotation-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'expired', label: 'Expired' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />

          {/* Sort Selector */}
          <Select
            id="quotation-sort-filter"
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [f, o] = e.target.value.split('-');
              setSortField(f);
              setSortOrder(o as 'asc' | 'desc');
              setPage(1);
            }}
            options={[
              { value: 'created_at-desc', label: 'Newest First' },
              { value: 'created_at-asc', label: 'Oldest First' },
              { value: 'total_amount-desc', label: 'Amount: High to Low' },
              { value: 'total_amount-asc', label: 'Amount: Low to High' },
              { value: 'valid_until-asc', label: 'Expiry: Earliest First' },
            ]}
          />
        </div>
      </Card>

      {/* Content Area */}
      {isLoading ? (
        <Card className="p-12 border border-[var(--border-border)]">
          <LoadingState message="Loading commercial quotations..." />
        </Card>
      ) : isError ? (
        <Card className="p-8 border border-[var(--border-border)]">
          <ErrorState
            title="Unable to load quotations"
            message={(error as any)?.data?.message || 'Could not connect to quotation management service.'}
            retryText="Try Again"
            onRetry={() => refetch()}
          />
        </Card>
      ) : quotations.length === 0 ? (
        <Card className="p-12 border border-[var(--border-border)]">
          <EmptyState
            title="No quotations found"
            description="Create your first quotation to start managing customer proposals and commercial pricing."
            actionText={searchTerm || statusFilter !== 'all' ? 'Reset Filters' : 'Create Quotation'}
            onAction={searchTerm || statusFilter !== 'all' ? handleResetFilters : () => navigate('/admin/quotations/new')}
            icon={<FileText className="w-8 h-8" />}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)] shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Quotation #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total (INR)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-border)] text-[var(--text-primary)]">
                {quotations.map((q) => (
                  <tr
                    key={q.public_id}
                    className="hover:bg-[var(--surface-muted)]/50 transition-colors"
                  >
                    {/* Quotation Number */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/quotations/${q.public_id}`)}
                        className="font-mono font-bold text-xs text-[var(--brand-accent)] hover:underline"
                      >
                        {q.quotation_number}
                      </button>
                      {q.enquiry && (
                        <span className="text-[10px] text-[var(--text-muted)] block">
                          Enquiry #{q.enquiry.public_id.slice(0, 8)}
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-[var(--text-primary)] line-clamp-1">
                        {q.customer_name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {q.customer_phone}
                        </span>
                        {q.customer_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {q.customer_email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4 text-xs text-[var(--text-secondary)]">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {q.items?.length || 0}
                      </span>{' '}
                      item{q.items?.length === 1 ? '' : 's'}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 font-mono font-bold text-sm text-[var(--text-primary)]">
                      {formatCurrency(q.total_amount)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <QuotationStatusBadge status={q.status} size="sm" />
                    </td>

                    {/* Valid Until */}
                    <td className="py-3 px-4 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {q.valid_until ? formatDate(q.valid_until) : '—'}
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                      {formatDate(q.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/quotations/${q.public_id}`)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          className="text-xs"
                          title="View Details & Preview"
                        >
                          View
                        </Button>

                        <button
                          type="button"
                          onClick={() => setStatusModalQuotation(q)}
                          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors"
                          title="Change Status"
                          aria-label={`Change status for ${q.quotation_number}`}
                        >
                          <Sliders className="w-4 h-4" />
                        </button>

                        {q.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteQuotationItem(q);
                              setDeleteError(null);
                            }}
                            className="p-1.5 rounded-md text-[var(--status-error)] hover:bg-red-500/10 transition-colors"
                            title="Delete Draft"
                            aria-label={`Delete ${q.quotation_number}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)] shadow-xs">
            <div className="text-xs text-[var(--text-secondary)]">
              Showing{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {quotations.length > 0 ? (page - 1) * limit + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {Math.min(page * limit, pagination.total)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {pagination.total}
              </span>{' '}
              quotations
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-[var(--surface-surface)] border border-[var(--border-border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-medium px-2 text-[var(--text-primary)]">
                  {page} / {pagination.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="px-2"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {statusModalQuotation && (
        <QuotationStatusModal
          key={`${statusModalQuotation.public_id}-${statusModalQuotation.status}`}
          isOpen={Boolean(statusModalQuotation)}
          onClose={() => setStatusModalQuotation(null)}
          quotationPublicId={statusModalQuotation.public_id}
          quotationNumber={statusModalQuotation.quotation_number}
          currentStatus={statusModalQuotation.status}
        />
      )}

      {/* Delete Dialog */}
      {deleteQuotationItem && (
        <QuotationDeleteDialog
          isOpen={Boolean(deleteQuotationItem)}
          onClose={() => {
            setDeleteQuotationItem(null);
            setDeleteError(null);
          }}
          quotationNumber={deleteQuotationItem.quotation_number}
          onConfirm={handleDeleteConfirm}
          isLoading={isDeleting}
          errorMessage={deleteError}
        />
      )}
    </div>
  );
}

export default QuotationListPage;
