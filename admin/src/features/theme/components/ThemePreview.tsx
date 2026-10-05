import { useState } from 'react';
import {
  Sparkles,
  Phone,
  ArrowRight,
  ShieldCheck,
  Star,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle2,
} from 'lucide-react';
import type { ThemeColors, ThemeTypography, ThemeStyles } from '../../../types/theme';

interface ThemePreviewProps {
  colors: ThemeColors;
  typography: ThemeTypography;
  styles: ThemeStyles;
  themeName?: string;
  isDraft?: boolean;
}

export function ThemePreview({
  colors,
  typography,
  styles,
  themeName = 'Theme Preview',
  isDraft = true,
}: ThemePreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Resolved tokens with sensible fallbacks
  const primary = colors.primary_color || '#0f172a';
  const secondary = colors.secondary_color || '#475569';
  const accent = colors.accent_color || '#0284c7';
  const background = colors.background_color || '#f8fafc';
  const surface = colors.surface_color || '#ffffff';
  const text = colors.text_color || '#0f172a';
  const mutedText = colors.muted_text_color || '#64748b';
  const border = colors.border_color || '#e2e8f0';

  const headingFont = typography.heading_font || 'Outfit, sans-serif';
  const bodyFont = typography.body_font || 'Plus Jakarta Sans, sans-serif';
  const headingWeight = typography.heading_weight || '700';
  const bodyWeight = typography.body_weight || '400';

  const borderRadius = styles.border_radius || '8px';
  const buttonStyle = styles.button_style || 'rounded';
  const cardStyle = styles.card_style || 'elevated';

  const getButtonRadius = () => {
    if (buttonStyle === 'pill') return '9999px';
    if (buttonStyle === 'sharp') return '0px';
    return borderRadius;
  };

  const getCardShadow = () => {
    if (cardStyle === 'elevated') return '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)';
    if (cardStyle === 'bordered') return 'none';
    if (cardStyle === 'flat') return 'none';
    return '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
      {/* Device Toolbar Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="font-semibold text-slate-300 ml-1 truncate max-w-[140px]">
            {themeName}
          </span>
          {isDraft && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Draft
            </span>
          )}
        </div>

        {/* Viewport Width Switches */}
        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`p-1 rounded transition-colors ${
              viewport === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`p-1 rounded transition-colors ${
              viewport === 'tablet' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet View"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`p-1 rounded transition-colors ${
              viewport === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-auto flex justify-center items-start">
        <div
          style={{
            width: viewport === 'mobile' ? '340px' : viewport === 'tablet' ? '540px' : '100%',
            backgroundColor: background,
            color: text,
            fontFamily: bodyFont,
            fontWeight: bodyWeight,
            transition: 'all 0.2s ease',
          }}
          className="rounded-lg shadow-2xl border border-slate-800 overflow-hidden flex flex-col text-xs"
        >
          {/* Top Announcement Bar */}
          <div
            style={{
              backgroundColor: primary,
              color: '#ffffff',
              borderBottom: `1px solid rgba(255,255,255,0.1)`,
            }}
            className="px-3 py-1.5 flex items-center justify-between text-[10px]"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles style={{ color: accent }} className="w-3 h-3 shrink-0" />
              <span className="truncate">Architectural 304 & 316 Stainless Steel Craftsmanship</span>
            </div>
            <span className="hidden sm:inline opacity-80">ISO 9001 Certified</span>
          </div>

          {/* Navigation Bar */}
          <header
            style={{
              backgroundColor: surface,
              borderBottom: `1px solid ${border}`,
            }}
            className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shrink-0"
          >
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div
                style={{
                  backgroundColor: primary,
                  borderRadius: '6px',
                  color: '#ffffff',
                }}
                className="w-6 h-6 flex items-center justify-center font-black text-[11px]"
              >
                S
              </div>
              <span
                style={{
                  fontFamily: headingFont,
                  fontWeight: headingWeight,
                  color: text,
                }}
                className="text-xs tracking-tight font-bold"
              >
                SKF Steel
              </span>
            </div>

            {/* Desktop Navigation Links */}
            {viewport === 'desktop' && (
              <nav className="flex items-center gap-3 text-[11px] font-medium" style={{ color: secondary }}>
                <span style={{ color: primary }} className="font-semibold cursor-pointer">
                  Home
                </span>
                <span className="cursor-pointer hover:opacity-80">Catalog</span>
                <span className="cursor-pointer hover:opacity-80">Custom Fabrication</span>
                <span className="cursor-pointer hover:opacity-80">B2B Portal</span>
              </nav>
            )}

            {/* Action CTA */}
            <button
              type="button"
              style={{
                backgroundColor: accent,
                borderRadius: getButtonRadius(),
                color: '#ffffff',
              }}
              className="px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 shadow-xs shrink-0"
            >
              <Phone className="w-3 h-3" />
              <span>Inquire</span>
            </button>
          </header>

          {/* Hero Section */}
          <div
            style={{
              backgroundColor: surface,
              borderBottom: `1px solid ${border}`,
            }}
            className="p-4 sm:p-6 text-center space-y-3"
          >
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <ShieldCheck style={{ color: accent }} className="w-3 h-3" />
              <span>Architectural Grade 304 / 316</span>
            </div>

            <h1
              style={{
                fontFamily: headingFont,
                fontWeight: headingWeight,
                color: primary,
              }}
              className="text-base sm:text-lg font-bold tracking-tight max-w-sm mx-auto leading-tight"
            >
              Mastercrafted Stainless Steel Luxury
            </h1>

            <p style={{ color: mutedText }} className="text-[11px] max-w-xs mx-auto leading-relaxed">
              Precision engineered dining, commercial fixtures, and bespoke custom architectural metalwork.
            </p>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                style={{
                  backgroundColor: primary,
                  color: '#ffffff',
                  borderRadius: getButtonRadius(),
                }}
                className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1 shadow-sm"
              >
                <span>View Catalog</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                style={{
                  backgroundColor: 'transparent',
                  color: primary,
                  border: `1px solid ${border}`,
                  borderRadius: getButtonRadius(),
                }}
                className="px-3 py-1.5 text-xs font-medium"
              >
                Custom Request
              </button>
            </div>
          </div>

          {/* Featured Product Card Component Showcase */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: headingFont,
                  fontWeight: headingWeight,
                  color: primary,
                }}
                className="font-bold text-xs"
              >
                Featured Collection
              </span>
              <span style={{ color: accent }} className="text-[10px] font-semibold cursor-pointer">
                View All →
              </span>
            </div>

            {/* Product Card */}
            <div
              style={{
                backgroundColor: surface,
                borderRadius: borderRadius,
                border: `1px solid ${border}`,
                boxShadow: getCardShadow(),
              }}
              className="p-3 flex flex-col sm:flex-row gap-3 items-center"
            >
              {/* Product Visual Placeholder */}
              <div
                style={{
                  backgroundColor: primary,
                  borderRadius: '6px',
                }}
                className="w-full sm:w-24 h-20 flex flex-col items-center justify-center text-white shrink-0 shadow-inner"
              >
                <Sparkles style={{ color: accent }} className="w-6 h-6 mb-1" />
                <span className="text-[9px] font-mono tracking-wider">SS-304</span>
              </div>

              {/* Product Details */}
              <div className="flex-1 space-y-1 text-center sm:text-left w-full">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-[10px] text-amber-500 font-semibold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>4.9 (48 Reviews)</span>
                </div>

                <h3
                  style={{
                    fontFamily: headingFont,
                    fontWeight: headingWeight,
                    color: text,
                  }}
                  className="font-bold text-xs"
                >
                  Regal Architectural Dining Table
                </h3>

                <p style={{ color: mutedText }} className="text-[10px] line-clamp-1">
                  Hand-buffed mirror finish with 12mm tempered safety glass top.
                </p>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-baseline gap-1">
                    <span style={{ color: primary }} className="font-bold text-xs">
                      ₹48,500
                    </span>
                    <span style={{ color: mutedText }} className="text-[9px] line-through">
                      ₹55,000
                    </span>
                  </div>

                  <button
                    type="button"
                    style={{
                      backgroundColor: accent,
                      color: '#ffffff',
                      borderRadius: getButtonRadius(),
                    }}
                    className="px-2 py-0.5 text-[10px] font-semibold"
                  >
                    Quick Order
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Miniature Footer */}
          <footer
            style={{
              backgroundColor: primary,
              color: '#ffffff',
              borderTop: `1px solid rgba(255,255,255,0.1)`,
            }}
            className="p-3 text-[10px] text-center space-y-1 mt-auto"
          >
            <div className="flex items-center justify-center gap-1 font-semibold">
              <CheckCircle2 style={{ color: accent }} className="w-3 h-3" />
              <span>SKF Stainless Steel Furniture</span>
            </div>
            <p className="opacity-70 text-[9px]">© 2026 SKF Stainless Steel. Live Preview Mode.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default ThemePreview;
