'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calculator,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Layers,
  Ruler,
  Paintbrush,
  AlertCircle,
  HelpCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import EnquiryModal from '@/components/EnquiryModal';
import {
  getEstimatorRules,
  calculateEstimator,
  getPublicSettings,
} from '@/lib/api';
import { buildWhatsAppUrl, buildEstimatorWhatsAppMessage } from '@/lib/whatsapp';
import type {
  WebsiteSettings,
  EstimatorRule,
  EstimatorCalculationResult,
} from '@/types';

const PRODUCT_TYPES = [
  'Dining Table',
  'Console Table',
  'Bed Frame',
  'Center Table',
  'Display Rack',
  'Custom Fabrication',
];

const MATERIALS = [
  {
    id: 'SS 304',
    name: 'SS 304 Architectural Grade',
    desc: 'Rust-proof, durable, indoor luxury standard.',
  },
  {
    id: 'SS 316',
    name: 'SS 316 Marine Grade',
    desc: 'High molybdenum for coastal, outdoor & chemical resistance.',
  },
];

const FINISHES = [
  { id: 'Brushed Satin', name: 'Brushed Satin', color: '#c0c0c0' },
  { id: 'Mirror Polished', name: 'Mirror Polished', color: '#e5e7eb' },
  { id: 'PVD Titanium Gold', name: 'PVD Titanium Gold', color: '#eab308' },
  { id: 'Rose Gold', name: 'PVD Rose Gold', color: '#f43f5e' },
  { id: 'Matte Charcoal', name: 'Matte Charcoal', color: '#334155' },
];

const PRESET_SPECS: Record<string, { l: number; w: number; h: number; unit: 'mm' | 'cm' | 'in' | 'ft' | 'm' }> = {
  'Dining Table': { l: 1800, w: 900, h: 750, unit: 'mm' },
  'Console Table': { l: 1200, w: 400, h: 800, unit: 'mm' },
  'Bed Frame': { l: 2000, w: 1800, h: 450, unit: 'mm' },
  'Center Table': { l: 1100, w: 600, h: 450, unit: 'mm' },
  'Display Rack': { l: 1200, w: 350, h: 1800, unit: 'mm' },
  'Custom Fabrication': { l: 1500, w: 750, h: 750, unit: 'mm' },
};

