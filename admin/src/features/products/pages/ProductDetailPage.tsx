import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Package,
  Layers,
  Image as ImageIcon,
  Sliders,
  CheckCircle2,
  Archive,
  Trash2,
} from 'lucide-react';
import {
  useGetProductByPublicIdQuery,
  useGetCategoriesQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  usePublishProductMutation,
  useArchiveProductMutation,
} from '../../../app/store/api';
import type { UpdateProductRequest } from '../../../types/catalog';
import {
  Button,
  Badge,
  Card,
  useToast,
  LoadingState,
  ErrorState,
} from '../../../components/ui';
import ProductForm from '../components/ProductForm';
import ProductImageGallery from '../components/media/ProductImageGallery';
import ProductVideoSection from '../components/media/ProductVideoSection';
import ProductSpecsSection from '../components/media/ProductSpecsSection';
import ProductDeleteDialog from '../components/ProductDeleteDialog';

type TabKey = 'details' | 'media' | 'specs';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Queries
  const {
    data: productResponse,
    isLoading: isLoadingProduct,
    isError: isProductError,
    error: productError,
    refetch,
  } = useGetProductByPublicIdQuery(id || '', { skip: !id });

  const { data: categoriesResponse } = useGetCategoriesQuery({ limit: 100 });
  const categories = categoriesResponse?.data?.items || [];

  // Mutations
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [publishProduct, { isLoading: isPublishing }] = usePublishProductMutation();
  const [archiveProduct, { isLoading: isArchiving }] = useArchiveProductMutation();

  const product = productResponse?.data?.product;

  const handleUpdate = async (data: UpdateProductRequest) => {
    if (!id) return;
    try {
      await updateProduct({
        publicId: id,
        data,
      }).unwrap();
      showToast('success', 'Product details updated successfully.', 'Updated');
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to update product.', 'Error');
      throw err;
    }
  };

  const handleTogglePublish = async () => {
    if (!id || !product) return;
    try {
      if (product.status === 'published') {
        await archiveProduct(id).unwrap();
        showToast('info', 'Product moved to archived status.', 'Archived');
      } else {
        await publishProduct(id).unwrap();
        showToast('success', 'Product published to customer storefront.', 'Published');
      }
      refetch();
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to change status.', 'Error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    try {
      await deleteProduct(id).unwrap();
      showToast('success', 'Product permanently deleted.', 'Deleted');
      setIsDeleteDialogOpen(false);
      navigate('/admin/products');
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to delete product.';
      setDeleteErrorMessage(msg);
      showToast('error', msg, 'Delete Failed');
    }
  };

  if (isLoadingProduct) {
    return (
      <Card className="p-12">
        <LoadingState message="Loading product data..." />
      </Card>
    );
  }

  if (isProductError || !product) {
    return (
      <Card className="p-8">
        <ErrorState
          title="Product not found"
          message={(productError as any)?.data?.message || 'The requested product could not be located.'}
          retryText="Try Again"
          onRetry={() => refetch()}
        />
        <div className="flex justify-center mt-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/products')}>
            Back to Product Catalog
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header / Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[var(--border-border)]">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Product Catalog
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {product.name}
            </h1>
            <Badge
              variant={
                product.status === 'published'
                  ? 'success'
                  : product.status === 'archived'
                    ? 'warning'
                    : 'default'
              }
              size="sm"
              className="capitalize"
            >
              {product.status}
            </Badge>

            <span className="font-mono text-xs text-[var(--text-muted)] bg-[var(--surface-muted)] px-2 py-0.5 rounded border border-[var(--border-border)]">
              {product.product_code}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mt-1.5">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Category: {product.category?.name || 'Unassigned'}
            </span>
            <span>•</span>
            <span className="font-mono">/{product.slug}</span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={product.status === 'published' ? 'outline' : 'primary'}
            size="sm"
            onClick={handleTogglePublish}
            disabled={isPublishing || isArchiving}
            leftIcon={
              product.status === 'published' ? (
                <Archive className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )
            }
          >
            {product.status === 'published' ? 'Archive Product' : 'Publish to Storefront'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDeleteErrorMessage(null);
              setIsDeleteDialogOpen(true);
            }}
            className="text-[var(--status-error)] hover:bg-red-500/10 border-red-500/20"
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border-border)]">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-[var(--brand-accent)] text-[var(--brand-accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Package className="w-4 h-4" />
          Product Details & Edit
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'media'
              ? 'border-[var(--brand-accent)] text-[var(--brand-accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Gallery & Videos ({product.images?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('specs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'specs'
              ? 'border-[var(--brand-accent)] text-[var(--brand-accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Specifications ({product.specs?.length || 0})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'details' && (
        <ProductForm
          key={product.public_id}
          initialData={product}
          categories={categories}
          onSubmit={handleUpdate}
          isLoading={isUpdating}
          submitLabel="Save Changes"
          onCancel={() => navigate('/admin/products')}
        />
      )}

      {activeTab === 'media' && (
        <div className="space-y-8">
          <ProductImageGallery
            productPublicId={product.public_id}
            images={product.images || []}
          />

          <div className="pt-6 border-t border-[var(--border-border)]">
            <ProductVideoSection productPublicId={product.public_id} />
          </div>
        </div>
      )}

      {activeTab === 'specs' && (
        <ProductSpecsSection productPublicId={product.public_id} />
      )}

      {/* Delete Dialog */}
      <ProductDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteErrorMessage(null);
        }}
        onConfirm={handleConfirmDelete}
        product={product}
        isLoading={isDeleting}
        errorMessage={deleteErrorMessage}
      />
    </div>
  );
}

export default ProductDetailPage;
