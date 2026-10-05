import React, { useState } from 'react';
import { Modal, Input, Select, Button } from '../../../components/ui';
import type { CategoryItem, CreateCategoryRequest, UpdateCategoryRequest } from '../../../types/catalog';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCategoryRequest | UpdateCategoryRequest) => Promise<void>;
  category?: CategoryItem | null;
  categoriesList?: CategoryItem[];
  isLoading: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface CategoryFormContentProps {
  onClose: () => void;
  onSubmit: (data: CreateCategoryRequest | UpdateCategoryRequest) => Promise<void>;
  category?: CategoryItem | null;
  categoriesList: CategoryItem[];
  isLoading: boolean;
}

function CategoryFormContent({
  onClose,
  onSubmit,
  category,
  categoriesList,
  isLoading,
}: CategoryFormContentProps) {
  const isEdit = Boolean(category);

  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [parentPublicId, setParentPublicId] = useState<string>(category?.parent?.public_id || '');
  const [description, setDescription] = useState(category?.description || '');
  const [imageUrl, setImageUrl] = useState(category?.image_url || '');
  const [sortOrder, setSortOrder] = useState<number>(category?.sort_order ?? 0);
  const [isActive, setIsActive] = useState<boolean>(category?.is_active ?? true);
  const [seoTitle, setSeoTitle] = useState(category?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(category?.seo_description || '');

  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
    if (formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoSlug(false);
    setSlug(e.target.value);
    if (formErrors.slug) {
      setFormErrors((prev) => ({ ...prev, slug: '' }));
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Category name is required';
    } else if (name.length > 150) {
      errors.name = 'Category name cannot exceed 150 characters';
    }

    if (!slug.trim()) {
      errors.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.slug = 'Slug must only contain lowercase alphanumeric characters and single hyphens';
    } else if (slug.length > 180) {
      errors.slug = 'Slug cannot exceed 180 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateCategoryRequest = {
      name: name.trim(),
      slug: slug.trim(),
      parent_public_id: parentPublicId ? parentPublicId : null,
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      sort_order: Number(sortOrder) || 0,
      is_active: isActive,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
    };

    try {
      await onSubmit(payload);
    } catch {
      // Error handling is handled in the page through toast/form error
    }
  };

  // Filter out the category itself from parent selection to avoid self-parenting
  const validParents = categoriesList.filter((cat) => !category || cat.public_id !== category.public_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Category Name *"
          placeholder="e.g. Stainless Steel Beds"
          value={name}
          onChange={handleNameChange}
          error={formErrors.name}
          disabled={isLoading}
          required
        />

        <Input
          label="URL Slug *"
          placeholder="e.g. stainless-steel-beds"
          value={slug}
          onChange={handleSlugChange}
          error={formErrors.slug}
          helperText="Lowercase letters, numbers, and hyphens"
          disabled={isLoading}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Parent Category"
          value={parentPublicId}
          onChange={(e) => setParentPublicId(e.target.value)}
          disabled={isLoading}
          options={[
            { value: '', label: '— None (Top-Level Category) —' },
            ...validParents.map((cat) => ({
              value: cat.public_id,
              label: cat.parent ? `  ↳ ${cat.name} (Child of ${cat.parent.name})` : cat.name,
            })),
          ]}
          helperText="Create nested category hierarchies"
        />

        <Input
          label="Display Sort Order"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          disabled={isLoading}
          helperText="Lower numbers appear first"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none mb-1.5 block">
          Description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          placeholder="Detailed description of the category..."
          className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Category Image URL"
          placeholder="https://example.com/images/category.webp"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={isLoading}
          helperText="Preview image for client browsing"
        />

        <div className="flex flex-col justify-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2 block">
            Category Status
          </span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-[var(--border-border)] text-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Active (Visible in client navigation)
            </span>
          </label>
        </div>
      </div>

      {imageUrl && (
        <div className="p-3 bg-[var(--surface-muted)] rounded-lg border border-[var(--border-border)] flex items-center gap-3">
          <img
            src={imageUrl}
            alt="Category Preview"
            className="w-12 h-12 rounded object-cover border border-[var(--border-border)]"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="text-xs text-[var(--text-secondary)]">Image preview loaded</span>
        </div>
      )}

      <div className="pt-2 border-t border-[var(--border-border)]">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
          SEO Metadata (Optional)
        </h4>
        <div className="space-y-3">
          <Input
            label="SEO Meta Title"
            placeholder="e.g. Modern Stainless Steel Furniture | SKF"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            disabled={isLoading}
          />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none mb-1 block">
              SEO Meta Description
            </label>
            <textarea
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              disabled={isLoading}
              placeholder="Brief meta description for search engine listings..."
              className="w-full text-sm rounded-md border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] p-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-border)]">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  categoriesList = [],
  isLoading,
}: CategoryFormModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? `Edit Category: ${category.name}` : 'Create New Category'}
      description="Define the category taxonomy, hierarchy, and presentation for SKF furniture items."
      maxWidth="2xl"
    >
      <CategoryFormContent
        key={category?.public_id || 'new'}
        onClose={onClose}
        onSubmit={onSubmit}
        category={category}
        categoriesList={categoriesList}
        isLoading={isLoading}
      />
    </Modal>
  );
}

export default CategoryFormModal;
