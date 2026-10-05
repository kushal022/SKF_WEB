import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  MessageSquare,
  FileText,
  Clock,
  Trash2,
  ImagePlus,
  Inbox,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import {
  useGetCustomRequestByPublicIdQuery,
  useDeleteCustomRequestImageMutation,
} from '../../../app/store/api';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { LoadingState } from '../../../components/ui';
import { useToast } from '../../../components/ui';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import { CUSTOM_REQUEST_STATUS_CONFIG } from '../constants';
import { CustomRequestStatusBadge } from '../components/CustomRequestStatusBadge';
import { CustomRequestStatusModal } from '../components/CustomRequestStatusModal';
import { CustomRequestImageLightbox } from '../components/CustomRequestImageLightbox';
import { CustomRequestImageAddModal } from '../components/CustomRequestImageAddModal';
import { CustomRequestEstimatorCard } from '../components/CustomRequestEstimatorCard';

export function CustomRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: response, isLoading, error } = useGetCustomRequestByPublicIdQuery(id || '', {
    skip: !id,
  });
  const [deleteImage, { isLoading: isDeletingImage }] = useDeleteCustomRequestImageMutation();

  // Modals & Lightbox state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const request = response?.data;

  const handleDeleteImage = async (imagePublicId: string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to remove this reference image?')) {
      return;
    }

    try {
      await deleteImage({
        publicId: id,
        imagePublicId,
      }).unwrap();
      showToast('success', 'Reference image removed successfully.', 'Image Deleted');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to delete reference image.';
      showToast('error', msg, 'Delete Failed');
    }
  };

  const handleCreateQuotation = () => {
    if (!request) return;

    // Check if there is an existing linked enquiry
    const linkedEnquiryId = request.linked_enquiries && request.linked_enquiries.length > 0
      ? request.linked_enquiries[0].public_id
      : null;

    const params = new URLSearchParams();
    if (linkedEnquiryId) {
      params.set('enquiryId', linkedEnquiryId);
    }
    params.set('customerName', request.customer_name);
    params.set('customerPhone', request.phone);
    if (request.email) params.set('customerEmail', request.email);
    params.set('productType', request.product_type);
    if (request.estimated_amount) params.set('estimatedAmount', String(request.estimated_amount));
    params.set(
      'notes',
      `Custom Request #${request.public_id.slice(0, 8)} (${request.product_type.replace(/_/g, ' ')})\nDimensions: ${
        request.length && request.width ? `${request.length}×${request.width} ${request.dimension_unit || 'mm'}` : 'Custom'
      }\nMaterial: ${request.material || 'SS'} | Finish: ${request.finish || 'Standard'}\nClient Notes: ${request.requirement || 'N/A'}`
    );

    navigate(`/admin/quotations/new?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingState message="Loading custom furniture request details..." />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/custom-requests')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Custom Requests
        </Button>
        <Card className="border-[var(--color-error-500)]/30 bg-[var(--color-error-500)]/10">
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[var(--color-error-500)] mx-auto" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Custom Request Not Found
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              The requested custom furniture proposal could not be retrieved from the server.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cleanPhone = request.phone.replace(/[^0-9+]/g, '');
  const images = request.images || [];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/custom-requests')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-xs -ml-2 text-[var(--text-secondary)]"
          >
            Back to Custom Requests
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--color-primary-500)]" />
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Custom Request #{request.public_id.slice(0, 8)}
              </h1>
            </div>
            <CustomRequestStatusBadge status={request.status} />
          </div>
          <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-3">
            <span>Submitted: {formatDate(request.created_at)}</span>
            <span>•</span>
            <span>Last Updated: {formatDate(request.updated_at)}</span>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsStatusModalOpen(true)}
            leftIcon={<ArrowUpDown className="w-4 h-4" />}
          >
            Update Status
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleCreateQuotation}
            leftIcon={<FileText className="w-4 h-4" />}
          >
            Create Quotation
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Specifications, Estimator, Images */}
        <div className="lg:col-span-2 space-y-6">
          {/* Furniture Requirements Card */}
          <Card className="border-[var(--border-border)] shadow-sm">
            <CardHeader className="pb-3 border-b border-[var(--border-border)]">
              <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
                Custom Furniture Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Furniture Type</span>
                  <div className="text-sm font-semibold text-[var(--text-primary)] capitalize mt-0.5">
                    {request.product_type.replace(/_/g, ' ')}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Quantity</span>
                  <div className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
                    {request.quantity} unit(s)
                  </div>
                </div>

                <div>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Dimensions</span>
                  <div className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
                    {request.length && request.width
                      ? `${request.length} × ${request.width}${request.height ? ` × ${request.height}` : ''} ${request.dimension_unit || 'mm'}`
                      : 'Custom specified'}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Material Grade</span>
                  <div className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
                    {request.material || 'Standard Stainless Steel'}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Surface Finish</span>
                  <div className="text-sm font-semibold text-[var(--text-primary)] mt-0.5 capitalize">
                    {request.finish || 'Natural Mill / Standard'}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Customer Budget / Estimate</span>
                  <div className="text-sm font-bold text-[var(--color-primary-500)] mt-0.5">
                    {request.estimated_amount !== null
                      ? formatCurrency(request.estimated_amount)
                      : 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Requirement Text Block */}
              <div>
                <span className="text-xs text-[var(--text-secondary)] font-medium">
                  Detailed Customer Requirement
                </span>
                <div className="mt-1.5 p-3.5 rounded-lg bg-[var(--background-secondary)] text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed border border-[var(--border-border)]">
                  {request.requirement || 'No additional custom details or notes provided.'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estimator Integration Card */}
          <CustomRequestEstimatorCard request={request} />

          {/* Reference Images Gallery */}
          <Card className="border-[var(--border-border)] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border-border)]">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
                  Reference Images & CAD Drawings
                </CardTitle>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--background-secondary)] text-[var(--text-secondary)] font-medium">
                  {images.length}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddImageModalOpen(true)}
                leftIcon={<ImagePlus className="w-3.5 h-3.5" />}
              >
                Attach Image
              </Button>
            </CardHeader>

            <CardContent className="pt-4">
              {images.length === 0 ? (
                <div className="py-8 text-center space-y-2 border border-dashed border-[var(--border-border)] rounded-lg bg-[var(--background-secondary)]/30">
                  <ImagePlus className="w-8 h-8 text-[var(--text-tertiary)] mx-auto opacity-60" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    No reference images or drawings attached yet.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddImageModalOpen(true)}
                    className="text-xs"
                  >
                    Attach First Image
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={img.public_id}
                      className="group relative rounded-lg border border-[var(--border-border)] overflow-hidden bg-black/20 aspect-square"
                    >
                      <img
                        src={img.image_url}
                        alt={`Reference drawing ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(idx)}
                          className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                          title="View larger"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.public_id)}
                          disabled={isDeletingImage}
                          className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                          title="Delete image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Customer Snapshot, Linked Enquiry, Pipeline Status */}
        <div className="space-y-6">
          {/* Customer Information Card */}
          <Card className="border-[var(--border-border)] shadow-sm">
            <CardHeader className="pb-3 border-b border-[var(--border-border)]">
              <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
                Customer Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <div className="text-base font-bold text-[var(--text-primary)]">
                  {request.customer_name}
                </div>
                {request.city && (
                  <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span>{request.city}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-border)]/50">
                  <span className="text-[var(--text-secondary)]">Phone:</span>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="font-medium text-[var(--color-primary-500)] hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{request.phone}</span>
                  </a>
                </div>

                {request.email && (
                  <div className="flex items-center justify-between py-1 border-b border-[var(--border-border)]/50">
                    <span className="text-[var(--text-secondary)]">Email:</span>
                    <a
                      href={`mailto:${request.email}`}
                      className="font-medium text-[var(--color-primary-500)] hover:underline flex items-center gap-1 max-w-[180px] truncate"
                      title={request.email}
                    >
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{request.email}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Direct Communication Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <a
                  href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
                    `Hello ${request.customer_name}, regarding your SKF custom furniture request #${request.public_id.slice(0, 8)} (${request.product_type}):`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 transition-colors text-xs font-medium"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${cleanPhone}`}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[var(--background-secondary)] text-[var(--text-primary)] hover:bg-[var(--background-secondary)]/80 transition-colors text-xs font-medium border border-[var(--border-border)]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Customer</span>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Related Enquiry Card (CRM Integration) */}
          <Card className="border-[var(--border-border)] shadow-sm">
            <CardHeader className="pb-3 border-b border-[var(--border-border)]">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[var(--color-primary-500)]" />
                <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
                  Linked CRM Enquiry
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {request.linked_enquiries && request.linked_enquiries.length > 0 ? (
                <div className="space-y-3">
                  {request.linked_enquiries.map((enq) => (
                    <div
                      key={enq.public_id}
                      className="p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border-border)] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[var(--text-tertiary)]">
                          #{enq.public_id.slice(0, 8)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] font-medium uppercase text-[10px]">
                          {enq.status}
                        </span>
                      </div>
                      <div className="text-[var(--text-secondary)]">
                        Source: <span className="text-[var(--text-primary)] capitalize">{enq.source.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-[var(--text-tertiary)]">
                        Created: {formatDate(enq.created_at)}
                      </div>
                      <div className="pt-1">
                        <Link
                          to={`/admin/enquiries/${enq.public_id}`}
                          className="inline-flex items-center gap-1 text-xs text-[var(--color-primary-500)] hover:underline font-medium"
                        >
                          <span>Open in CRM Pipeline</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-secondary)]">
                  No linked CRM enquiry records found.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Request Lifecycle Timeline / Progress Card */}
          <Card className="border-[var(--border-border)] shadow-sm">
            <CardHeader className="pb-3 border-b border-[var(--border-border)]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--color-primary-500)]" />
                <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
                  Request Progression
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 text-xs">
                {(['new', 'reviewing', 'quoted', 'approved', 'completed'] as const).map(
                  (stepStatus, index) => {
                    const isCurrent = request.status === stepStatus;
                    const config = CUSTOM_REQUEST_STATUS_CONFIG[stepStatus];
                    const currentIndex = CUSTOM_REQUEST_STATUS_CONFIG[request.status]?.stepIndex || 0;
                    const isPassed = currentIndex > config.stepIndex;

                    return (
                      <div key={stepStatus} className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5 ${
                            isCurrent
                              ? 'bg-[var(--color-primary-500)] text-white ring-4 ring-[var(--color-primary-500)]/20'
                              : isPassed
                              ? 'bg-emerald-500 text-white'
                              : 'bg-[var(--background-secondary)] text-[var(--text-tertiary)] border border-[var(--border-border)]'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div
                            className={`font-semibold ${
                              isCurrent
                                ? 'text-[var(--color-primary-500)]'
                                : isPassed
                                ? 'text-[var(--text-primary)]'
                                : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            {config.label}
                          </div>
                          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}

                {request.status === 'rejected' && (
                  <div className="mt-2 p-2.5 rounded-lg bg-[var(--color-error-500)]/10 border border-[var(--color-error-500)]/20 text-xs text-[var(--color-error-500)]">
                    This request was rejected or cancelled.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Modal */}
      {isStatusModalOpen && (
        <CustomRequestStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          publicId={request.public_id}
          currentStatus={request.status}
          customerName={request.customer_name}
        />
      )}

      {/* Add Reference Image Modal */}
      {isAddImageModalOpen && (
        <CustomRequestImageAddModal
          isOpen={isAddImageModalOpen}
          onClose={() => setIsAddImageModalOpen(false)}
          publicId={request.public_id}
        />
      )}

      {/* Lightbox Preview */}
      {lightboxIndex !== null && (
        <CustomRequestImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={(idx) => setLightboxIndex(idx)}
        />
      )}
    </div>
  );
}

export default CustomRequestDetailPage;
