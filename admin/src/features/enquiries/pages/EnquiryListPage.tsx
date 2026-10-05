import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Search,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useGetEnquiriesQuery,
} from '../../../app/store/api';
import type { EnquiryListItem, EnquiryStatus, EnquiryQueryParams } from '../../../types/enquiry';
import {
  Button,
  Input,
  Select,
  Card,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../../components/ui';
import EnquiryStatusBadge from '../components/EnquiryStatusBadge';
import { formatDateTime } from '../../../utils/date';

export function EnquiryListPage() {
  const navigate = useNavigate();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('-created_at');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Construct query params
  const queryParams = useMemo(() => {
    const params: EnquiryQueryParams = {
      page,
      limit,
    };

    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter as EnquiryStatus;
    }
    if (sourceFilter !== 'all') {
      params.source = sourceFilter;
    }
    if (sortField) {
      params.sort = sortField as any;
    }

    return params;
  }, [searchTerm, statusFilter, sourceFilter, sortField, page, limit]);

  const {
    data: enquiriesResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetEnquiriesQuery(queryParams);

  const enquiries: EnquiryListItem[] = enquiriesResponse?.data?.items || [];
  const pagination = enquiriesResponse?.data?.pagination || {
    total: enquiries.length,
    totalPages: Math.ceil(enquiries.length / limit) || 1,
    page,
    limit,
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSourceFilter('all');
    setSortField('-created_at');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Enquiries
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-semibold">
              {pagination.total} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Manage customer enquiries, follow-ups and sales pipeline.
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
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 shadow-xs border border-[var(--border-border)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-1">
            <Input
              id="enquiry-search"
              placeholder="Search by customer, phone, email..."
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
            id="enquiry-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'new', label: 'New' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'quotation_sent', label: 'Quotation Sent' },
              { value: 'negotiation', label: 'Negotiation' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'completed', label: 'Completed' },
              { value: 'lost', label: 'Lost' },
            ]}
          />

          {/* Source Filter */}
          <Select
            id="enquiry-source-filter"
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Sources' },
              { value: 'website', label: 'Website Form' },
              { value: 'direct', label: 'Direct Enquiry' },
              { value: 'phone', label: 'Phone' },
              { value: 'email', label: 'Email' },
            ]}
          />

          {/* Sort Filter */}
          <Select
            id="enquiry-sort-filter"
            value={sortField}
            onChange={(e) => {
              setSortField(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '-created_at', label: 'Newest Inquiries' },
              { value: 'created_at', label: 'Oldest Inquiries' },
              { value: 'customer_name', label: 'Customer (A-Z)' },
              { value: '-customer_name', label: 'Customer (Z-A)' },
              { value: 'status', label: 'Status' },
            ]}
          />
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <Card className="p-12 border border-[var(--border-border)]">
          <LoadingState message="Loading sales enquiries and CRM pipeline..." />
        </Card>
      ) : isError ? (
        <Card className="p-8 border border-[var(--border-border)]">
          <ErrorState
            title="Unable to load enquiries"
            message={(error as any)?.data?.message || 'Could not connect to enquiry management service.'}
            retryText="Try Again"
            onRetry={() => refetch()}
          />
        </Card>
      ) : enquiries.length === 0 ? (
        <Card className="p-12 border border-[var(--border-border)]">
          <EmptyState
            title="No enquiries found"
            description="Customer enquiries will appear here once they are submitted via website or direct contact."
            actionText={searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' ? 'Reset Filters' : undefined}
            onAction={handleResetFilters}
            icon={<Inbox className="w-8 h-8" />}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop & Tablet Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)] shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Product / Interest</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-border)] text-[var(--text-primary)]">
                {enquiries.map((item) => (
                  <tr
                    key={item.public_id}
                    className="hover:bg-[var(--surface-muted)]/50 transition-colors"
                  >
                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/enquiries/${item.public_id}`)}
                          className="font-medium text-[var(--text-primary)] hover:text-[var(--brand-accent)] text-left hover:underline line-clamp-1"
                        >
                          {item.customer_name}
                        </button>
                        <span className="font-mono text-[10px] text-[var(--text-muted)] block">
                          ID: {item.public_id.slice(0, 8)}...
                        </span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Phone className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                          <a
                            href={`tel:${item.phone}`}
                            className="hover:text-[var(--brand-accent)] hover:underline"
                          >
                            {item.phone}
                          </a>
                        </div>
                        {item.email && (
                          <div className="flex items-center gap-1.5 text-[var(--text-muted)] truncate max-w-[180px]">
                            <Mail className="w-3 h-3 shrink-0" />
                            <a
                              href={`mailto:${item.email}`}
                              className="hover:text-[var(--brand-accent)] hover:underline truncate"
                            >
                              {item.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3 px-4 text-xs">
                      {item.product ? (
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-[var(--brand-accent)] shrink-0" />
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/products/${item.product?.public_id}`)}
                            className="font-medium text-[var(--text-primary)] hover:text-[var(--brand-accent)] hover:underline line-clamp-1 text-left"
                          >
                            {item.product.name}
                          </button>
                        </div>
                      ) : item.custom_request ? (
                        <span className="text-xs text-[var(--brand-accent)] font-medium">
                          Custom: {item.custom_request.product_type}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">
                          General Enquiry
                        </span>
                      )}
                    </td>

                    {/* Source */}
                    <td className="py-3 px-4">
                      <span className="inline-block text-xs capitalize px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-border)] font-medium">
                        {item.source || 'Website'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <EnquiryStatusBadge status={item.status} size="sm" />
                    </td>

                    {/* Received */}
                    <td className="py-3 px-4 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>{formatDateTime(item.created_at)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/enquiries/${item.public_id}`)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)] shadow-xs">
            <div className="text-xs text-[var(--text-secondary)]">
              Showing{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {enquiries.length > 0 ? (page - 1) * limit + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {Math.min(page * limit, pagination.total)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {pagination.total}
              </span>{' '}
              enquiries
            </div>

            <div className="flex items-center gap-3">
              {/* Page Limit Selector */}
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

              {/* Prev / Next Page Buttons */}
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
    </div>
  );
}

export default EnquiryListPage;
