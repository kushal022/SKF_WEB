import React, { useState } from 'react';
import { Calculator, Check, AlertCircle, Sparkles } from 'lucide-react';
import {
  useCalculateEstimateMutation,
  useUpdateCustomRequestMutation,
} from '../../../app/store/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { useToast } from '../../../components/ui';
import { formatCurrency } from '../../../utils/currency';
import type { CustomRequestDetail } from '../../../types/customRequest';
import type { CalculateEstimateResult } from '../../../types/estimator';

interface CustomRequestEstimatorCardProps {
  request: CustomRequestDetail;
}

export function CustomRequestEstimatorCard({ request }: CustomRequestEstimatorCardProps) {
  const { showToast } = useToast();
  const [calculateEstimate, { isLoading: isCalculating }] = useCalculateEstimateMutation();
  const [updateRequest, { isLoading: isSaving }] = useUpdateCustomRequestMutation();

  // Prefilled parameters from the customer request
  const [productType, setProductType] = useState(request.product_type || '');
  const [width, setWidth] = useState<number>(request.width || 1200);
  const [length, setLength] = useState<number>(request.length || 1800);
  const [height, setHeight] = useState<number>(request.height || 750);
  const [dimensionUnit, setDimensionUnit] = useState<'mm' | 'cm' | 'in' | 'ft' | 'm'>(
    (request.dimension_unit as any) || 'mm'
  );
  const [material, setMaterial] = useState(request.material || 'SS 304');
  const [finish, setFinish] = useState(request.finish || 'hairline');
  const [quantity, setQuantity] = useState<number>(request.quantity || 1);

  const [calculationResult, setCalculationResult] = useState<CalculateEstimateResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (width <= 0 || length <= 0) {
      setErrorMsg('Width and Length must be greater than 0.');
      return;
    }

    try {
      const res = await calculateEstimate({
        product_type: productType || null,
        width: Number(width),
        length: Number(length),
        height: Number(height) || 0,
        dimension_unit: dimensionUnit,
        material: material || null,
        finish: finish || null,
        quantity: Math.max(1, Number(quantity) || 1),
      }).unwrap();

      if (res.data) {
        setCalculationResult(res.data);
        showToast(
          'success',
          `Benchmark estimate calculated: ${formatCurrency(res.data.total_estimate)}`,
          'Calculation Complete'
        );
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to calculate estimate.';
      setErrorMsg(msg);
      showToast('error', msg, 'Calculation Failed');
    }
  };

  const handleSaveToRequest = async () => {
    if (!calculationResult) return;

    try {
      await updateRequest({
        publicId: request.public_id,
        data: {
          estimated_amount: calculationResult.total_estimate,
          product_type: productType,
          width,
          length,
          height,
          dimension_unit: dimensionUnit,
          material,
          finish,
          quantity,
        },
      }).unwrap();

      showToast(
        'success',
        `Request estimated amount updated to ${formatCurrency(calculationResult.total_estimate)}.`,
        'Saved'
      );
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to update request.';
      showToast('error', msg, 'Save Error');
    }
  };

  return (
    <Card className="border-[var(--border-border)] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border-border)]">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[var(--color-primary-500)]" />
          <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
            Custom Pricing Estimator Benchmark
          </CardTitle>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] font-medium">
          Prefilled from Request
        </span>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[var(--color-error-500)]/10 border border-[var(--color-error-500)]/20 flex items-center gap-2 text-sm text-[var(--color-error-500)]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Product Type
            </label>
            <Input
              type="text"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="e.g. dining_table"
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Dimension Unit
            </label>
            <Select
              value={dimensionUnit}
              onChange={(e) => setDimensionUnit(e.target.value as any)}
              className="text-sm"
            >
              <option value="mm">Millimeters (mm)</option>
              <option value="cm">Centimeters (cm)</option>
              <option value="in">Inches (in)</option>
              <option value="ft">Feet (ft)</option>
              <option value="m">Meters (m)</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Length × Width
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                placeholder="Length"
                min={1}
                className="text-sm"
              />
              <Input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                placeholder="Width"
                min={1}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Height × Quantity
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                placeholder="Height"
                min={0}
                className="text-sm"
              />
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="Qty"
                min={1}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Material Grade
            </label>
            <Input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="e.g. SS 304, SS 316"
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Surface Finish
            </label>
            <Input
              type="text"
              value={finish}
              onChange={(e) => setFinish(e.target.value)}
              placeholder="e.g. hairline, mirror, matte"
              className="text-sm"
            />
          </div>

          <div className="sm:col-span-2 flex items-end gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => handleCalculate()}
              isLoading={isCalculating}
              leftIcon={<Sparkles className="w-4 h-4" />}
              className="w-full"
            >
              Calculate Live Benchmark
            </Button>
          </div>
        </div>

        {/* Calculation Result Preview */}
        {calculationResult && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-border)] space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-medium">
                  Estimated Total Benchmark
                </span>
                <div className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">
                  {formatCurrency(calculationResult.total_estimate)}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  Unit Rate: {formatCurrency(calculationResult.unit_estimate)} × {calculationResult.quantity} unit(s)
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveToRequest}
                  isLoading={isSaving}
                  leftIcon={<Check className="w-4 h-4 text-[var(--color-success-500)]" />}
                >
                  Save Benchmark to Request
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border-border)]/50 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
              <div>
                Matched Rule:{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  {calculationResult.matched_rule?.name || 'Default Base Formula'}
                </span>
              </div>
              <div className="italic text-[11px] text-[var(--text-tertiary)]">
                {calculationResult.disclaimer}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CustomRequestEstimatorCard;
