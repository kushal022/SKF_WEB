import React, { useState } from 'react';
import { Modal, Button, Input, useToast } from '../../../components/ui';
import {
  useCreateAdminEstimatorRuleMutation,
  useUpdateAdminEstimatorRuleMutation,
} from '../../../app/store/api';
import type { EstimatorRule } from '../../../types/estimator';

interface EstimatorRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleToEdit?: EstimatorRule | null;
}

export function EstimatorRuleModal({
  isOpen,
  onClose,
  ruleToEdit,
}: EstimatorRuleModalProps) {
  const { showToast } = useToast();
  const [createRule, { isLoading: isCreating }] = useCreateAdminEstimatorRuleMutation();
  const [updateRule, { isLoading: isUpdating }] = useUpdateAdminEstimatorRuleMutation();

  const isEditing = Boolean(ruleToEdit);

  const [name, setName] = useState(ruleToEdit?.name || '');
  const [productType, setProductType] = useState(ruleToEdit?.product_type || '');
  const [material, setMaterial] = useState(ruleToEdit?.material || '');
  const [finish, setFinish] = useState(ruleToEdit?.finish || '');
  const [baseRate, setBaseRate] = useState<number>(
    ruleToEdit?.base_rate !== null && ruleToEdit?.base_rate !== undefined ? Number(ruleToEdit.base_rate) : 5000
  );
  const [dimensionMultiplier, setDimensionMultiplier] = useState<number>(
    ruleToEdit?.dimension_multiplier !== null && ruleToEdit?.dimension_multiplier !== undefined
      ? Number(ruleToEdit.dimension_multiplier)
      : 1500
  );
  const [materialRate, setMaterialRate] = useState<number>(
    ruleToEdit?.material_rate !== null && ruleToEdit?.material_rate !== undefined ? Number(ruleToEdit.material_rate) : 0
  );
  const [finishAdjustment, setFinishAdjustment] = useState<number>(
    ruleToEdit?.finish_adjustment !== null && ruleToEdit?.finish_adjustment !== undefined
      ? Number(ruleToEdit.finish_adjustment)
      : 0
  );
  const [priority, setPriority] = useState<number>(ruleToEdit?.priority || 0);
  const [isActive, setIsActive] = useState<boolean>(
    ruleToEdit ? ruleToEdit.is_active : true
  );
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Rule name is required.');
      return;
    }

    try {
      setFormError(null);
      if (isEditing && ruleToEdit) {
        await updateRule({
          publicId: ruleToEdit.public_id,
          data: {
            name: name.trim(),
            product_type: productType.trim() ? productType.trim() : null,
            material: material.trim() ? material.trim() : null,
            finish: finish.trim() ? finish.trim() : null,
            base_rate: Number(baseRate),
            dimension_multiplier: Number(dimensionMultiplier),
            material_rate: Number(materialRate),
            finish_adjustment: Number(finishAdjustment),
            priority: Number(priority),
            is_active: isActive,
          },
        }).unwrap();

        showToast('success', `Estimator rule "${name}" updated.`, 'Rule Updated');
      } else {
        await createRule({
          name: name.trim(),
          product_type: productType.trim() ? productType.trim() : null,
          material: material.trim() ? material.trim() : null,
          finish: finish.trim() ? finish.trim() : null,
          base_rate: Number(baseRate),
          dimension_multiplier: Number(dimensionMultiplier),
          material_rate: Number(materialRate),
          finish_adjustment: Number(finishAdjustment),
          priority: Number(priority),
          is_active: isActive,
        }).unwrap();

        showToast('success', `Estimator rule "${name}" created.`, 'Rule Created');
      }

      onClose();
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to save estimator rule.');
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      title={isEditing ? 'Edit Estimator Rule' : 'Create Estimator Rule'}
      description="Configure pricing formulas, material modifiers, and dimension multipliers for custom stainless steel calculations."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            id="rule-name"
            label="Rule Name *"
            placeholder="e.g. Standard SS 304 Dining Table Rule"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            id="rule-product-type"
            label="Product Category"
            placeholder="e.g. Table, Cabinet"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            helperText="Matches custom furniture requests"
          />

          <Input
            id="rule-material"
            label="Material Grade"
            placeholder="e.g. SS 304, SS 316"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          />

          <Input
            id="rule-finish"
            label="Surface Finish"
            placeholder="e.g. Hairline, Mirror, PVD"
            value={finish}
            onChange={(e) => setFinish(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-border)]">
          <Input
            id="rule-base-rate"
            label="Base Fixed Rate (INR)"
            type="number"
            min="0"
            step="0.01"
            value={baseRate}
            onChange={(e) => setBaseRate(Number(e.target.value))}
            helperText="Minimum starting fabrication rate"
          />

          <Input
            id="rule-dim-multiplier"
            label="Dimension Multiplier (per sq.m)"
            type="number"
            min="0"
            step="0.01"
            value={dimensionMultiplier}
            onChange={(e) => setDimensionMultiplier(Number(e.target.value))}
            helperText="Rate multiplied by computed surface area"
          />

          <Input
            id="rule-material-rate"
            label="Material Premium (INR)"
            type="number"
            min="0"
            step="0.01"
            value={materialRate}
            onChange={(e) => setMaterialRate(Number(e.target.value))}
            helperText="Surcharge for specialty steel grades"
          />

          <Input
            id="rule-finish-adjustment"
            label="Finish Surcharge (INR)"
            type="number"
            min="0"
            step="0.01"
            value={finishAdjustment}
            onChange={(e) => setFinishAdjustment(Number(e.target.value))}
            helperText="Coating / PVD / polishing surcharge"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-border)]">
          <Input
            id="rule-priority"
            label="Evaluation Priority"
            type="number"
            step="1"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            helperText="Higher numbers are evaluated first"
          />

          <div className="flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Rule Status
            </span>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--brand-accent)] focus:ring-[var(--brand-accent)] cursor-pointer"
              />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Active in Pricing Engine
              </span>
            </label>
          </div>
        </div>

        {formError && (
          <div className="p-3 rounded-lg bg-[var(--status-error)]/10 text-[var(--status-error)] text-xs font-medium border border-[var(--status-error)]/20">
            {formError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-border)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
          >
            {isEditing ? 'Save Changes' : 'Create Rule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EstimatorRuleModal;
