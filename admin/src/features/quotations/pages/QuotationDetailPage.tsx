import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sliders,
  Printer,
  Plus,
  Trash2,
  Edit2,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  ExternalLink,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import {
  useGetQuotationByPublicIdQuery,
  useDeleteQuotationMutation,
  useDeleteQuotationItemMutation,
  useUpdateQuotationMutation,
} from '../../../app/store/api';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  LoadingState,
  ErrorState,
  Modal,
  Input,
  useToast,
} from '../../../components/ui';
import QuotationStatusBadge from '../components/QuotationStatusBadge';
import QuotationStatusModal from '../components/QuotationStatusModal';
import QuotationItemModal from '../components/QuotationItemModal';
import QuotationDeleteDialog from '../components/QuotationDeleteDialog';
import QuotationPreview from '../components/QuotationPreview';
import QuotationStatusHistory from '../components/QuotationStatusHistory';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import type { QuotationItem } from '../../../types/quotation';

export function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'manage' | 'preview'>('manage');

  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Line item modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<QuotationItem | null>(null);

  // Edit Header & Charges modal
  const [isEditHeaderOpen, setIsEditHeaderOpen] = useState(false);
  const [headerCustomerName, setHeaderCustomerName] = useState('');
  const [headerCustomerPhone, setHeaderCustomerPhone] = useState('');
  const [headerCustomerEmail, setHeaderCustomerEmail] = useState('');
  const [headerValidUntil, setHeaderValidUntil] = useState('');
  const [headerNotes, setHeaderNotes] = useState('');
  const [headerCustomization, setHeaderCustomization] = useState(0);
  const [headerTransport, setHeaderTransport] = useState(0);
  const [headerInstallation, setHeaderInstallation] = useState(0);
  const [headerDiscount, setHeaderDiscount] = useState(0);
  const [headerTax, setHeaderTax] = useState(0);
  const [headerError, setHeaderError] = useState<string | null>(null);

  const {
    data: quotationRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetQuotationByPublicIdQuery(id || '', {
    skip: !id,
  });

  const [deleteQuotation, { isLoading: isDeletingQuotation }] = useDeleteQuotationMutation();
  const [deleteQuotationItem] = useDeleteQuotationItemMutation();
  const [updateQuotation, { isLoading: isUpdatingHeader }] = useUpdateQuotationMutation();

  const quotation = quotationRes?.data;

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading quotation details & financial calculations..." />
      </div>
    );
  }

  if (isError || !quotation) {
    return (
      <div className="py-8 space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/quotations')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Quotations
        </Button>
        <Card className="p-8">
          <ErrorState
            title="Quotation Not Found"
            message={(error as any)?.data?.message || 'The requested quotation could not be loaded.'}
            retryText="Try Again"
            onRetry={() => refetch()}
          />
        </Card>
      </div>
    );
  }

  const isLocked = quotation.status === 'accepted' || quotation.status === 'cancelled';
  const isDraft = quotation.status === 'draft';

  const handleDeleteQuotationConfirm = async () => {
    try {
      setDeleteError(null);
      await deleteQuotation(quotation.public_id).unwrap();
      showToast('success', `Quotation ${quotation.quotation_number} deleted.`, 'Deleted');
      navigate('/admin/quotations');
    } catch (err: any) {
      setDeleteError(err?.data?.message || 'Failed to delete quotation.');
    }
  };

  const handleDeleteItem = async (itemPublicId: string) => {
    if (quotation.items.length <= 1) {
      showToast('error', 'A quotation must contain at least one line item.', 'Action Blocked');
      return;
    }
    if (!window.confirm('Delete this line item? Totals will be automatically recalculated.')) {
      return;
    }

    try {
      await deleteQuotationItem({
        publicId: quotation.public_id,
        itemPublicId,
      }).unwrap();
      showToast('info', 'Line item removed. Totals recalculated.', 'Item Deleted');
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to delete line item.', 'Error');
    }
  };

  const handleOpenEditHeader = () => {
    setHeaderCustomerName(quotation.customer_name);
    setHeaderCustomerPhone(quotation.customer_phone);
    setHeaderCustomerEmail(quotation.customer_email || '');
    setHeaderValidUntil(quotation.valid_until || '');
    setHeaderNotes(quotation.notes || '');
    setHeaderCustomization(Number(quotation.customization_amount || 0));
    setHeaderTransport(Number(quotation.transport_amount || 0));
    setHeaderInstallation(Number(quotation.installation_amount || 0));
    setHeaderDiscount(Number(quotation.discount_amount || 0));
    setHeaderTax(Number(quotation.tax_amount || 0));
    setHeaderError(null);
    setIsEditHeaderOpen(true);
  };

  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setHeaderError(null);
      await updateQuotation({
        publicId: quotation.public_id,
        data: {
          customer_name: headerCustomerName.trim(),
          customer_phone: headerCustomerPhone.trim(),
          customer_email: headerCustomerEmail.trim() ? headerCustomerEmail.trim() : null,
          valid_until: headerValidUntil || null,
          notes: headerNotes.trim() ? headerNotes.trim() : null,
          customization_amount: Number(headerCustomization),
          transport_amount: Number(headerTransport),
          installation_amount: Number(headerInstallation),
          discount_amount: Number(headerDiscount),
          tax_amount: Number(headerTax),
        },
      }).unwrap();

      showToast('success', 'Quotation details and charges updated.', 'Updated');
      setIsEditHeaderOpen(false);
    } catch (err: any) {
      setHeaderError(err?.data?.message || 'Failed to update quotation details.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Operational Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/quotations')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="shrink-0"
          >
            Back
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {quotation.quotation_number}
              </h1>
              <QuotationStatusBadge status={quotation.status} />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Issued to <strong className="text-[var(--text-primary)]">{quotation.customer_name}</strong> on{' '}
              {formatDate(quotation.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab Toggle: Manage vs Document Preview */}
          <div className="flex items-center rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'manage'
                  ? 'bg-[var(--brand-accent)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Management
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-[var(--brand-accent)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Document Preview
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsStatusModalOpen(true)}
            leftIcon={<Sliders className="w-4 h-4" />}
          >
            Change Status
          </Button>

          {isDraft && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Render Document Preview Tab if active */}
      {activeTab === 'preview' ? (
        <QuotationPreview quotation={quotation} />
      ) : (
        /* Render Management View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Customer snapshot, Line Items, Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information Snapshot */}
            <Card className="shadow-xs border border-[var(--border-border)]">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border-border)]">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[var(--brand-accent)]" />
                  <CardTitle className="text-base font-semibold">Customer Snapshot</CardTitle>
                </div>

                {!isLocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEditHeader}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Edit Details
                  </Button>
                )}
              </CardHeader>

              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                    Customer Name
                  </span>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {quotation.customer_name}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                    Contact Phone
                  </span>
                  <a
                    href={`tel:${quotation.customer_phone}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {quotation.customer_phone}
                  </a>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                    Email Address
                  </span>
                  {quotation.customer_email ? (
                    <a
                      href={`mailto:${quotation.customer_email}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {quotation.customer_email}
                    </a>
                  ) : (
                    <span className="text-sm text-[var(--text-muted)] italic">
                      No email on snapshot
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                    Commercial Validity
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>
                      {quotation.valid_until ? formatDate(quotation.valid_until) : 'Open Validity'}
                    </span>
                  </div>
                </div>

                {quotation.enquiry && (
                  <div className="sm:col-span-2 pt-2 border-t border-[var(--border-border)] flex items-center justify-between text-xs">
                    <div className="text-[var(--text-secondary)]">
                      Originating Enquiry: <strong>{quotation.enquiry.customer_name}</strong> (#{quotation.enquiry.public_id.slice(0, 8)})
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/enquiries/${quotation.enquiry?.public_id}`)}
                      leftIcon={<ExternalLink className="w-3 h-3" />}
                      className="text-xs text-[var(--brand-accent)]"
                    >
                      View Enquiry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Line Items Management */}
            <Card className="shadow-xs border border-[var(--border-border)]">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border-border)]">
                <div>
                  <CardTitle className="text-base font-semibold">Line Items</CardTitle>
                  <p className="text-xs text-[var(--text-muted)]">
                    {quotation.items.length} item{quotation.items.length === 1 ? '' : 's'} included in commercial calculation.
                  </p>
                </div>

                {!isLocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setItemToEdit(null);
                      setIsItemModalOpen(true);
                    }}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Item
                  </Button>
                )}
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                {isLocked && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      This quotation is in <strong>{quotation.status}</strong> state. Line items and commercial charges are locked against modifications.
                    </span>
                  </div>
                )}

                <div className="overflow-x-auto rounded-lg border border-[var(--border-border)]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Item & Description</th>
                        <th className="py-2.5 px-2 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 text-right">Custom</th>
                        <th className="py-2.5 px-3 text-right">Disc</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                        {!isLocked && <th className="py-2.5 px-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-border)] text-[var(--text-primary)]">
                      {quotation.items.map((item) => (
                        <tr
                          key={item.public_id}
                          className="hover:bg-[var(--surface-muted)]/50 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="font-semibold text-[var(--text-primary)]">
                              {item.description}
                            </div>
                            {item.product && (
                              <div className="text-[10px] text-[var(--text-muted)] font-mono">
                                Product: {item.product.name} ({item.product.product_code || item.product.slug})
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right font-medium">{item.quantity}</td>
                          <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                          <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">
                            {item.customization_amount > 0 ? `+${formatCurrency(item.customization_amount)}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-rose-600">
                            {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[var(--text-primary)]">
                            {formatCurrency(item.line_total)}
                          </td>
                          {!isLocked && (
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemToEdit(item);
                                    setIsItemModalOpen(true);
                                  }}
                                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                                  title="Edit Item"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.public_id)}
                                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--status-error)] hover:bg-red-500/10"
                                  title="Remove Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Commercial Notes Card */}
            <Card className="shadow-xs border border-[var(--border-border)]">
              <CardHeader className="pb-3 border-b border-[var(--border-border)]">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[var(--brand-accent)]" />
                  <CardTitle className="text-base font-semibold">Commercial Notes & Terms</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap bg-[var(--surface-muted)]/50 p-3.5 rounded-lg border border-[var(--border-border)]">
                  {quotation.notes || 'No custom commercial terms or notes specified.'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1 Col): Financial Breakdown & Status History */}
          <div className="space-y-6">
            {/* Financial Recalculation Card */}
            <Card className="shadow-xs border border-[var(--border-border)]">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border-border)]">
                <CardTitle className="text-base font-semibold">Financial Breakdown</CardTitle>
                {!isLocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEditHeader}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Edit Charges
                  </Button>
                )}
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Items Subtotal:</span>
                    <span className="font-mono font-semibold">{formatCurrency(quotation.subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Customization Surcharge:</span>
                    <span className="font-mono">
                      {quotation.customization_amount > 0 ? `+${formatCurrency(quotation.customization_amount)}` : '₹0.00'}
                    </span>
                  </div>

                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Transport / Logistics:</span>
                    <span className="font-mono">
                      {quotation.transport_amount > 0 ? `+${formatCurrency(quotation.transport_amount)}` : '₹0.00'}
                    </span>
                  </div>

                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Installation / Fitting:</span>
                    <span className="font-mono">
                      {quotation.installation_amount > 0 ? `+${formatCurrency(quotation.installation_amount)}` : '₹0.00'}
                    </span>
                  </div>

                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Commercial Discount:</span>
                    <span className="font-mono">
                      {quotation.discount_amount > 0 ? `-${formatCurrency(quotation.discount_amount)}` : '₹0.00'}
                    </span>
                  </div>

                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>GST / Taxes:</span>
                    <span className="font-mono">
                      {quotation.tax_amount > 0 ? `+${formatCurrency(quotation.tax_amount)}` : '₹0.00'}
                    </span>
                  </div>

                  <div className="pt-3 border-t-2 border-[var(--border-border)] flex justify-between items-center text-sm font-bold text-[var(--text-primary)]">
                    <span>Final Amount (INR):</span>
                    <span className="text-xl font-black text-[var(--brand-accent)] font-mono">
                      {formatCurrency(quotation.total_amount)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-border)] text-[11px] text-[var(--text-muted)] space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Calculated by server on {formatDate(quotation.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status History Timeline */}
            <QuotationStatusHistory statusLogs={quotation.status_logs} />
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {isStatusModalOpen && (
        <QuotationStatusModal
          key={`${quotation.public_id}-${quotation.status}`}
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          quotationPublicId={quotation.public_id}
          quotationNumber={quotation.quotation_number}
          currentStatus={quotation.status}
        />
      )}

      {/* Add / Edit Item Modal */}
      {isItemModalOpen && (
        <QuotationItemModal
          key={itemToEdit ? itemToEdit.public_id : 'new-item'}
          isOpen={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false);
            setItemToEdit(null);
          }}
          quotationPublicId={quotation.public_id}
          itemToEdit={itemToEdit}
        />
      )}

      {/* Delete Quotation Dialog */}
      {isDeleteDialogOpen && (
        <QuotationDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setDeleteError(null);
          }}
          quotationNumber={quotation.quotation_number}
          onConfirm={handleDeleteQuotationConfirm}
          isLoading={isDeletingQuotation}
          errorMessage={deleteError}
        />
      )}

      {/* Edit Header & Financial Surcharges Modal */}
      {isEditHeaderOpen && (
        <Modal
          isOpen={isEditHeaderOpen}
          onClose={() => {
            if (!isUpdatingHeader) setIsEditHeaderOpen(false);
          }}
          title="Edit Quotation Header & Surcharges"
          description="Update customer information, validity date, overhead charges, and notes."
          maxWidth="lg"
        >
          <form onSubmit={handleSaveHeader} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="edit-header-name"
                label="Customer Name *"
                value={headerCustomerName}
                onChange={(e) => setHeaderCustomerName(e.target.value)}
                required
              />

              <Input
                id="edit-header-phone"
                label="Customer Phone *"
                value={headerCustomerPhone}
                onChange={(e) => setHeaderCustomerPhone(e.target.value)}
                required
              />

              <Input
                id="edit-header-email"
                label="Customer Email"
                type="email"
                value={headerCustomerEmail}
                onChange={(e) => setHeaderCustomerEmail(e.target.value)}
              />

              <Input
                id="edit-header-valid-until"
                label="Validity (YYYY-MM-DD)"
                type="date"
                value={headerValidUntil}
                onChange={(e) => setHeaderValidUntil(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border-border)]">
              <Input
                id="edit-header-custom"
                label="Customization"
                type="number"
                min="0"
                step="0.01"
                value={headerCustomization}
                onChange={(e) => setHeaderCustomization(Number(e.target.value))}
              />

              <Input
                id="edit-header-transport"
                label="Transport"
                type="number"
                min="0"
                step="0.01"
                value={headerTransport}
                onChange={(e) => setHeaderTransport(Number(e.target.value))}
              />

              <Input
                id="edit-header-install"
                label="Installation"
                type="number"
                min="0"
                step="0.01"
                value={headerInstallation}
                onChange={(e) => setHeaderInstallation(Number(e.target.value))}
              />

              <Input
                id="edit-header-discount"
                label="Discount"
                type="number"
                min="0"
                step="0.01"
                value={headerDiscount}
                onChange={(e) => setHeaderDiscount(Number(e.target.value))}
              />

              <Input
                id="edit-header-tax"
                label="GST / Tax"
                type="number"
                min="0"
                step="0.01"
                value={headerTax}
                onChange={(e) => setHeaderTax(Number(e.target.value))}
              />
            </div>

            <div>
              <label
                htmlFor="edit-header-notes"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1"
              >
                Commercial Notes & Terms
              </label>
              <textarea
                id="edit-header-notes"
                rows={3}
                value={headerNotes}
                onChange={(e) => setHeaderNotes(e.target.value)}
                className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20"
              />
            </div>

            {headerError && (
              <div className="p-3 rounded-lg bg-[var(--status-error)]/10 text-[var(--status-error)] text-xs font-medium border border-[var(--status-error)]/20">
                {headerError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-border)]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditHeaderOpen(false)}
                disabled={isUpdatingHeader}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdatingHeader}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default QuotationDetailPage;
