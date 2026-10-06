'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Send,
  MessageSquare,
  Layers,
  Ruler,
  Paintbrush,
  Image as ImageIcon,
  Building2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button, Input, Badge } from '@/components/ui';
import { submitCustomRequest, getPublicSettings } from '@/lib/api';
import { buildWhatsAppUrl, buildCustomRequestMessage } from '@/lib/whatsapp';
import type { WebsiteSettings, CustomRequestPayload, CustomRequestResponse } from '@/types';

const FURNITURE_TYPES = [
  'Dining Table',
  'Console Table',
  'Bed Frame',
  'Center / Coffee Table',
  'Display Rack & Shelving',
  'Modular Kitchen Frame',
  'Sofa / Lounge Frame',
  'Bar Counter & Stool Frame',
  'Architectural Partition / Jali',
  'Other Bespoke Piece',
];

const STEEL_GRADES = [
  {
    id: 'Grade 304 Stainless Steel',
    name: 'SS 304 Architectural Grade',
    desc: 'Rust-proof, durable, ideal for luxury interiors and living spaces.',
  },
  {
    id: 'Grade 316 Marine Grade Stainless Steel',
    name: 'SS 316 Marine Grade',
    desc: 'High molybdenum content for coastal, outdoor, and high-salinity environments.',
  },
];

const FINISH_OPTIONS = [
  { id: 'Brushed Hairline Satin', name: 'Brushed Hairline Satin', color: '#c0c0c0' },
  { id: 'Mirror Polished Chrome', name: 'Mirror Polished Chrome', color: '#e5e7eb' },
  { id: 'PVD Titanium Gold', name: 'PVD Titanium Gold', color: '#eab308' },
  { id: 'PVD Rose Gold', name: 'PVD Rose Gold', color: '#f43f5e' },
  { id: 'PVD Champagne', name: 'PVD Champagne', color: '#fde047' },
  { id: 'Matte Charcoal PVD', name: 'Matte Charcoal PVD', color: '#334155' },
];

const DIMENSION_PRESETS: Record<string, { l: number; w: number; h: number; unit: string }> = {
  'Dining Table': { l: 1800, w: 900, h: 750, unit: 'mm' },
  'Console Table': { l: 1200, w: 400, h: 800, unit: 'mm' },
  'Bed Frame': { l: 2000, w: 1800, h: 450, unit: 'mm' },
  'Center / Coffee Table': { l: 1100, w: 600, h: 450, unit: 'mm' },
  'Display Rack & Shelving': { l: 1200, w: 350, h: 1800, unit: 'mm' },
};

