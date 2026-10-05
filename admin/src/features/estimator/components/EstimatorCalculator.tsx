import React, { useState } from 'react';
import { Calculator, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent } from '../../../components/ui';
import { useCalculateEstimateMutation } from '../../../app/store/api';
import { formatCurrency } from '../../../utils/currency';
import type { CalculateEstimateResult } from '../../../types/estimator';

export function EstimatorCalculator() {
  const [calculateEstimate, { isLoading }] = useCalculateEstimateMutation();

  const [productType, setProductType] = useState('Table');
  const [width, setWidth] = useState<number>(1200);
  const [length, setLength] = useState<number>(1800);
  const [height, setHeight] = useState<number>(750);
  const [unit, setUnit] = useState<'mm' | 'cm' | 'in' | 'ft' | 'm'>('mm');
  const [material, setMaterial] = useState('SS 304');
  const [finish, setFinish] = useState('Hairline');
  const [quantity, setQuantity] = useState<number>(1);

  const [result, setResult] = useState<CalculateEstimateResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (width <= 0 || length <= 0) {
      setErrorMsg('Width and Length must be greater than 0.');
      return;
    }

    try {
      setErrorMsg(null);
      const res = await calculateEstimate({
        product_type: productType.trim() ? productType.trim() : null,
        width: Number(width),
        length: Number(length),
        height: Number(height || 0),
        dimension_unit: unit,
        material: material.trim() ? material.trim() : null,
        finish: finish.trim() ? finish.trim() : null,
        quantity: Number(quantity || 1),
      }).unwrap();

      if (res.data) {
        setResult(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to compute estimate.');
    }
  };

  return (
    <Card className="shadow-xs border border-[var(--border-border)]">
      <CardHeader className="pb-3 border-b border-[var(--border-border)]">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[var(--brand-accent)]" />
          <CardTitle className="text-base font-semibold">Pricing Engine Test Bench</CardTitle>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Simulate customer dimensions to verify active pricing rules and multiplier calculations.
        </p>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              id="calc-product-type"
              label="Product Type"
              placeholder="e.g. Table, Kitchen, Bench"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
            />

            <Input
              id="calc-material"
              label="Material Grade"
              placeholder="e.g. SS 304, SS 316"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
            />

            <Input
              id="calc-finish"
              label="Surface Finish"
              placeholder="e.g. Hairline, Mirror, PVD"
              value={finish}
              onChange={(e) => setFinish(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              id="calc-width"
              label="Width"
              type="number"
              min="1"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              required
            />

            <Input
              id="calc-length"
              label="Length"
              type="number"
              min="1"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              required
            />

            <Input
              id="calc-height"
              label="Height"
              type="number"
              min="0"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />

            <div>
              <label
                htmlFor="calc-unit"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1"
              >
                Unit
              </label>
              <Select
                id="calc-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                options={[
                  { value: 'mm', label: 'Millimeters (mm)' },
                  { value: 'cm', label: 'Centimeters (cm)' },
                  { value: 'in', label: 'Inches (in)' },
                  { value: 'ft', label: 'Feet (ft)' },
                  { value: 'm', label: 'Meters (m)' },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="w-32">
              <Input
                id="calc-quantity"
                label="Quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Compute Estimate
            </Button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-3 mt-4 rounded-lg bg-[var(--status-error)]/10 text-[var(--status-error)] text-xs font-medium border border-[var(--status-error)]/20">
            {errorMsg}
          </div>
        )}

        {/* Calculation Result */}
        {result && (
          <div className="mt-4 p-4 rounded-xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/5 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-accent)]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Computed by Backend Engine</span>
              </div>
              {result.matched_rule ? (
                <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--surface-surface)] text-[var(--text-secondary)] border border-[var(--border-border)] font-medium">
                  Rule: {result.matched_rule.name}
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 font-medium">
                  Default Fallback Pricing
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border-border)]/60">
              <div>
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                  Unit Estimate
                </span>
                <span className="text-base font-bold text-[var(--text-primary)] font-mono">
                  {formatCurrency(result.unit_estimate)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                  Total Estimate ({result.quantity} unit{result.quantity > 1 ? 's' : ''})
                </span>
                <span className="text-xl font-black text-[var(--brand-accent)] font-mono">
                  {formatCurrency(result.total_estimate)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] italic pt-1 border-t border-[var(--border-border)]/40 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{result.disclaimer}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EstimatorCalculator;
