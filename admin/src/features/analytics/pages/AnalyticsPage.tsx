import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Inbox,
  FileText,
  CheckCircle2,
  Sparkles,
  Package,
  Star,
  RefreshCw,
  Building2,
  PieChart,
  ShieldCheck,
} from 'lucide-react';
import {
  useGetDashboardSummaryQuery,
  useGetQuotationsQuery,
  useGetEnquiriesQuery,
  useGetReviewsQuery,
  useGetGalleriesQuery,
  useGetCategoriesQuery,
} from '../../../app/store/api';
import type {
  QuotationListItem,
  EnquiryListItem,
  ReviewItem,
  GalleryItem,
} from '../../../app/store/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  LoadingState,
} from '../../../components/ui';
import type { AnalyticsDateFilter } from '../../../types/analytics';

// Format Indian Rupee currency safely
function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Date helper to filter items
function isWithinDateRange(dateString: string | undefined, filter: AnalyticsDateFilter): boolean {
  if (filter === 'all' || !dateString) return true;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return true;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case 'today':
      return date >= startOfDay;
    case '7d': {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= past7;
    }
    case '30d': {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return date >= past30;
    }
    case 'month': {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= firstDayOfMonth;
    }
    default:
      return true;
  }
}

const DATE_FILTER_OPTIONS: { key: AnalyticsDateFilter; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: 'month', label: 'This Month' },
];