export default function EstimatorPage() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [activeRules, setActiveRules] = useState<EstimatorRule[]>([]);

  // Form Inputs
  const [productType, setProductType] = useState<string>('Dining Table');
  const [length, setLength] = useState<number>(1800);
  const [width, setWidth] = useState<number>(900);
  const [height, setHeight] = useState<number>(750);
  const [dimensionUnit, setDimensionUnit] = useState<'mm' | 'cm' | 'in' | 'ft' | 'm'>('mm');
  const [material, setMaterial] = useState<string>('SS 304');
  const [finish, setFinish] = useState<string>('Brushed Satin');
  const [quantity, setQuantity] = useState<number>(1);

  // Calculation Results
  const [result, setResult] = useState<EstimatorCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Quote Modal State
  const [quoteModalOpen, setQuoteModalOpen] = useState<boolean>(false);

  // Load public settings and estimator rules
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [settingsData, rulesData] = await Promise.all([
          getPublicSettings(),
          getEstimatorRules(),
        ]);
        if (!isMounted) return;
        if (settingsData) setSettings(settingsData);
        if (rulesData) setActiveRules(rulesData);
      } catch (err) {
        console.error('[EstimatorPage] Error loading data:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced auto-calculation when parameters change
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      if (length <= 0 || width <= 0) {
        setCalcError('Length and Width must be greater than 0.');
        return;
      }

      setIsCalculating(true);
      setCalcError(null);

      try {
        const res = await calculateEstimator({
          product_type: productType,
          length: Number(length),
          width: Number(width),
          height: Number(height) || 0,
          dimension_unit: dimensionUnit,
          material,
          finish,
          quantity: Math.max(1, quantity),
        });
        if (isMounted) {
          setResult(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Calculation failed';
          setCalcError(msg);
        }
      } finally {
        if (isMounted) {
          setIsCalculating(false);
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [productType, length, width, height, dimensionUnit, material, finish, quantity]);


  // Apply dimension preset when changing product type
  const handleTypeChange = (type: string) => {
    setProductType(type);
    const preset = PRESET_SPECS[type];
    if (preset) {
      setLength(preset.l);
      setWidth(preset.w);
      setHeight(preset.h);
      setDimensionUnit(preset.unit);
    }
  };

  const handleReset = () => {
    handleTypeChange('Dining Table');
    setMaterial('SS 304');
    setFinish('Brushed Satin');
    setQuantity(1);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const customFurnitureUrl = `/custom-furniture?type=${encodeURIComponent(
    productType
  )}&l=${length}&w=${width}&h=${height}&unit=${dimensionUnit}&material=${encodeURIComponent(
    material
  )}&finish=${encodeURIComponent(finish)}&qty=${quantity}${
    result ? `&estimate=${result.total_estimate}` : ''
  }`;

  const whatsappUrl = result
    ? buildWhatsAppUrl({
        phone: settings?.whatsapp_number,
        message: buildEstimatorWhatsAppMessage(
          {
            product_type: productType,
            dimensions: `${length} × ${width} × ${height} ${dimensionUnit}`,
            material,
            finish,
            quantity,
            total_estimate: result.total_estimate,
          },
          settings?.site_name
        ),
      })
    : '';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb Header */}
      <div className="space-y-3 border-b border-[var(--border-border)] pb-6">
        <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--text-primary)] font-semibold">Estimator</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-1">
              <Calculator className="w-3.5 h-3.5" />
              <span>Instant Cost Calculator</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
              Stainless Steel Furniture Cost Estimator
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
              Calculate automated reference estimates based on dimensional surface calculations, steel metallurgy, and artisan surface finishes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-border)] hover:bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-secondary)] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 1: Product Type */}
          <div className="p-6 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Layers className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
              <span>1. Furniture Type</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRODUCT_TYPES.map((type) => {
                const isSelected = productType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`p-3 rounded-xl text-left border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 text-[var(--text-primary)] ring-2 ring-[var(--brand-accent)]/30'
                        : 'border-[var(--border-border)] hover:bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Dimensions */}
          <div className="p-6 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <Ruler className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                <span>2. Dimensions</span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                Auto-preset loaded for {productType}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
                  Length
                </label>
                <Input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  min="1"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
                  Width / Depth
                </label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min="1"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
                  Height
                </label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min="0"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
                  Unit
                </label>
                <select
                  value={dimensionUnit}
                  onChange={(e) => setDimensionUnit(e.target.value as 'mm' | 'cm' | 'in' | 'ft' | 'm')}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
                >
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="in">inches</option>
                  <option value="ft">feet</option>
                  <option value="m">meters</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: Material & Finish */}
          <div className="p-6 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Paintbrush className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
              <span>3. Steel Grade &amp; Surface Treatment</span>
            </div>

            {/* Steel Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MATERIALS.map((mat) => {
                const isSelected = material === mat.id;
                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => setMaterial(mat.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 ring-2 ring-[var(--brand-accent)]/30'
                        : 'border-[var(--border-border)] hover:bg-[var(--surface-muted)]'
                    }`}
                  >
                    <span className="font-bold text-xs text-[var(--text-primary)] block">
                      {mat.name}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] mt-0.5 block">
                      {mat.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Finish */}
            <div className="pt-2">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1.5">
                Surface Coating / Treatment
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FINISHES.map((f) => {
                  const isSelected = finish === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFinish(f.id)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                        isSelected
                          ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 ring-2 ring-[var(--brand-accent)]/30'
                          : 'border-[var(--border-border)] hover:bg-[var(--surface-muted)]'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: f.color }}
                      />
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {f.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="pt-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Quantity Units:
              </label>
              <div className="inline-flex items-center rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] rounded-l-lg"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-bold text-[var(--text-primary)]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] rounded-r-lg"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS & NEXT ACTIONS STICKY COLUMN */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--brand-primary)] text-white shadow-xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Live Calculation
              </span>
              {isCalculating ? (
                <span className="text-xs text-slate-300 animate-pulse">Calculating...</span>
              ) : result?.matched_rule ? (
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 truncate max-w-[180px]">
                  {result.matched_rule.name}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-semibold bg-white/10 px-2 py-0.5 rounded">
                  Standard Formula
                </span>
              )}
            </div>

            {calcError && (
              <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{calcError}</span>
              </div>
            )}

            {/* Price Presentation */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Estimated Price
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                {result ? formatCurrency(result.total_estimate) : '—'}
              </div>
              {result && quantity > 1 && (
                <p className="text-xs text-slate-400 pt-0.5">
                  Unit Price: {formatCurrency(result.unit_estimate)} × {quantity} Units
                </p>
              )}
            </div>

            {/* Specification Summary */}
            <div className="pt-4 border-t border-white/10 text-xs space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Item:</span>
                <span className="font-semibold text-white">{productType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dimensions:</span>
                <span className="font-semibold text-white">
                  {length} × {width} × {height} {dimensionUnit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Material &amp; Finish:</span>
                <span className="font-semibold text-white">
                  {material} • {finish}
                </span>
              </div>
            </div>

            {/* Mandatory Legal & Technical Disclaimer */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Estimated Price:</strong> Final pricing may vary based on customization, material, dimensions, transport, installation and other project requirements.
              </span>
            </div>

            {/* Next Action CTAs */}
            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setQuoteModalOpen(true)}
                leftIcon={<FileText className="w-4 h-4" />}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                Get Official Quotation
              </Button>

              <Link href={customFurnitureUrl} className="block w-full">
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  className="w-full border-white/30 text-white hover:bg-white/10 text-xs font-semibold"
                >
                  Submit as Custom Request
                </Button>
              </Link>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Discuss Estimate on WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Active Rules Info Box */}
          {activeRules.length > 0 && (
            <div className="p-4 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] space-y-2 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Certified Metallurgy Standards</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Prices calculate raw structural weight based on 8.00 g/cm³ density of austenitic stainless steel with precision TIG jointing formulas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quote Modal */}
      <EnquiryModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        productName={`${productType} (${length}x${width}x${height} ${dimensionUnit}, ${material}, ${finish}, Qty: ${quantity}) - Estimated Total: ${
          result ? formatCurrency(result.total_estimate) : 'N/A'
        }`}
        source="estimator"
        settings={settings}
      />
    </div>
  );
}
