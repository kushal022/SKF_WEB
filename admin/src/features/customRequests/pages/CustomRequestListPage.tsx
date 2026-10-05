import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Eye,
  ArrowUpDown,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import {
  useGetCustomRequestsQuery,
} from '../../../app/store/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card, CardContent } from '../../../components/ui/Card';
import { LoadingState } from '../../../components/ui';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import type {
  CustomRequestStatus,
  CustomRequestListItem,
} from '../../../types/customRequest';
import {
  CUSTOM_REQUEST_STATUS_CONFIG,
  CUSTOM_REQUEST_SORT_OPTIONS,
} from '../constants';
import { CustomRequestStatusBadge } from '../components/CustomRequestStatusBadge';
import { CustomRequestStatusModal } from '../components/CustomRequestStatusModal';

export function CustomRequestListPage() {
  const navigate = useNavigate();

  // Query State
  const [page, setPage] = useState(1);
  const limit = 15;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomRequestStatus | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOption, setSortOption] = useState('-created_at');

  // Modal State
  const [statusModalTarget, setStatusModalTarget] = useState<CustomRequestListItem | null>(null);

  // Fetch paginated custom requests
  const queryParams = useMemo(() => {
    const params: any = {
      page,
      limit,
      sort: sortOption,
    };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (statusFilter) params.status = statusFilter;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    return params;
  }, [page, limit, sortOption, searchTerm, statusFilter, fromDate, toDate]);

  const { data: response, isLoading, isFetching, error } = useGetCustomRequestsQuery(queryParams);

  const items = response?.data?.items || [];
  const pagination = response?.data?.pagination || {
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  };

  // Status Metrics (from all requests / total metadata)
  const totalCount = pagination.total || 0;

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setSortOption('-created_at');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--color-primary-500)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Custom Furniture Requests
            </h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Review, estimate, and prepare formal commercial quotations for bespoke customer furniture requirements.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-[var(--border-border)]">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Total Requests</span>
            <div className="text-xl font-bold text-[var(--text-primary)] mt-1">
              {totalCount}
            </div>
          </CardContent>
        </Card>

        {(['new', 'reviewing', 'quoted', 'approved', 'completed'] as CustomRequestStatus[]).map(
          (status) => {
            const config = CUSTOM_REQUEST_STATUS_CONFIG[status];
            const isSelected = statusFilter === status;
            return (
              <Card
                key={status}
                className={`border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/10 shadow-sm'
                    : 'border-[var(--border-border)] hover:border-[var(--text-tertiary)]'
                }`}
                onClick={() => {
                  setStatusFilter(isSelected ? '' : status);
                  setPage(1);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
                      {config.label}
                    </span>
                    <CustomRequestStatusBadge status={status} size="sm" />
                  </div>
                  <div className="text-xl font-bold text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
                    {status === 'new' && <Clock className="w-4 h-4 text-sky-400" />}
                    {status === 'reviewing' && <Layers className="w-4 h-4 text-amber-400" />}
                    {status === 'quoted' && <FileText className="w-4 h-4 text-purple-400" />}
                    {status === 'approved' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    {status === 'completed' && <CheckCircle className="w-4 h-4 text-slate-400" />}
                    <span>{isSelected ? 'Active Filter' : 'Filter'}</span>
                  </div>
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="border-[var(--border-border)] shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by customer, phone, email, city, product..."
                className="pl-9 text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as CustomRequestStatus | '');
                  setPage(1);
                }}
                className="text-sm"
              >
                <option value="">All Statuses</option>
                <option value="new">New Request</option>
                <option value="reviewing">Under Review</option>
                <option value="quoted">Quoted</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>

            {/* Sort Filter */}
            <div>
              <Select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setPage(1);
                }}
                className="text-sm"
              >
                {CUSTOM_REQUEST_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Reset Filter Button */}
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="w-full text-xs"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Date Range Sub-row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border-border)] text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5" /> Date Range:
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="custom-from-date" className="sr-only">From Date</label>
              <Input
                id="custom-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="text-xs py-1 h-8 w-36"
              />
              <span>to</span>
              <label htmlFor="custom-to-date" className="sr-only">To Date</label>
              <Input
                id="custom-to-date"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="text-xs py-1 h-8 w-36"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-16">
          <LoadingState message="Loading custom furniture requests..." />
        </div>
      ) : error ? (
        <Card className="border-[var(--color-error-500)]/30 bg-[var(--color-error-500)]/10">
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[var(--color-error-500)] mx-auto" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Failed to load custom requests
            </h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
              An error occurred while connecting to the backend service.
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border-[var(--border-border)]">
          <CardContent className="p-12 text-center space-y-3">
            <Sparkles className="w-12 h-12 text-[var(--text-tertiary)] mx-auto opacity-60" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              No custom requests found
            </h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
              {searchTerm || statusFilter || fromDate || toDate
                ? 'No requests matched your filter parameters. Try adjusting your search keywords.'
                : 'Customer custom furniture requests will appear here once submitted from the website.'}
            </p>
            {(searchTerm || statusFilter || fromDate || toDate) && (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border border-[var(--border-border)] overflow-hidden bg-[var(--background-primary)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-border)] bg-[var(--background-secondary)] text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    <th className="py-3 px-4">Request / Customer</th>
                    <th className="py-3 px-4">Furniture Specification</th>
                    <th className="py-3 px-4">Dimensions & Material</th>
                    <th className="py-3 px-4">Estimated Amount</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-border)]">
                  {items.map((item) => {
                    const hasImages = item.images && item.images.length > 0;
                    return (
                      <tr
                        key={item.public_id}
                        className="hover:bg-[var(--background-secondary)]/50 transition-colors"
                      >
                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[var(--text-primary)]">
                            {item.customer_name}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {item.phone} {item.city ? `• ${item.city}` : ''}
                          </div>
                          <div className="text-[11px] font-mono text-[var(--text-tertiary)] mt-0.5">
                            ID: {item.public_id.slice(0, 8)}
                          </div>
                        </td>

                        {/* Product Type & Qty */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[var(--text-primary)] capitalize">
                            {item.product_type.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5">
                            <span>Qty: {item.quantity}</span>
                            {hasImages && (
                              <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-[var(--background-secondary)] text-[var(--text-secondary)]">
                                <ImageIcon className="w-3 h-3 text-[var(--color-primary-500)]" />
                                {item.images.length} {item.images.length === 1 ? 'img' : 'imgs'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Dimensions & Material */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs text-[var(--text-primary)]">
                            {item.length && item.width
                              ? `${item.length} × ${item.width}${item.height ? ` × ${item.height}` : ''} ${item.dimension_unit || 'mm'}`
                              : 'Custom sizing'}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                            {item.material || 'Standard SS'} {item.finish ? `(${item.finish})` : ''}
                          </div>
                        </td>

                        {/* Estimated Amount */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[var(--text-primary)]">
                            {item.estimated_amount !== null
                              ? formatCurrency(item.estimated_amount)
                              : '—'}
                          </div>
                        </td>

                        {/* Submitted Date */}
                        <td className="py-3.5 px-4 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                          {formatDate(item.created_at)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <CustomRequestStatusBadge status={item.status} size="sm" />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/custom-requests/${item.public_id}`)}
                            title="View Request Details"
                          >
                            <Eye className="w-4 h-4 text-[var(--color-primary-500)]" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setStatusModalTarget(item)}
                            title="Update Status"
                          >
                            <ArrowUpDown className="w-4 h-4 text-[var(--text-secondary)]" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {items.map((item) => (
              <Card key={item.public_id} className="border-[var(--border-border)]">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono text-[var(--text-tertiary)]">
                        #{item.public_id.slice(0, 8)}
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {item.customer_name}
                      </h3>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {item.phone} {item.city ? `• ${item.city}` : ''}
                      </div>
                    </div>
                    <CustomRequestStatusBadge status={item.status} size="sm" />
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--background-secondary)] text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Furniture Type:</span>
                      <span className="font-medium text-[var(--text-primary)] capitalize">
                        {item.product_type.replace(/_/g, ' ')} (Qty: {item.quantity})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Specifications:</span>
                      <span className="text-[var(--text-primary)]">
                        {item.length && item.width ? `${item.length}×${item.width} ${item.dimension_unit}` : 'Custom'} • {item.material || 'SS'}
                      </span>
                    </div>
                    {item.estimated_amount !== null && (
                      <div className="flex justify-between font-medium">
                        <span className="text-[var(--text-secondary)]">Estimated:</span>
                        <span className="text-[var(--text-primary)]">{formatCurrency(item.estimated_amount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-border)]">
                    <span>{formatDate(item.created_at)}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusModalTarget(item)}
                      >
                        Status
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/admin/custom-requests/${item.public_id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[var(--text-secondary)]">
              <div>
                Showing {(page - 1) * limit + 1} to{' '}
                {Math.min(page * limit, pagination.total)} of {pagination.total} requests
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>

                <span className="px-2 font-medium">
                  Page {page} of {pagination.totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages || isFetching}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Update Modal */}
      {statusModalTarget && (
        <CustomRequestStatusModal
          isOpen={Boolean(statusModalTarget)}
          onClose={() => setStatusModalTarget(null)}
          publicId={statusModalTarget.public_id}
          currentStatus={statusModalTarget.status}
          customerName={statusModalTarget.customer_name}
        />
      )}
    </div>
  );
}

export default CustomRequestListPage;