export default function AnalyticsPage() {
  const [dateFilter, setDateFilter] = useState<AnalyticsDateFilter>('all');

  // Backend RTK Query calls
  const {
    data: summaryRes,
    isLoading: summaryLoading,
    refetch: refetchSummary,
    isFetching: summaryFetching,
  } = useGetDashboardSummaryQuery();

  const { data: quotationsRes, isLoading: quotesLoading, refetch: refetchQuotes } =
    useGetQuotationsQuery({ page: 1, limit: 100 });

  const { data: enquiriesRes, isLoading: enquiriesLoading, refetch: refetchEnquiries } =
    useGetEnquiriesQuery({ page: 1, limit: 100 });

  const { data: reviewsRes, isLoading: reviewsLoading, refetch: refetchReviews } =
    useGetReviewsQuery({ page: 1, limit: 100 });

  const { data: galleriesRes, isLoading: galleryLoading, refetch: refetchGallery } =
    useGetGalleriesQuery({ page: 1, limit: 100 });

  const { data: categoriesRes, isLoading: categoriesLoading } = useGetCategoriesQuery();

  const handleRefreshAll = () => {
    refetchSummary();
    refetchQuotes();
    refetchEnquiries();
    refetchReviews();
    refetchGallery();
  };

  const isLoading =
    summaryLoading || quotesLoading || enquiriesLoading || reviewsLoading || galleryLoading || categoriesLoading;

  const summary = summaryRes?.data;

  // The API returns data?.items for paginated results
  const rawQuotations: QuotationListItem[] = useMemo(
    () => quotationsRes?.data?.items ?? [],
    [quotationsRes]
  );
  const rawEnquiries: EnquiryListItem[] = useMemo(
    () => enquiriesRes?.data?.items ?? [],
    [enquiriesRes]
  );
  const rawReviews: ReviewItem[] = useMemo(
    () => reviewsRes?.data?.items ?? [],
    [reviewsRes]
  );
  const rawGalleries: GalleryItem[] = useMemo(
    () => galleriesRes?.data?.items ?? [],
    [galleriesRes]
  );
  const rawCategories = useMemo(
    () => categoriesRes?.data?.items ?? [],
    [categoriesRes]
  );

  // Filtered Quotations
  const filteredQuotations = useMemo(
    () => rawQuotations.filter((q) => isWithinDateRange(q.created_at, dateFilter)),
    [rawQuotations, dateFilter]
  );

  // Filtered Enquiries
  const filteredEnquiries = useMemo(
    () => rawEnquiries.filter((e) => isWithinDateRange(e.created_at, dateFilter)),
    [rawEnquiries, dateFilter]
  );

  // Filtered Reviews
  const filteredReviews = useMemo(
    () => rawReviews.filter((r) => isWithinDateRange(r.created_at, dateFilter)),
    [rawReviews, dateFilter]
  );

  // Quotation Metrics
  const quotationMetrics = useMemo(() => {
    let draft = 0;
    let sent = 0;
    let accepted = 0;
    let rejected = 0;
    let expired = 0;
    let cancelled = 0;
    let totalQuotedValue = 0;
    let acceptedValue = 0;

    for (const q of filteredQuotations) {
      const val = Number(q.total_amount ?? 0);
      totalQuotedValue += val;

      switch (q.status) {
        case 'draft': draft++; break;
        case 'sent': sent++; break;
        case 'accepted': accepted++; acceptedValue += val; break;
        case 'rejected': rejected++; break;
        case 'expired': expired++; break;
        case 'cancelled': cancelled++; break;
      }
    }

    const total = filteredQuotations.length;
    const totalFromSummary = summary?.quotations?.total;
    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    return {
      total: dateFilter === 'all' && totalFromSummary != null ? totalFromSummary : total,
      sent: dateFilter === 'all' && summary?.quotations?.sent != null ? summary.quotations.sent : sent,
      accepted:
        dateFilter === 'all' && summary?.quotations?.accepted != null
          ? summary.quotations.accepted
          : accepted,
      draft,
      rejected,
      expired,
      cancelled,
      totalQuotedValue,
      acceptedValue,
      acceptanceRate,
    };
  }, [filteredQuotations, dateFilter, summary]);

  // Enquiry Pipeline Breakdown
  const enquiryPipeline = useMemo(() => {
    let newCount = 0;
    let contacted = 0;
    let quotation_sent = 0;
    let negotiation = 0;
    let confirmed = 0;
    let completed = 0;
    let lost = 0;

    for (const e of filteredEnquiries) {
      switch (e.status) {
        case 'new': newCount++; break;
        case 'contacted': contacted++; break;
        case 'quotation_sent': quotation_sent++; break;
        case 'negotiation': negotiation++; break;
        case 'confirmed': confirmed++; break;
        case 'completed': completed++; break;
        case 'lost': lost++; break;
      }
    }

    const total = filteredEnquiries.length;
    return {
      new: newCount,
      contacted,
      quotation_sent,
      negotiation,
      confirmed,
      completed,
      lost,
      total:
        dateFilter === 'all' && summary?.enquiries?.total != null
          ? summary.enquiries.total
          : total,
      newDisplayCount:
        dateFilter === 'all' && summary?.enquiries?.new != null
          ? summary.enquiries.new
          : newCount,
    };
  }, [filteredEnquiries, dateFilter, summary]);

  // Review Metrics
  const reviewMetrics = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let ratingSum = 0;
    let featuredCount = 0;

    for (const r of filteredReviews) {
      ratingSum += Number(r.rating ?? 0);
      if (r.status === 'pending') pending++;
      if (r.status === 'approved') approved++;
      if (r.status === 'rejected') rejected++;
      if (r.is_featured) featuredCount++;
    }

    const total = filteredReviews.length;
    const avg = total > 0 ? (ratingSum / total).toFixed(1) : '5.0';

    return { total, pending, approved, rejected, averageRating: avg, featuredCount };
  }, [filteredReviews]);

  // Gallery Metrics
  const galleryMetrics = useMemo(() => {
    let published = 0;
    let archived = 0;
    for (const p of rawGalleries) {
      if (p.status === 'published') published++;
      if (p.status === 'archived') archived++;
    }
    return { total: rawGalleries.length, published, archived };
  }, [rawGalleries]);

  if (isLoading && !summaryRes) {
    return (
      <div className="py-24">
        <LoadingState message="Loading SKF administrative analytics..." />
      </div>
    );
  }

  const pipelineStages = [
    { label: 'New Inquiries', count: enquiryPipeline.new, color: 'bg-blue-500' },
    { label: 'Contacted / Discovery', count: enquiryPipeline.contacted, color: 'bg-cyan-500' },
    { label: 'Quotation Sent', count: enquiryPipeline.quotation_sent, color: 'bg-indigo-500' },
    { label: 'In Negotiation', count: enquiryPipeline.negotiation, color: 'bg-amber-500' },
    { label: 'Confirmed / Won', count: enquiryPipeline.confirmed, color: 'bg-emerald-500' },
    { label: 'Completed / Handover', count: enquiryPipeline.completed, color: 'bg-teal-500' },
    { label: 'Lost / Closed', count: enquiryPipeline.lost, color: 'bg-rose-400' },
  ] as const;

  const quotationStatusGrid = [
    {
      label: 'Accepted',
      count: quotationMetrics.accepted,
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      label: 'Sent to Client',
      count: quotationMetrics.sent,
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      label: 'Draft Mode',
      count: quotationMetrics.draft,
      bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    },
    {
      label: 'Rejected',
      count: quotationMetrics.rejected,
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
    {
      label: 'Expired',
      count: quotationMetrics.expired,
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      label: 'Cancelled',
      count: quotationMetrics.cancelled,
      bg: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Executive Business Analytics — Phase 2</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Performance &amp; Pipeline Analytics
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Real-time aggregate telemetry across Enquiries, Commercial Quotations, Custom Furniture, and Catalog reach.
          </p>
        </div>

        {/* Filter Controls & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[var(--surface-surface)] border border-[var(--border-border)] rounded-lg p-0.5 shadow-2xs">
            {DATE_FILTER_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setDateFilter(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  dateFilter === key
                    ? 'bg-[var(--brand-primary)] text-white shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={summaryFetching}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${summaryFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Enquiries */}
        <Card className="border border-[var(--border-border)] shadow-xs hover:border-[var(--brand-primary)]/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Total Enquiries
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Inbox className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                {enquiryPipeline.total}
              </span>
              {enquiryPipeline.newDisplayCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {enquiryPipeline.newDisplayCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              {enquiryPipeline.contacted + enquiryPipeline.quotation_sent + enquiryPipeline.negotiation} leads in active negotiation
            </p>
          </CardContent>
        </Card>

        {/* KPI: Quotations */}
        <Card className="border border-[var(--border-border)] shadow-xs hover:border-[var(--brand-primary)]/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Commercial Quotes
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                {quotationMetrics.total}
              </span>
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                ({quotationMetrics.sent} sent)
              </span>
            </div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
              {formatINR(quotationMetrics.totalQuotedValue)} total quoted
            </p>
          </CardContent>
        </Card>

        {/* KPI: Accepted Proposals */}
        <Card className="border border-[var(--border-border)] shadow-xs hover:border-[var(--brand-primary)]/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Accepted Proposals
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {quotationMetrics.accepted}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                {quotationMetrics.acceptanceRate}% rate
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-2">
              {formatINR(quotationMetrics.acceptedValue)} accepted volume
            </p>
          </CardContent>
        </Card>

        {/* KPI: Custom Requests */}
        <Card className="border border-[var(--border-border)] shadow-xs hover:border-[var(--brand-primary)]/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Custom Fabrications
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                {summary?.customRequests?.total ?? 0}
              </span>
              {(summary?.customRequests?.new ?? 0) > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                  {summary?.customRequests?.new} new
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Bespoke stainless steel fabrication specs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CRM Enquiry Pipeline Funnel */}
        <Card className="border border-[var(--border-border)] shadow-xs">
          <CardHeader className="pb-3 border-b border-[var(--border-border)] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>Enquiry CRM Pipeline</span>
              </CardTitle>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Conversion stages from initial lead to confirmed architectural order
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-[var(--surface-muted)] text-[var(--text-secondary)]">
              {enquiryPipeline.total} Total
            </span>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {pipelineStages.map((stage) => {
              const maxCount = Math.max(1, enquiryPipeline.total);
              const percentage = Math.round((stage.count / maxCount) * 100);
              return (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--text-primary)]">{stage.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)]">{stage.count}</span>
                      <span className="text-[11px] text-[var(--text-secondary)] w-8 text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                      style={{ width: `${stage.count > 0 ? Math.max(percentage, 4) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Quotation Distribution */}
        <Card className="border border-[var(--border-border)] shadow-xs">
          <CardHeader className="pb-3 border-b border-[var(--border-border)] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Commercial Quotation Distribution</span>
              </CardTitle>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Status ratios and financial progression of generated estimates
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
              {quotationMetrics.acceptanceRate}% Success
            </span>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            {/* Revenue bar */}
            <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-border)] space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[var(--text-secondary)]">Revenue Value Captured</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatINR(quotationMetrics.acceptedValue)} of {formatINR(quotationMetrics.totalQuotedValue)}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      quotationMetrics.totalQuotedValue > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (quotationMetrics.acceptedValue / quotationMetrics.totalQuotedValue) * 100
                            )
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Status grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quotationStatusGrid.map((item) => (
                <div
                  key={item.label}
                  className={`p-3 rounded-lg border flex flex-col justify-between ${item.bg}`}
                >
                  <span className="text-xs font-semibold">{item.label}</span>
                  <span className="text-xl font-bold mt-1">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Products & Catalog */}
        <Card className="border border-[var(--border-border)] shadow-xs">
          <CardHeader className="pb-3 border-b border-[var(--border-border)]">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              <span>Catalog &amp; Inventory Reach</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {[
              { label: 'Total Catalog Products', value: summary?.products?.total ?? 0, color: '' },
              { label: 'Active Published', value: summary?.products?.published ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Draft / Hidden', value: summary?.products?.draft ?? 0, color: 'text-[var(--text-secondary)]' },
              { label: 'Product Categories', value: rawCategories.length, color: '' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between text-xs py-1 border-b border-[var(--border-border)] last:border-0">
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className={`font-bold ${color || 'text-[var(--text-primary)]'}`}>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reviews & Satisfaction */}
        <Card className="border border-[var(--border-border)] shadow-xs">
          <CardHeader className="pb-3 border-b border-[var(--border-border)]">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Customer Satisfaction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-extrabold text-[var(--text-primary)]">
                  {reviewMetrics.averageRating}{' '}
                  <span className="text-sm font-normal text-[var(--text-secondary)]">/ 5.0</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {reviewMetrics.total} verified reviews
                </p>
              </div>
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(Number(reviewMetrics.averageRating))
                        ? 'fill-amber-500'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--border-border)] space-y-1.5">
              {[
                { label: 'Approved & Displayed', value: reviewMetrics.approved, color: 'text-emerald-600' },
                { label: 'Pending Moderation', value: reviewMetrics.pending, color: 'text-amber-600' },
                { label: 'Featured Testimonials', value: reviewMetrics.featuredCount, color: 'text-indigo-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">{label}</span>
                  <span className={`font-semibold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gallery Projects */}
        <Card className="border border-[var(--border-border)] shadow-xs">
          <CardHeader className="pb-3 border-b border-[var(--border-border)]">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              <span>Architectural Showcase</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {[
              { label: 'Total Projects', value: galleryMetrics.total, color: '' },
              { label: 'Publicly Displayed', value: galleryMetrics.published, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Archived Projects', value: galleryMetrics.archived, color: 'text-[var(--text-secondary)]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between text-xs py-1 border-b border-[var(--border-border)] last:border-0">
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className={`font-bold ${color || 'text-[var(--text-primary)]'}`}>{value}</span>
              </div>
            ))}
            <div className="p-2.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Live Objection.js concurrent aggregates</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
