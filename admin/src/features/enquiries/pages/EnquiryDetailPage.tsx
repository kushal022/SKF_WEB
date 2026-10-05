import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  Package,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react';
import {
  useGetEnquiryByPublicIdQuery,
} from '../../../app/store/api';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  LoadingState,
  ErrorState,
} from '../../../components/ui';
import EnquiryStatusBadge from '../components/EnquiryStatusBadge';
import EnquiryStatusModal from '../components/EnquiryStatusModal';
import EnquiryNotes from '../components/EnquiryNotes';
import EnquiryFollowUps from '../components/EnquiryFollowUps';
import EnquiryStatusHistory from '../components/EnquiryStatusHistory';
import { formatDateTime } from '../../../utils/date';
import type { EnquiryStatus } from '../../../types/enquiry';

const PIPELINE_STAGES: { status: EnquiryStatus; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'quotation_sent', label: 'Quoted' },
  { status: 'negotiation', label: 'Negotiation' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'completed', label: 'Completed' },
];

export function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const {
    data: enquiryResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetEnquiryByPublicIdQuery(id || '', {
    skip: !id,
  });

  const enquiry = enquiryResponse?.data;

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading enquiry CRM record..." />
      </div>
    );
  }

  if (isError || !enquiry) {
    return (
      <div className="py-8 space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/enquiries')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Enquiries
        </Button>
        <Card className="p-8">
          <ErrorState
            title="Enquiry Not Found"
            message={(error as any)?.data?.message || 'The requested enquiry could not be found or you may not have permission to view it.'}
            retryText="Try Again"
            onRetry={() => refetch()}
          />
        </Card>
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.findIndex((stage) => stage.status === enquiry.status);
  const isLost = enquiry.status === 'lost';

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/enquiries')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="shrink-0"
          >
            Back
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {enquiry.customer_name}
              </h1>
              <EnquiryStatusBadge status={enquiry.status} />
            </div>
            <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5">
              Enquiry ID: {enquiry.public_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/quotations/new?enquiryId=${enquiry.public_id}`)}
            leftIcon={<FileText className="w-4 h-4" />}
          >
            Create Quotation
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsStatusModalOpen(true)}
            leftIcon={<Sliders className="w-4 h-4" />}
          >
            Change Status
          </Button>
        </div>
      </div>

      {/* CRM Pipeline Lifecycle Visualizer */}
      <Card className="p-5 shadow-xs border border-[var(--border-border)]">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-semibold uppercase tracking-wider">
              Sales Pipeline Lifecycle
            </span>
            <span>
              Current: <strong className="text-[var(--text-primary)] capitalize">{enquiry.status.replace(/_/g, ' ')}</strong>
            </span>
          </div>

          {isLost ? (
            <div className="p-3 rounded-lg bg-[var(--status-error)]/10 border border-[var(--status-error)]/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--status-error)] font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>This enquiry has been marked as <strong>Lost</strong>. You may reactivate it by changing its status to New or Contacted.</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStatusModalOpen(true)}
                className="text-xs shrink-0"
              >
                Reactivate
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isPassed = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div
                    key={stage.status}
                    className={`
                      p-2.5 rounded-lg border text-center transition-all
                      ${
                        isCurrent
                          ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 font-bold text-[var(--brand-accent)] ring-1 ring-[var(--brand-accent)]'
                          : isPassed
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 font-medium'
                          : 'border-[var(--border-border)] bg-[var(--surface-muted)]/30 text-[var(--text-muted)]'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px] shrink-0 font-mono">
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate">{stage.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Main Details Grid: Left 2 cols, Right 1 col on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Enquiry Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details Card */}
          <Card className="shadow-xs border border-[var(--border-border)]">
            <CardHeader className="pb-3 border-b border-[var(--border-border)]">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[var(--brand-accent)]" />
                <CardTitle className="text-base font-semibold">Customer Information</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                  Full Name
                </span>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {enquiry.customer_name}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                  Phone Number
                </span>
                <a
                  href={`tel:${enquiry.phone}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {enquiry.phone}
                </a>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                  Email Address
                </span>
                {enquiry.email ? (
                  <a
                    href={`mailto:${enquiry.email}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {enquiry.email}
                  </a>
                ) : (
                  <span className="text-sm text-[var(--text-muted)] italic">
                    No email provided
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                  Enquiry Source
                </span>
                <span className="text-xs capitalize px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-border)] font-medium">
                  {enquiry.source || 'Website'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Enquiry Message & Details Card */}
          <Card className="shadow-xs border border-[var(--border-border)]">
            <CardHeader className="pb-3 border-b border-[var(--border-border)]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--brand-accent)]" />
                <CardTitle className="text-base font-semibold">Enquiry Message & Request</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                  Customer Message / Notes
                </span>
                <div className="p-3.5 rounded-lg bg-[var(--surface-muted)]/50 border border-[var(--border-border)] text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                  {enquiry.message || 'No specific message entered by customer.'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-border)] text-xs">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>
                    Received: <strong className="text-[var(--text-primary)]">{formatDateTime(enquiry.created_at)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>
                    Last Updated: <strong className="text-[var(--text-primary)]">{formatDateTime(enquiry.updated_at)}</strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Reference Card (If linked) */}
          {enquiry.product && (
            <Card className="shadow-xs border border-[var(--border-border)]">
              <CardHeader className="pb-3 border-b border-[var(--border-border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-[var(--brand-accent)]" />
                    <CardTitle className="text-base font-semibold">Associated Product</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/products/${enquiry.product?.public_id}`)}
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    View in Catalog
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-muted)]/50 border border-[var(--border-border)]">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                      {enquiry.product.name}
                    </h4>
                    <span className="font-mono text-xs text-[var(--text-muted)]">
                      /{enquiry.product.slug}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Furniture Reference (If linked) */}
          {enquiry.custom_request && (
            <Card className="shadow-xs border border-[var(--border-border)]">
              <CardHeader className="pb-3 border-b border-[var(--border-border)]">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[var(--brand-accent)]" />
                  <CardTitle className="text-base font-semibold">Custom Furniture Reference</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="p-3 rounded-lg bg-[var(--surface-muted)]/50 border border-[var(--border-border)] text-xs text-[var(--text-secondary)] space-y-1">
                  <div>Type: <strong className="text-[var(--text-primary)]">{enquiry.custom_request.product_type}</strong></div>
                  <div>Status: <strong className="text-[var(--text-primary)] capitalize">{enquiry.custom_request.status}</strong></div>
                  <div className="font-mono text-[11px] text-[var(--text-muted)]">ID: {enquiry.custom_request.public_id}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CRM Internal Notes */}
          <EnquiryNotes
            enquiryPublicId={enquiry.public_id}
            notes={enquiry.notes}
          />
        </div>

        {/* Right Column: Follow-ups & Status History */}
        <div className="space-y-6">
          {/* Scheduled Follow-ups */}
          <EnquiryFollowUps
            enquiryPublicId={enquiry.public_id}
            followUps={enquiry.follow_ups}
          />

          {/* Status Transition History Timeline */}
          <EnquiryStatusHistory
            statusLogs={enquiry.status_logs}
          />
        </div>
      </div>

      {/* Change Status Modal */}
      {isStatusModalOpen && (
        <EnquiryStatusModal
          key={`${enquiry.public_id}-${enquiry.status}`}
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          enquiryPublicId={enquiry.public_id}
          currentStatus={enquiry.status}
        />
      )}
    </div>
  );
}

export default EnquiryDetailPage;
