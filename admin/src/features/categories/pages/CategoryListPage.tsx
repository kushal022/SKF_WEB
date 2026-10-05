import { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  CornerDownRight,
  RefreshCw,
  FolderTree,
} from 'lucide-react';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../../app/store/api';
import type {
  CategoryItem,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../../types/catalog';
import { Button, Input, Select, Badge, Card, useToast, LoadingState, EmptyState, ErrorState } from '../../../components/ui';
import CategoryFormModal from '../components/CategoryFormModal';
import CategoryDeleteDialog from '../components/CategoryDeleteDialog';

export function CategoryListPage() {
  const { showToast } = useToast();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [parentFilter, setParentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('sort_order');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Build Query Params for API
  const queryParams = useMemo(() => {
    const params: {
      search?: string;
      parent_public_id?: string | null;
      is_active?: boolean;
      sort?: 'sort_order' | 'name' | 'created_at' | '-sort_order' | '-name' | '-created_at';
      page?: number;
      limit?: number;
    } = {
      page,
      limit,
    };

    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    if (parentFilter === 'top_level') {
      params.parent_public_id = null;
    } else if (parentFilter !== 'all' && parentFilter) {
      params.parent_public_id = parentFilter;
    }

    if (statusFilter === 'active') {
      params.is_active = true;
    } else if (statusFilter === 'inactive') {
      params.is_active = false;
    }

    if (sortField) {
      params.sort = sortField as any;
    }

    return params;
  }, [searchTerm, parentFilter, statusFilter, sortField, page, limit]);

  // Fetch Categories
  const {
    data: categoriesResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetCategoriesQuery(queryParams);

  // Also fetch full list without parent filter for parent dropdown selection
  const { data: allCategoriesResponse } = useGetCategoriesQuery({ limit: 100 });

  const categories = categoriesResponse?.data?.items || [];
  const pagination = categoriesResponse?.data?.pagination || {
    total: categoriesResponse?.data?.total ?? categories.length,
    totalPages: categoriesResponse?.data?.totalPages ?? 1,
    page,
    limit,
  };
  const allCategories = allCategoriesResponse?.data?.items || [];

  // Mutations
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: CategoryItem) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: CreateCategoryRequest | UpdateCategoryRequest) => {
    try {
      if (editingCategory) {
        await updateCategory({
          publicId: editingCategory.public_id,
          data: data as UpdateCategoryRequest,
        }).unwrap();
        showToast('success', `Category "${data.name}" updated successfully.`, 'Updated');
      } else {
        await createCategory(data as CreateCategoryRequest).unwrap();
        showToast('success', `Category "${data.name}" created successfully.`, 'Created');
      }
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to save category.';
      showToast('error', msg, 'Error');
      throw err;
    }
  };

  const handleOpenDelete = (category: CategoryItem) => {
    setCategoryToDelete(category);
    setDeleteErrorMessage(null);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.public_id).unwrap();
      showToast('success', `Category "${categoryToDelete.name}" deleted.`, 'Deleted');
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      setDeleteErrorMessage(null);
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to delete category.';
      setDeleteErrorMessage(msg);
      showToast('error', msg, 'Delete Failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border-border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Categories Management
            </h1>
            <Badge variant="default" size="sm">
              {pagination?.total ?? 0} Categories
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Organize SKF furniture into hierarchical taxonomy structures, parent-child groups, and URL slugs.
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
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Category
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-[var(--surface-surface)] border-[var(--border-border)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <Input
            placeholder="Search by name or slug..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />

          {/* Parent Category Filter */}
          <Select
            value={parentFilter}
            onChange={(e) => {
              setParentFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Parent: All Categories' },
              { value: 'top_level', label: 'Parent: Top-Level Only' },
              ...allCategories
                .filter((c) => !c.parent)
                .map((c) => ({
                  value: c.public_id,
                  label: `Parent: ${c.name}`,
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
              { value: 'all', label: 'Status: All' },
              { value: 'active', label: 'Status: Active Only' },
              { value: 'inactive', label: 'Status: Inactive Only' },
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
              { value: 'sort_order', label: 'Sort: Display Order' },
              { value: 'name', label: 'Sort: Name (A-Z)' },
              { value: '-name', label: 'Sort: Name (Z-A)' },
              { value: '-created_at', label: 'Sort: Newest First' },
              { value: 'created_at', label: 'Sort: Oldest First' },
            ]}
          />
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <Card className="p-12">
          <LoadingState message="Loading furniture categories..." />
        </Card>
      ) : isError ? (
        <Card className="p-8">
          <ErrorState
            title="Failed to load categories"
            message={(error as any)?.data?.message || 'Could not connect to category service.'}
            onRetry={() => refetch()}
          />
        </Card>
      ) : categories.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No categories found"
            description={
              searchTerm || parentFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or filters to locate categories.'
                : 'No furniture categories exist yet. Click below to add your first category.'
            }
            actionText="Create Category"
            onAction={handleOpenCreate}
            icon={<FolderTree className="w-8 h-8" />}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Responsive Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)] shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Parent Category</th>
                  <th className="py-3 px-4 text-center">Sort Order</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-border)] text-[var(--text-primary)]">
                {categories.map((cat) => {
                  const isChild = Boolean(cat.parent);

                  return (
                    <tr
                      key={cat.public_id}
                      className="hover:bg-[var(--surface-muted)]/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {cat.image_url ? (
                            <img
                              src={cat.image_url}
                              alt={cat.name}
                              className="w-9 h-9 rounded-md object-cover border border-[var(--border-border)] shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-md bg-[var(--surface-muted)] border border-[var(--border-border)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                              <Layers className="w-4 h-4" />
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                              {isChild && (
                                <CornerDownRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              )}
                              <span>{cat.name}</span>
                              {cat.children && cat.children.length > 0 && (
                                <Badge variant="outline" size="sm" className="text-[10px] ml-1">
                                  {cat.children.length} sub
                                </Badge>
                              )}
                            </div>
                            {cat.description && (
                              <p className="text-xs text-[var(--text-secondary)] line-clamp-1 max-w-xs mt-0.5">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-[var(--text-secondary)]">
                        {cat.slug}
                      </td>

                      <td className="py-3.5 px-4">
                        {cat.parent ? (
                          <Badge variant="default" size="sm" className="bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                            {cat.parent.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] italic">
                            Top-Level
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        {cat.sort_order}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={cat.is_active ? 'success' : 'default'}
                          size="sm"
                        >
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors"
                            aria-label={`Edit ${cat.name}`}
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(cat)}
                            className="p-1.5 rounded-md text-[var(--status-error)] hover:bg-red-500/10 transition-colors"
                            aria-label={`Delete ${cat.name}`}
                            title="Delete Category"
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
                categories
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

      {/* Category Create/Edit Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleFormSubmit}
        category={editingCategory}
        categoriesList={allCategories}
        isLoading={isCreating || isUpdating}
      />

      {/* Category Delete Confirmation Dialog */}
      <CategoryDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setCategoryToDelete(null);
          setDeleteErrorMessage(null);
        }}
        onConfirm={handleConfirmDelete}
        category={categoryToDelete}
        isLoading={isDeleting}
        errorMessage={deleteErrorMessage}
      />
    </div>
  );
}

export default CategoryListPage;
