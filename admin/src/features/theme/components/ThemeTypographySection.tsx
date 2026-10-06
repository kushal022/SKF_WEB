import type { ThemeTypography, ThemeStyles } from '../../../types/theme';

interface ThemeTypographySectionProps {
  typography: ThemeTypography;
  styles: ThemeStyles;
  onTypographyChange: (key: keyof ThemeTypography, value: string) => void;
  onStylesChange: (key: keyof ThemeStyles, value: string) => void;
  disabled?: boolean;
}

const HEADING_FONT_OPTIONS = [
  { label: 'Outfit (Modern Architectural)', value: 'Outfit, sans-serif' },
  { label: 'Cinzel (Luxury Classical Serif)', value: 'Cinzel, serif' },
  { label: 'Plus Jakarta Sans (Clean Premium Sans)', value: 'Plus Jakarta Sans, sans-serif' },
  { label: 'Inter (Technical Precision)', value: 'Inter, sans-serif' },
  { label: 'Playfair Display (Bespoke Editorial)', value: 'Playfair Display, serif' },
  { label: 'System Default Sans', value: 'system-ui, -apple-system, sans-serif' },
];

const BODY_FONT_OPTIONS = [
  { label: 'Plus Jakarta Sans (Balanced & Readable)', value: 'Plus Jakarta Sans, sans-serif' },
  { label: 'Inter (High Legibility Neutral)', value: 'Inter, sans-serif' },
  { label: 'Roboto (Industrial Clean)', value: 'Roboto, sans-serif' },
  { label: 'System Default Sans', value: 'system-ui, -apple-system, sans-serif' },
];

const RADIUS_OPTIONS = [
  { label: 'None / Sharp (0px)', value: '0px' },
  { label: 'Subtle Minimal (4px)', value: '4px' },
  { label: 'Standard Medium (8px)', value: '8px' },
  { label: 'Smooth Large (12px)', value: '12px' },
  { label: 'Extra Rounded (16px)', value: '16px' },
  { label: 'Pill Radius (9999px)', value: '9999px' },
];

const BUTTON_STYLE_OPTIONS = [
  { label: 'Rounded Solid', value: 'rounded' },
  { label: 'Pill Shape', value: 'pill' },
  { label: 'Sharp Architectural', value: 'sharp' },
  { label: 'Soft Contoured', value: 'soft' },
  { label: 'Glassmorphic Luxury', value: 'glass' },
];

const CARD_STYLE_OPTIONS = [
  { label: 'Elevated (Subtle Drop Shadow)', value: 'elevated' },
  { label: 'Bordered (Clean Outline)', value: 'bordered' },
  { label: 'Minimal (Clean Flat Surface)', value: 'minimal' },
  { label: 'Flat (No Shadow, Flush)', value: 'flat' },
];

export function ThemeTypographySection({
  typography,
  styles,
  onTypographyChange,
  onStylesChange,
  disabled,
}: ThemeTypographySectionProps) {
  return (
    <div className="space-y-6">
      {/* Typography Settings */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Typography System
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Heading Font Family
            </label>
            <select
              value={typography.heading_font || 'Outfit, sans-serif'}
              onChange={(e) => onTypographyChange('heading_font', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
            >
              {HEADING_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Applied to page titles, hero headers, and card titles.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Body Copy Font Family
            </label>
            <select
              value={typography.body_font || 'Plus Jakarta Sans, sans-serif'}
              onChange={(e) => onTypographyChange('body_font', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
            >
              {BODY_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Applied to product specs, descriptions, tables, and nav items.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Heading Weight
            </label>
            <select
              value={typography.heading_weight || '700'}
              onChange={(e) => onTypographyChange('heading_weight', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
            >
              <option value="600">600 (Semi-Bold)</option>
              <option value="700">700 (Bold)</option>
              <option value="800">800 (Extra Bold)</option>
              <option value="bold">Standard Bold</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Body Weight
            </label>
            <select
              value={typography.body_weight || '400'}
              onChange={(e) => onTypographyChange('body_weight', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
            >
              <option value="400">400 (Regular)</option>
              <option value="500">500 (Medium)</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Layout & Component Styles */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Layout & Component Geometry
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Corner Border Radius
            </label>
            <select
              value={styles.border_radius || '8px'}
              onChange={(e) => onStylesChange('border_radius', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
            >
              {RADIUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Button Style
            </label>
            <select
              value={styles.button_style || 'rounded'}
              onChange={(e) => onStylesChange('button_style', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
            >
              {BUTTON_STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Card Style
            </label>
            <select
              value={styles.card_style || 'elevated'}
              onChange={(e) => onStylesChange('card_style', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
            >
              {CARD_STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemeTypographySection;
