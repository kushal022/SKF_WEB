import React, { useState } from 'react';
import { Sliders, Plus, Edit2, Trash2 } from 'lucide-react';
import {
  useGetProductSpecsQuery,
  useAddProductSpecMutation,
  useUpdateProductSpecMutation,
  useDeleteProductSpecMutation,
} from '../../../../app/store/api';
import type { ProductSpecItem, CreateSpecRequest, UpdateSpecRequest } from '../../../../types/catalog';
import { Button, Input, Modal, useToast, Card, EmptyState, LoadingState } from '../../../../components/ui';

interface ProductSpecsSectionProps {
  productPublicId: string;
}

export function ProductSpecsSection({ productPublicId }: ProductSpecsSectionProps) {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<ProductSpecItem | null>(null);

  // Form State
  const [specName, setSpecName] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [formError, setFormError] = useState<Record<string, string>>({});

  // Query & Mutations
  const { data: specsResponse, isLoading, refetch } = useGetProductSpecsQuery(productPublicId);
  const [addSpec, { isLoading: isAdding }] = useAddProductSpecMutation();
  const [updateSpec, { isLoading: isUpdating }] = useUpdateProductSpecMutation();
  const [deleteSpec, { isLoading: isDeleting }] = useDeleteProductSpecMutation();

  const specs = specsResponse?.data?.specs || [];

  const handleOpenAdd = () => {
    setEditingSpec(null);
    setSpecName('');
    setSpecValue('');
    setSortOrder(specs.length * 10);
    setFormError({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (spec: ProductSpecItem) => {
    setEditingSpec(spec);
    setSpecName(spec.spec_name);
    setSpecValue(spec.spec_value);
    setSortOrder(spec.sort_order);
    setFormError({});
    setIsModalOpen(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!specName.trim()) errs.name = 'Specification Name is required';
    if (!specValue.trim()) errs.value = 'Specification Value is required';
    setFormError(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (editingSpec) {
        const payload: UpdateSpecRequest = {
          spec_name: specName.trim(),
          spec_value: specValue.trim(),
          sort_order: Number(sortOrder) || 0,
        };
        await updateSpec({
          productPublicId,
          specPublicId: editingSpec.public_id,
          data: payload,
        }).unwrap();
        showToast('success', 'Specification updated.', 'Updated');
      } else {
        const payload: CreateSpecRequest = {
          spec_name: specName.trim(),
          spec_value: specValue.trim(),
          sort_order: Number(sortOrder) || 0,
        };
        await addSpec({
          productPublicId,
          data: payload,
        }).unwrap();
        showToast('success', 'Specification added.', 'Added');
      }
      setIsModalOpen(false);
      setEditingSpec(null);
      refetch();
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to save specification.', 'Error');
    }
  };

  const handleDelete = async (specPublicId: string) => {
    try {
      await deleteSpec({
        productPublicId,
        specPublicId,
      }).unwrap();
      showToast('success', 'Specification deleted.', 'Deleted');
      refetch();
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to delete specification.', 'Error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Technical Specifications ({specs.length})
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Key-value engineering specifications (e.g. Dimensions, Load capacity, Steel gauge, Warranty).
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Specification
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-8">
          <LoadingState message="Loading specifications..." />
        </Card>
      ) : specs.length === 0 ? (
        <Card className="p-8 border-dashed">
          <EmptyState
            title="No specifications defined"
            description="Add technical attributes like Frame Gauge, Joint Welding Type, or Warranty Period."
            actionText="Add Specification"
            onAction={handleOpenAdd}
            icon={<Sliders className="w-8 h-8" />}
          />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border-border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Specification Parameter</th>
                <th className="py-3 px-4">Value / Engineering Metric</th>
                <th className="py-3 px-4 text-center">Sort Order</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-border)] text-[var(--text-primary)]">
              {specs.map((spec) => (
                <tr
                  key={spec.public_id}
                  className="hover:bg-[var(--surface-muted)]/50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                    {spec.spec_name}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">
                    {spec.spec_value}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs">
                    {spec.sort_order}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(spec)}
                        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors"
                        title="Edit Specification"
                        aria-label={`Edit ${spec.spec_name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(spec.public_id)}
                        className="p-1.5 rounded-md text-[var(--status-error)] hover:bg-red-500/10 transition-colors"
                        title="Delete Specification"
                        aria-label={`Delete ${spec.spec_name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Spec Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSpec ? 'Edit Technical Specification' : 'Add Technical Specification'}
        description="Provide a spec name (e.g. Frame Grade) and spec value (e.g. SS 304)."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Specification Parameter Name *"
            placeholder="e.g. Frame Steel Grade, Tube Thickness, Warranty"
            value={specName}
            onChange={(e) => {
              setSpecName(e.target.value);
              if (formError.name) setFormError((prev) => ({ ...prev, name: '' }));
            }}
            error={formError.name}
            disabled={isAdding || isUpdating}
            required
          />

          <Input
            label="Specification Value *"
            placeholder="e.g. SS 304 (1.5mm Thickness) / 10 Years Anti-Rust"
            value={specValue}
            onChange={(e) => {
              setSpecValue(e.target.value);
              if (formError.value) setFormError((prev) => ({ ...prev, value: '' }));
            }}
            error={formError.value}
            disabled={isAdding || isUpdating}
            required
          />

          <Input
            label="Display Sort Order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            disabled={isAdding || isUpdating}
            helperText="Lower numbers appear higher in the table"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isAdding || isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isAdding || isUpdating}>
              {isAdding || isUpdating
                ? 'Saving...'
                : editingSpec
                  ? 'Update Spec'
                  : 'Add Spec'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ProductSpecsSection;
