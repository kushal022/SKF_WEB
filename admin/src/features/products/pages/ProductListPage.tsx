import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  Archive,
  RefreshCw,
} from 'lucide-react';
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useDeleteProductMutation,
  usePublishProductMutation,
  useArchiveProductMutation,
} from '../../../app/store/api';
import type { ProductListItem } from '../../../types/catalog';
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  useToast,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../../components/ui';
import ProductDeleteDialog from '../components/ProductDeleteDialog';

export function ProductListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [customizableFilter, setCustomizableFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('-created_at');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductListItem | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Categories for filter dropdown
  const { data: categoriesResponse } = useGetCategoriesQuery({ limit: 100 });
  const categories = categoriesResponse?.data?.items || [];

  // Query Params
  const queryParams = useMemo(() => {
    const params: {
      search?: string;
      category_public_id?: string;
      status?: 'draft' | 'published' | 'archived';
      featured?: boolean;
      customizable?: boolean;
      sort?: 'name' | 'created_at' | 'status' | '-name' | '-created_at' | '-status';
      page?: number;
      limit?: number;
    } = {
      page,
      limit,
    };

    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    if (categoryFilter !== 'all' && categoryFilter) {
      params.category_public_id = categoryFilter;
    }
    if (statusFilter !== 'all' && statusFilter) {
      params.status = statusFilter as any;
    }
    if (featuredFilter === 'featured') {
      params.featured = true;
    }
    if (customizableFilter === 'customizable') {
      params.customizable = true;
    }
    if (sortField) {
      params.sort = sortField as any;
    }

    return params;
  }, [searchTerm, categoryFilter, statusFilter, featuredFilter, customizableFilter, sortField, page, limit]);

  // Queries & Mutations
  const {
    data: productsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetProductsQuery(queryParams);

  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [publishProduct] = usePublishProductMutation();
  const [archiveProduct] = useArchiveProductMutation();

  const products = productsResponse?.data?.items || [];
  const pagination = productsResponse?.data?.pagination || {
    total: productsResponse?.data?.total ?? products.length,
    totalPages: productsResponse?.data?.totalPages ?? 1,
    page,
    limit,
  };

  const handleOpenDelete = (product: ProductListItem) => {
    setProductToDelete(product);
    setDeleteErrorMessage(null);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.public_id).unwrap();
      showToast('success', `Product "${productToDelete.name}" deleted.`, 'Deleted');
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to delete product.';
      setDeleteErrorMessage(msg);
      showToast('error', msg, 'Delete Failed');
    }
  };

  const handleTogglePublish = async (product: ProductListItem) => {
    try {
      if (product.status === 'published') {
        await archiveProduct(product.public_id).unwrap();
        showToast('info', `Product "${product.name}" moved to archive.`, 'Archived');
      } else {
        await publishProduct(product.public_id).unwrap();
        showToast('success', `Product "${product.name}" published to catalog.`, 'Published');
      }
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to update publication status.', 'Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border-border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Product Catalog
            </h1>
            <Badge variant="default" size="sm">
              {pagination?.total ?? 0} Products
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Browse, manage, and configure stainless steel furniture models, pricing, and variants.
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
            onClick={() => navigate('/admin/products/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-[var(--surface-surface)] border-[var(--border-border)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Search */}
          <div className="sm:col-span-2">
            <Input
              placeholder="Search by name, SKU, or material..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map((c) => ({
                value: c.public_id,
                label: c.parent ? `↳ ${c.name}` : c.name,
              })),
            ]}
          />

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Drafts' },
              { value: 'published', label: 'Published' },
              { value: 'archived', label: 'Archived' },
            ]}
          />

          {/* Featured Filter */}
          <Select
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Featured: All' },
              { value: 'featured', label: 'Featured Only' },
            ]}
          />

          {/* Customizable Filter */}
          <Select
            value={customizableFilter}
            onChange={(e) => {
              setCustomizableFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Custom: All' },
              { value: 'customizable', label: 'Customizable Only' },
            ]}
          />

          {/* Sort Filter */}
          <Select
            value={sortField}
            onChange={(e) => {
              setSortField(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '-created_at', label: 'Newest First' },
              { value: 'created_at', label: 'Oldest First' },
              { value: 'name', label: 'Name (A-Z)' },
              { value: '-name', label: 'Name (Z-A)' },
              { value: 'status', label: 'Status' },
            ]}
          />
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <Card className="p-12">
          <LoadingState message="Loading SKF product catalog..." />
        </Card>
      ) : isError ? (
        <Card className="p-8">
          <ErrorState
            title="Failed to load products"
            message={(error as any)?.data?.message || 'Could not connect to product catalog service.'}
            onRetry={() => refetch()}
          />
        </Card>
      ) : products.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No products found"
            description={
              searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters or search keywords to locate products.'
                : 'No products in the catalog yet. Click below to create your first furniture item.'
            }
            actionText="Create Product"
            onAction={() => navigate('/admin/products/new')}
            icon={<Package className="w-8 h-8" />}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Responsive Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)] shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Code / SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Material & Finish</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Badges</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-border)] text-[var(--text-primary)]">
                {products.map((p) => {
                  return (
                    <tr
                      key={p.public_id}
                      className="hover:bg-[var(--surface-muted)]/50 transition-colors"
                    >
                      {/* Product Name & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.primary_image ? (
                            <img
                              src={p.primary_image.image_url}
                              alt={p.primary_image.alt_text || p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-[var(--border-border)] shrink-0 bg-[var(--surface-muted)]"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-border)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}

                          <div>
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/products/${p.public_id}`)}
                              className="font-medium text-[var(--text-primary)] hover:text-[var(--brand-accent)] text-left hover:underline line-clamp-1"
                            >
                              {p.name}
                            </button>
                            <span className="font-mono text-[11px] text-[var(--text-muted)] block">
                              /{p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Product Code */}
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-[var(--text-secondary)]">
                        {p.product_code}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        {p.category ? (
                          <Badge variant="default" size="sm" className="bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                            {p.category.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Material & Finish */}
                      <td className="py-3 px-4 text-xs text-[var(--text-secondary)]">
                        <div>{p.material || 'Standard SS'}</div>
                        {p.finish && (
                          <div className="text-[11px] text-[var(--text-muted)] line-clamp-1">{p.finish}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            p.status === 'published'
                              ? 'success'
                              : p.status === 'archived'
                                ? 'warning'
                                : 'default'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {p.status}
                        </Badge>
                      </td>

                      {/* Badges (Featured / Customizable) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {p.featured && (
                            <span
                              className="inline-flex p-1 rounded-full bg-amber-500/10 text-amber-500"
                              title="Featured on Homepage"
                              aria-label="Featured on Homepage"
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </span>
                          )}
                          {p.customizable && (
                            <Badge variant="outline" size="sm" className="text-[10px] py-0 px-1.5">
                              Custom
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(p)}
                            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors"
                            title={p.status === 'published' ? 'Archive Product' : 'Publish Product'}
                            aria-label={p.status === 'published' ? 'Archive Product' : 'Publish Product'}
                          >
                            {p.status === 'published' ? (
                              <Archive className="w-4 h-4 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/admin/products/${p.public_id}`)}
                            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors"
                            title="Edit & Manage Product"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(p)}
                            className="p-1.5 rounded-md text-[var(--status-error)] hover:bg-red-500/10 transition-colors"
                            title="Delete Product"
                            aria-label={`Delete ${p.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)]">
              <div className="text-xs text-[var(--text-secondary)]">
                Showing{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  {(page - 1) * limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  {Math.min(page * limit, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  {pagination.total}
                </span>{' '}
                products
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                >
                  Previous
                </Button>

                <span className="text-xs px-2 text-[var(--text-secondary)]">
                  Page {page} of {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages || isFetching}
                >
                  Next
                </Button>

                <Select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  options={[
                    { value: 10, label: '10 / page' },
                    { value: 20, label: '20 / page' },
                    { value: 50, label: '50 / page' },
                  ]}
                  className="w-28 text-xs py-1"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Delete Dialog */}
      <ProductDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setProductToDelete(null);
          setDeleteErrorMessage(null);
        }}
        onConfirm={handleConfirmDelete}
        product={productToDelete}
        isLoading={isDeleting}
        errorMessage={deleteErrorMessage}
      />
    </div>
  );
}

export default ProductListPage;
