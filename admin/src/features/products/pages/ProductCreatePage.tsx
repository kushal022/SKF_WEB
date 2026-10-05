import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import {
  useCreateProductMutation,
  useGetCategoriesQuery,
} from '../../../app/store/api';
import type { CreateProductRequest, UpdateProductRequest } from '../../../types/catalog';
import { Button, useToast, Card, LoadingState } from '../../../components/ui';
import ProductForm from '../components/ProductForm';

export function ProductCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: categoriesResponse, isLoading: isLoadingCategories } = useGetCategoriesQuery({
    limit: 100,
    is_active: true,
  });
  const categories = categoriesResponse?.data?.items || [];

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();

  const handleSubmit = async (data: CreateProductRequest | UpdateProductRequest) => {
    try {
      const response = await createProduct(data as CreateProductRequest).unwrap();
      const newProduct = response.data?.product;
      showToast(
        'success',
        `Product "${data.name}" created successfully. You can now attach images and specs.`,
        'Product Created'
      );

      if (newProduct?.public_id) {
        navigate(`/admin/products/${newProduct.public_id}`);
      } else {
        navigate('/admin/products');
      }
    } catch (err: any) {
      showToast(
        'error',
        err?.data?.message || err?.message || 'Failed to create product.',
        'Creation Failed'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-border)]">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Product Catalog
          </button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Create Furniture Product
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Register a new stainless steel furniture model, pricing configuration, and taxonomy.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/products')}
        >
          Cancel
        </Button>
      </div>

      {isLoadingCategories ? (
        <Card className="p-12">
          <LoadingState message="Loading catalog categories..." />
        </Card>
      ) : (
        <ProductForm
          categories={categories}
          onSubmit={handleSubmit}
          isLoading={isCreating}
          submitLabel="Create Product & Proceed to Media"
          onCancel={() => navigate('/admin/products')}
        />
      )}
    </div>
  );
}

export default ProductCreatePage;