function CustomFurnitureContent() {
  const searchParams = useSearchParams();

  const typeParam = searchParams.get('type') || '';
  const isPresetType = FURNITURE_TYPES.includes(typeParam);

  // Settings
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  // Form Fields
  const [selectedType, setSelectedType] = useState<string>(
    typeParam ? (isPresetType ? typeParam : 'Other Bespoke Piece') : 'Dining Table'
  );
  const [customTypeInput, setCustomTypeInput] = useState<string>(
    typeParam && !isPresetType ? typeParam : ''
  );
  const [length, setLength] = useState<string>(searchParams.get('l') || '1800');
  const [width, setWidth] = useState<string>(searchParams.get('w') || '900');
  const [height, setHeight] = useState<string>(searchParams.get('h') || '750');
  const [dimensionUnit, setDimensionUnit] = useState<string>(searchParams.get('unit') || 'mm');
  const [selectedMaterial, setSelectedMaterial] = useState<string>(() => {
    const matParam = searchParams.get('material');
    if (matParam) {
      const foundMat = STEEL_GRADES.find((m) => m.id.toLowerCase().includes(matParam.toLowerCase()));
      if (foundMat) return foundMat.id;
    }
    return STEEL_GRADES[0].id;
  });
  const [selectedFinish, setSelectedFinish] = useState<string>(() => {
    const finishParam = searchParams.get('finish');
    if (finishParam) {
      const foundFin = FINISH_OPTIONS.find((f) => f.id.toLowerCase().includes(finishParam.toLowerCase()));
      if (foundFin) return foundFin.id;
    }
    return FINISH_OPTIONS[0].id;
  });
  const [quantity, setQuantity] = useState<number>(() => {
    const qtyParam = searchParams.get('qty');
    const parsed = qtyParam ? parseInt(qtyParam, 10) : 1;
    return !isNaN(parsed) && parsed > 0 ? parsed : 1;
  });
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Customer Details
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [requirement, setRequirement] = useState<string>('');
  const [estimatedAmount] = useState<string>(searchParams.get('estimate') || '');

  // Form Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    response: CustomRequestResponse;
    payload: CustomRequestPayload;
  } | null>(null);


  // Load public settings
  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const data = await getPublicSettings();
        if (isMounted && data) setSettings(data);
      } catch (err) {
        console.error('[CustomFurniture] Error loading settings:', err);
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Preset dimension handler
  const applyPreset = (presetName: string) => {
    const p = DIMENSION_PRESETS[presetName];
    if (p) {
      setLength(String(p.l));
      setWidth(String(p.w));
      setHeight(String(p.h));
      setDimensionUnit(p.unit);
    }
  };

  const handleImageChange = (url: string) => {
    setImageUrl(url);
    if (url.trim() && (url.startsWith('http://') || url.startsWith('https://'))) {
      setImagePreview(url.trim());
    } else {
      setImagePreview(null);
    }
  };

  const clearImage = () => {
    setImageUrl('');
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate inputs
    const finalProductType = selectedType === 'Other Bespoke Piece'
      ? customTypeInput.trim() || 'Bespoke Fabrication'
      : selectedType;

    if (!finalProductType) {
      setErrorMessage('Please specify the furniture or product type.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (!cleanPhone || phoneDigits.length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8-10 digits).');
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMessage('Please enter a valid email address, or leave it blank.');
        return;
      }
    }

    if (imageUrl.trim()) {
      const urlRegex = /^https?:\/\/.+/i;
      if (!urlRegex.test(imageUrl.trim())) {
        setErrorMessage('Reference image must be a valid HTTP or HTTPS URL.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: CustomRequestPayload = {
      product_type: finalProductType,
      width: width.trim() ? Number(width) || width.trim() : null,
      length: length.trim() ? Number(length) || length.trim() : null,
      height: height.trim() ? Number(height) || height.trim() : null,
      dimension_unit: dimensionUnit,
      material: selectedMaterial,
      finish: selectedFinish,
      quantity: Math.max(1, quantity),
      customer_name: customerName.trim(),
      phone: cleanPhone,
      email: email.trim() || null,
      city: city.trim() || null,
      requirement: requirement.trim() || null,
      estimated_amount: estimatedAmount ? Number(estimatedAmount) || estimatedAmount : null,
      images: imageUrl.trim()
        ? [
            {
              image_url: imageUrl.trim(),
              sort_order: 0,
            },
          ]
        : undefined,
    };

    try {
      const res = await submitCustomRequest(payload);
      setSubmittedData({
        response: res,
        payload,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to submit your custom request right now. Please try again or reach us on WhatsApp.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedWhatsAppUrl = submittedData
    ? buildWhatsAppUrl({
        phone: settings?.whatsapp_number,
        message: buildCustomRequestMessage(
          {
            product_type: submittedData.payload.product_type,
            dimensions: `${submittedData.payload.length || '—'} × ${submittedData.payload.width || '—'} × ${submittedData.payload.height || '—'} ${submittedData.payload.dimension_unit || 'mm'}`,
            material: submittedData.payload.material || undefined,
            finish: submittedData.payload.finish || undefined,
            quantity: submittedData.payload.quantity,
            city: submittedData.payload.city || undefined,
          },
          settings?.site_name
        ),
      })
    : '';

  // SUCCESS CONFIRMATION VIEW
  if (submittedData) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <Badge variant="success" size="md">
            Request Logged with Factory
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            Custom Fabrication Request Received!
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
            Thank you, <strong className="text-[var(--text-primary)]">{submittedData.payload.customer_name}</strong>. Your custom piece specifications have been transmitted to our engineering and fabrication desk.
          </p>
        </div>

        {/* Request Summary Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-border)] gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Reference ID
              </span>
              <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
                {submittedData.response.public_id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700 capitalize">
                Status: {submittedData.response.status || 'Received'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[var(--text-muted)]">Furniture Item:</span>
              <p className="font-semibold text-[var(--text-primary)] text-sm">
                {submittedData.payload.product_type}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[var(--text-muted)]">Dimensions:</span>
              <p className="font-semibold text-[var(--text-primary)] text-sm">
                {submittedData.payload.length || '—'} × {submittedData.payload.width || '—'} × {submittedData.payload.height || '—'} {submittedData.payload.dimension_unit}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[var(--text-muted)]">Steel Grade:</span>
              <p className="font-semibold text-[var(--text-primary)]">
                {submittedData.payload.material || 'SS 304 Architectural'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[var(--text-muted)]">Surface Treatment:</span>
              <p className="font-semibold text-[var(--text-primary)]">
                {submittedData.payload.finish || 'Standard Polish'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[var(--text-muted)]">Quantity:</span>
              <p className="font-semibold text-[var(--text-primary)]">
                {submittedData.payload.quantity} Unit(s)
              </p>
            </div>

            {submittedData.payload.city && (
              <div className="space-y-1">
                <span className="text-[var(--text-muted)]">Delivery City:</span>
                <p className="font-semibold text-[var(--text-primary)]">
                  {submittedData.payload.city}
                </p>
              </div>
            )}
          </div>

          {submittedData.payload.requirement && (
            <div className="pt-3 border-t border-[var(--border-border)] text-xs">
              <span className="text-[var(--text-muted)] block mb-1">Your Requirements:</span>
              <p className="p-3 rounded-lg bg-[var(--surface-muted)] text-[var(--text-secondary)] whitespace-pre-wrap">
                {submittedData.payload.requirement}
              </p>
            </div>
          )}

          {submittedData.payload.images && submittedData.payload.images[0]?.image_url && (
            <div className="pt-3 border-t border-[var(--border-border)]">
              <span className="text-[11px] text-[var(--text-muted)] block mb-2">Reference Image:</span>
              <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-[var(--border-border)] bg-slate-50">
                <Image
                  src={submittedData.payload.images[0].image_url}
                  alt="Custom specification reference"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {formattedWhatsAppUrl && (
            <a
              href={formattedWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Discuss Directly on WhatsApp</span>
            </a>
          )}

          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setSubmittedData(null);
              setCustomerName('');
              setPhone('');
              setEmail('');
              setRequirement('');
              setImageUrl('');
              setImagePreview(null);
            }}
            className="w-full sm:w-auto"
          >
            Submit Another Custom Requirement
          </Button>

          <Link href="/products" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full">
              Explore Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // MAIN FORM VIEW
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb Header */}
      <div className="space-y-3 border-b border-[var(--border-border)] pb-6">
        <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--text-primary)] font-semibold">Custom Furniture</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct Factory Custom Fabrication</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
              Bespoke Stainless Steel Furniture
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
              Design tailor-made architectural tables, luxury bedframes, display racks, and partition screens. Hand-welded and finished in surgical SS 304 &amp; 316.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>10-Yr Rust Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prefill Notice */}
      {estimatedAmount && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Pre-filled from Cost Estimator:</strong> Estimated Base ₹{Number(estimatedAmount).toLocaleString('en-IN')}. Please confirm specifications below to receive an official proposal.
            </span>
          </div>
          <Link href="/estimator" className="text-amber-800 underline font-semibold shrink-0">
            Edit in Estimator
          </Link>
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* SECTION 1: Furniture Type */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <Layers className="w-4 h-4 text-[var(--brand-accent)]" />
              <span>1. Select Furniture Type <span className="text-rose-500">*</span></span>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">Step 1 of 5</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {FURNITURE_TYPES.map((type) => {
              const isSelected = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedType(type);
                    if (DIMENSION_PRESETS[type]) {
                      applyPreset(type);
                    }
                  }}
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

          {selectedType === 'Other Bespoke Piece' && (
            <div className="pt-2">
              <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                Describe Your Custom Piece <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g., Cantilevered Spiral SS Staircase Balustrade, Reception Desk..."
                value={customTypeInput}
                onChange={(e) => setCustomTypeInput(e.target.value)}
                required
              />
            </div>
          )}
        </section>

        {/* SECTION 2: Dimensions */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <Ruler className="w-4 h-4 text-[var(--brand-accent)]" />
              <span>2. Dimensions &amp; Sizing</span>
            </div>
            {DIMENSION_PRESETS[selectedType] && (
              <button
                type="button"
                onClick={() => applyPreset(selectedType)}
                className="text-[11px] font-semibold text-[var(--brand-accent)] hover:underline self-start sm:self-auto"
              >
                Use Standard Preset for {selectedType}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                Length
              </label>
              <Input
                type="number"
                placeholder="e.g. 1800"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                min="1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                Width / Depth
              </label>
              <Input
                type="number"
                placeholder="e.g. 900"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                min="1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                Height
              </label>
              <Input
                type="number"
                placeholder="e.g. 750"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="0"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                Dimension Unit
              </label>
              <select
                value={dimensionUnit}
                onChange={(e) => setDimensionUnit(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
              >
                <option value="mm">Millimeters (mm)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="in">Inches (in)</option>
                <option value="ft">Feet (ft)</option>
              </select>
            </div>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Exact tolerances are verified during CAD drawing sign-off before fabrication starts.
          </p>
        </section>

        {/* SECTION 3: Material & Finish */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <Paintbrush className="w-4 h-4 text-[var(--brand-accent)]" />
            <span>3. Metallurgy &amp; Surface Treatment</span>
          </div>

          {/* Steel Grade Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] block">
              Stainless Steel Grade
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STEEL_GRADES.map((grade) => {
                const isSelected = selectedMaterial === grade.id;
                return (
                  <div
                    key={grade.id}
                    onClick={() => setSelectedMaterial(grade.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 ring-2 ring-[var(--brand-accent)]/30'
                        : 'border-[var(--border-border)] hover:bg-[var(--surface-muted)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[var(--text-primary)]">{grade.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">{grade.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Finish Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] block">
              Surface Coating / Finish
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {FINISH_OPTIONS.map((f) => {
                const isSelected = selectedFinish === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFinish(f.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                      isSelected
                        ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 ring-2 ring-[var(--brand-accent)]/30'
                        : 'border-[var(--border-border)] hover:bg-[var(--surface-muted)]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: f.color }}
                      />
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight">
                      {f.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="pt-2 flex items-center gap-4">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Quantity:
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
            <span className="text-[11px] text-[var(--text-muted)]">
              {quantity > 1 ? 'Volume fabrication discounts apply' : 'Single prototype / piece'}
            </span>
          </div>
        </section>

        {/* SECTION 4: Reference Image */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <ImageIcon className="w-4 h-4 text-[var(--brand-accent)]" />
            <span>4. Reference Design or Architectural Sketch</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] block">
              Reference Image URL (Optional)
            </label>
            <Input
              type="url"
              placeholder="https://example.com/sketch-or-inspiration.jpg"
              value={imageUrl}
              onChange={(e) => handleImageChange(e.target.value)}
            />
            <p className="text-[11px] text-[var(--text-muted)]">
              Provide an online image URL, Pinterest link, or CAD render link. You can also share files directly via WhatsApp after submitting.
            </p>
          </div>

          {imagePreview && (
            <div className="p-3 rounded-xl border border-[var(--border-border)] bg-[var(--surface-muted)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-200 border border-slate-300">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-[var(--text-primary)] block">Image Preview Loaded</span>
                  <span className="text-[11px] text-[var(--text-muted)] truncate max-w-xs block">
                    {imageUrl}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* SECTION 5: Customer Details & Notes */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <Building2 className="w-4 h-4 text-[var(--brand-accent)]" />
            <span>5. Contact &amp; Delivery Details <span className="text-rose-500">*</span></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                Your Full Name <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. Vikramaditya Singhania"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <Input
                type="tel"
                placeholder="e.g. +91 98250 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                Email Address (Optional)
              </label>
              <Input
                type="email"
                placeholder="e.g. client@architects.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                City / Delivery Location
              </label>
              <Input
                placeholder="e.g. Mumbai, Ahmedabad, Bengaluru..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-primary)] block">
              Specific Requirements / Project Notes
            </label>
            <textarea
              rows={3}
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="Specify special tube cross-sections (e.g. 50x25mm box pipe), glass/marble top requirements, floor leveling studs, or scheduled installation dates..."
              className="w-full p-3 rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] placeholder:text-[var(--text-muted)]"
            />
          </div>
        </section>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-[var(--text-muted)] max-w-md">
            By submitting, our technical engineer will review your dimensions and return an itemized commercial proposal within 24 hours.
          </p>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
            className="w-full sm:w-auto px-8"
          >
            {isSubmitting ? 'Submitting Specifications...' : 'Submit Custom Furniture Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CustomFurniturePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">Loading custom furniture studio...</p>
          </div>
        </div>
      }
    >
      <CustomFurnitureContent />
    </Suspense>
  );
}
