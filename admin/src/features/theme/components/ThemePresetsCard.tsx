import { Sparkles, ArrowRight, Eye } from 'lucide-react';
import { Button } from '../../../components/ui';
import type { ThemePreset, ThemePresetConfig } from '../../../types/theme';

interface ThemePresetsCardProps {
  presets: ThemePreset[];
  activeDraftPublicId?: string;
  onApplyPreset: (preset: ThemePreset) => void;
  onPreviewPreset: (config: ThemePresetConfig, name: string) => void;
  isApplying?: boolean;
}

// Built-in architectural luxury presets if database is initially empty
const CURATED_SYSTEM_PRESETS: ThemePreset[] = [
  {
    public_id: 'preset-system-1',
    name: 'Platinum Modern Steel',
    description: 'Clean architectural brushed steel with crisp slate contrasts and vibrant cyan accents.',
    theme_config: {
      primary_color: '#0f172a',
      secondary_color: '#475569',
      accent_color: '#0284c7',
      background_color: '#f8fafc',
      surface_color: '#ffffff',
      text_color: '#0f172a',
      muted_text_color: '#64748b',
      border_color: '#e2e8f0',
      heading_font: 'Outfit, sans-serif',
      body_font: 'Plus Jakarta Sans, sans-serif',
      border_radius: '8px',
      button_style: 'rounded',
      card_style: 'elevated',
    },
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    public_id: 'preset-system-2',
    name: 'Champagne Gold & Mirror Steel',
    description: 'Ultra-luxury showroom aesthetic with champagne gold focal tones and rich obsidian foundations.',
    theme_config: {
      primary_color: '#1a1a1a',
      secondary_color: '#b48a3c',
      accent_color: '#d4af37',
      background_color: '#faf8f5',
      surface_color: '#ffffff',
      text_color: '#18181b',
      muted_text_color: '#71717a',
      border_color: '#ede8df',
      heading_font: 'Cinzel, serif',
      body_font: 'Plus Jakarta Sans, sans-serif',
      border_radius: '6px',
      button_style: 'sharp',
      card_style: 'bordered',
    },
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    public_id: 'preset-system-3',
    name: 'Industrial Chrome Minimal',
    description: 'Dark-mode high precision brushed chrome with deep charcoal surfaces and pill accents.',
    theme_config: {
      primary_color: '#18181b',
      secondary_color: '#71717a',
      accent_color: '#38bdf8',
      background_color: '#09090b',
      surface_color: '#18181b',
      text_color: '#f4f4f5',
      muted_text_color: '#a1a1aa',
      border_color: '#27272a',
      heading_font: 'Inter, sans-serif',
      body_font: 'Inter, sans-serif',
      border_radius: '16px',
      button_style: 'pill',
      card_style: 'minimal',
    },
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    public_id: 'preset-system-4',
    name: 'Emerald Bespoke Architectural',
    description: 'Distinguished deep emerald green highlights tailored for luxury hotels and heritage dining tables.',
    theme_config: {
      primary_color: '#064e3b',
      secondary_color: '#047857',
      accent_color: '#10b981',
      background_color: '#f0fdf4',
      surface_color: '#ffffff',
      text_color: '#064e3b',
      muted_text_color: '#374151',
      border_color: '#d1fae5',
      heading_font: 'Playfair Display, serif',
      body_font: 'Plus Jakarta Sans, sans-serif',
      border_radius: '12px',
      button_style: 'soft',
      card_style: 'elevated',
    },
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function ThemePresetsCard({
  presets,
  onApplyPreset,
  onPreviewPreset,
  isApplying,
}: ThemePresetsCardProps) {
  // Use database presets if available, fallback to curated system presets
  const displayPresets = presets && presets.length > 0 ? presets : CURATED_SYSTEM_PRESETS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[var(--brand-accent)]" />
            Curated Theme Presets
          </h4>
          <p className="text-xs text-slate-500">
            Select a design system preset to immediately preview and load into your current draft.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayPresets.map((preset) => {
          const config = typeof preset.theme_config === 'string'
            ? JSON.parse(preset.theme_config)
            : preset.theme_config;

          const pColor = config?.primary_color || '#0f172a';
          const sColor = config?.secondary_color || '#475569';
          const aColor = config?.accent_color || '#0284c7';
          const bColor = config?.background_color || '#ffffff';
          const surfColor = config?.surface_color || '#f8fafc';

          return (
            <div
              key={preset.public_id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-xs group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[var(--brand-accent)] transition-colors">
                    {preset.name}
                  </h5>
                  {preset.is_system && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      System
                    </span>
                  )}
                </div>

                {preset.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {preset.description}
                  </p>
                )}

                {/* Color Palette Swatch Row */}
                <div className="space-y-1.5 mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Palette Swatches
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div
                      style={{ backgroundColor: pColor }}
                      className="w-6 h-6 rounded-full border border-black/10 shadow-xs"
                      title={`Primary: ${pColor}`}
                    />
                    <div
                      style={{ backgroundColor: sColor }}
                      className="w-6 h-6 rounded-full border border-black/10 shadow-xs"
                      title={`Secondary: ${sColor}`}
                    />
                    <div
                      style={{ backgroundColor: aColor }}
                      className="w-6 h-6 rounded-full border border-black/10 shadow-xs ring-2 ring-white/50"
                      title={`Accent: ${aColor}`}
                    />
                    <div
                      style={{ backgroundColor: bColor }}
                      className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700 shadow-xs"
                      title={`Background: ${bColor}`}
                    />
                    <div
                      style={{ backgroundColor: surfColor }}
                      className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700 shadow-xs"
                      title={`Surface: ${surfColor}`}
                    />
                  </div>
                </div>

                {/* Typography & Layout Badges */}
                <div className="flex flex-wrap gap-1 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    {config?.heading_font ? config.heading_font.split(',')[0] : 'Heading'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    {config?.border_radius || '8px'} Radius
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    {config?.button_style || 'rounded'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPreviewPreset(config, preset.name)}
                  className="flex-1 text-xs"
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                >
                  Preview
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onApplyPreset(preset)}
                  disabled={isApplying}
                  className="flex-1 text-xs"
                  leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Apply to Draft
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ThemePresetsCard;
