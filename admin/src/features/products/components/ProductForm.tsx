import React, { useState } from 'react';
import { Button, Input, Select, Card } from '../../../components/ui';
import type {
  ProductDetail,
  CategoryItem,
  CreateProductRequest,
  UpdateProductRequest,
} from '../../../types/catalog';
import { Package, FileText, Settings, Sparkles, Globe } from 'lucide-react';

interface ProductFormProps {
  initialData?: ProductDetail | null;
  categories: CategoryItem[];
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ProductForm({
  initialData,
  categories,
  onSubmit,
  isLoading,
  submitLabel,
  onCancel,
}: ProductFormProps) {
  const isEdit = Boolean(initialData);

  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [productCode, setProductCode] = useState(initialData?.product_code || '');
  const [categoryPublicId, setCategoryPublicId] = useState(
    initialData?.category?.public_id || ''
  );
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(
    initialData?.status || 'draft'
  );

  const [shortDescription, setShortDescription] = useState(
    initialData?.short_description || ''
  );
  const [description, setDescription] = useState(initialData?.description || '');

  const [material, setMaterial] = useState(initialData?.material || '');
  const [finish, setFinish] = useState(initialData?.finish || '');
  const [color, setColor] = useState(initialData?.color || '');

  // Sizes & Features as string arrays
  const initialSizes = Array.isArray(initialData?.sizes)
    ? (initialData.sizes as string[]).join(', ')
    : typeof initialData?.sizes === 'string'
      ? initialData.sizes
      : '';
  const [sizesInput, setSizesInput] = useState(initialSizes);

  const initialFeatures = Array.isArray(initialData?.features)
    ? (initialData.features as string[]).join('\n')
    : typeof initialData?.features === 'string'
      ? initialData.features
      : '';
  const [featuresInput, setFeaturesInput] = useState(initialFeatures);

  const [customizable, setCustomizable] = useState(initialData?.customizable ?? false);
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [arEnabled, setArEnabled] = useState(initialData?.ar_enabled ?? false);
  const [model3dUrl, setModel3dUrl] = useState(initialData?.model_3d_url || '');

  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description || '');

  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoSlug(false);
    setSlug(e.target.value);
    if (errors.slug) {
      setErrors((prev) => ({ ...prev, slug: '' }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Product name is required';
    } else if (name.length > 200) {
      errs.name = 'Product name cannot exceed 200 characters';
    }

    if (!productCode.trim()) {
      errs.productCode = 'Product code is required (e.g. SKF-BED-001)';
    } else if (productCode.length > 100) {
      errs.productCode = 'Product code cannot exceed 100 characters';
    }

    if (!slug.trim()) {
      errs.slug = 'Product slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errs.slug = 'Slug must only contain lowercase alphanumeric characters and single hyphens';
    } else if (slug.length > 220) {
      errs.slug = 'Product slug cannot exceed 220 characters';
    }

    if (!categoryPublicId) {
      errs.category = 'A valid category must be selected';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Parse sizes from comma-separated string
    const parsedSizes = sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Parse features from newline or comma-separated string
    const parsedFeatures = featuresInput
      .split('\n')
      .flatMap((f) => f.split(','))
      .map((f) => f.trim())
      .filter(Boolean);

    const payload: CreateProductRequest = {
      name: name.trim(),
      slug: slug.trim(),
      product_code: productCode.trim().toUpperCase(),
      category_public_id: categoryPublicId,
      status,
      short_description: shortDescription.trim() || null,
      description: description.trim() || null,
      material: material.trim() || null,
      finish: finish.trim() || null,
      color: color.trim() || null,
      sizes: parsedSizes.length > 0 ? parsedSizes : null,
      features: parsedFeatures.length > 0 ? parsedFeatures : null,
      customizable,
      featured,
      ar_enabled: arEnabled,
      model_3d_url: model3dUrl.trim() || null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Basic Information */}
      <Card className="p-6 bg-[var(--surface-surface)] border-[var(--border-border)]">
        <div className="flex items-center gap-2 pb-3 mb-5 border-b border-[var(--border-border)]">
          <Package className="w-5 h-5 text-[var(--brand-accent)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Basic Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Name *"
            placeholder="e.g. Royal Stainless Steel King Bed"
            value={name}
            onChange={handleNameChange}
            error={errors.name}
            disabled={isLoading}
            required
          />

          <Input
            label="Product Code / SKU *"
            placeholder="e.g. SKF-BED-001"
            value={productCode}
            onChange={(e) => {
              setProductCode(e.target.value.toUpperCase());
              if (errors.productCode) setErrors((prev) => ({ ...prev, productCode: '' }));
            }}
            error={errors.productCode}
            helperText="Unique uppercase catalog identifier"
            disabled={isLoading}
            required
          />

          <Select
            label="Category *"
            value={categoryPublicId}
            onChange={(e) => {
              setCategoryPublicId(e.target.value);
              if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
            }}
            error={errors.category}
            disabled={isLoading}
            options={[
              { value: '', label: '— Select Category —' },
              ...categories.map((cat) => ({
                value: cat.public_id,
                label: cat.parent ? `  ↳ ${cat.name} (${cat.parent.name})` : cat.name,
              })),
            ]}
            required
          />

          <Input
            label="URL Slug *"
            placeholder="e.g. royal-stainless-steel-king-bed"
            value={slug}
            onChange={handleSlugChange}
            error={errors.slug}
            helperText="URL-friendly identifier"
            disabled={isLoading}
            required
          />

          <Select
            label="Publication Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            disabled={isLoading}
            options={[
              { value: 'draft', label: 'Draft (Hidden from storefront)' },
              { value: 'published', label: 'Published (Active in catalog)' },
              { value: 'archived', label: 'Archived (Discontinued item)' },
            ]}
          />
        </div>
      </Card>

      {/* 2. Descriptions */}
      <Card className="p-6 bg-[var(--surface-surface)] border-[var(--border-border)]">
        <div className="flex items-center gap-2 pb-3 mb-5 border-b border-[var(--border-border)]">
          <FileText className="w-5 h-5 text-[var(--brand-accent)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Descriptions
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none mb-1.5 block">
              Short Summary Description (Max 500 characters)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              disabled={isLoading}
              placeholder="A brief punchy overview displayed in product cards and quotation line items..."
              className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none mb-1.5 block">
              Full Product Description
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder="In-depth specifications, structural engineering details, craftsmanship, maintenance guidelines..."
              className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)]"
            />
          </div>
        </div>
      </Card>

      {/* 3. Product Attributes & Details */}
      <Card className="p-6 bg-[var(--surface-surface)] border-[var(--border-border)]">
        <div className="flex items-center gap-2 pb-3 mb-5 border-b border-[var(--border-border)]">
          <Settings className="w-5 h-5 text-[var(--brand-accent)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Attributes & Specifications
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Input
            label="Material Grade"
            placeholder="e.g. SS 304 Grade Stainless Steel"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            disabled={isLoading}
          />

          <Input
            label="Surface Finish"
            placeholder="e.g. Rose Gold PVD Mirror Polish"
            value={finish}
            onChange={(e) => setFinish(e.target.value)}
            disabled={isLoading}
          />

          <Input
            label="Color Option"
            placeholder="e.g. Rose Gold / Champagne Gold"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none mb-1.5 block">
              Standard Sizes Available
            </label>
            <Input
              placeholder="e.g. King (78x72 in), Queen (78x60 in), Single"
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
              disabled={isLoading}
              helperText="Separate multiple sizes with commas"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none mb-1.5 block">
              Key Features
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Heavy-duty 500kg load capacity, Anti-corrosion PVD coating, Precision laser-cut"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              disabled={isLoading}
              className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)]"
            />
            <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
              Enter one feature per line or separated by commas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-4 border-t border-[var(--border-border)]">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={customizable}
              onChange={(e) => setCustomizable(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-[var(--border-border)] text-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Customizable (Bespoke dimensions)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-[var(--border-border)] text-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Featured on Homepage
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={arEnabled}
              onChange={(e) => setArEnabled(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-[var(--border-border)] text-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              AR 3D Experience Enabled
            </span>
          </label>
        </div>
      </Card>

      {/* 4. Marketing & 3D / SEO */}
      <Card className="p-6 bg-[var(--surface-surface)] border-[var(--border-border)]">
        <div className="flex items-center gap-2 pb-3 mb-5 border-b border-[var(--border-border)]">
          <Globe className="w-5 h-5 text-[var(--brand-accent)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Marketing & Search Optimization
          </h2>
        </div>

        <div className="space-y-4">
          <Input
            label="3D Model Asset URL (.glb / .gltf)"
            placeholder="https://models.skffurniture.com/bed-rose-gold.glb"
            value={model3dUrl}
            onChange={(e) => setModel3dUrl(e.target.value)}
            disabled={isLoading}
            helperText="Used for interactive 3D web viewer and mobile Augmented Reality"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SEO Title Tag"
              placeholder="e.g. Royal Stainless Steel Bed | SKF Luxury Furniture"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              disabled={isLoading}
            />

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none mb-1.5 block">
                SEO Meta Description
              </label>
              <textarea
                rows={2}
                placeholder="High-converting search engine description..."
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                disabled={isLoading}
                className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)]"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Form Action Controls */}
      <div className="flex items-center justify-end gap-3 py-4 border-t border-[var(--border-border)]">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          {isLoading
            ? 'Saving Product...'
            : submitLabel || (isEdit ? 'Save Changes' : 'Create Product')}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
