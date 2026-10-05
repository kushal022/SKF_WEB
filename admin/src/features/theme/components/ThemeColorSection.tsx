import type { ThemeColors } from '../../../types/theme';

interface ThemeColorSectionProps {
  colors: ThemeColors;
  onChange: (key: keyof ThemeColors, value: string) => void;
  disabled?: boolean;
}

interface ColorFieldConfig {
  key: keyof ThemeColors;
  label: string;
  description: string;
  defaultHex: string;
}

const COLOR_FIELDS: ColorFieldConfig[] = [
  {
    key: 'primary_color',
    label: 'Primary Brand Color',
    description: 'Main headers, navigation bar, primary buttons, and key brand elements.',
    defaultHex: '#0f172a',
  },
  {
    key: 'secondary_color',
    label: 'Secondary Brand Color',
    description: 'Subtle badges, borders, secondary actions, and contrasting accents.',
    defaultHex: '#475569',
  },
  {
    key: 'accent_color',
    label: 'Accent & Highlight Color',
    description: 'Gold/steel highlights, prominent CTAs, active states, and focal icons.',
    defaultHex: '#0284c7',
  },
  {
    key: 'background_color',
    label: 'Page Background',
    description: 'Underlying canvas color for the public client website.',
    defaultHex: '#f8fafc',
  },
  {
    key: 'surface_color',
    label: 'Surface & Card Color',
    description: 'Background for cards, dialogs, drawers, and elevated sections.',
    defaultHex: '#ffffff',
  },
  {
    key: 'text_color',
    label: 'Primary Text Color',
    description: 'Main headlines, body copy, and high-contrast typography.',
    defaultHex: '#0f172a',
  },
  {
    key: 'muted_text_color',
    label: 'Muted Text Color',
    description: 'Subtitles, timestamps, specifications, and secondary copy.',
    defaultHex: '#64748b',
  },
  {
    key: 'border_color',
    label: 'Border & Divider Color',
    description: 'Subtle separator lines, table borders, and card outlines.',
    defaultHex: '#e2e8f0',
  },
  {
    key: 'success_color',
    label: 'Success State Color',
    description: 'Order confirmed badges, stock indicators, and verification marks.',
    defaultHex: '#16a34a',
  },
  {
    key: 'warning_color',
    label: 'Warning State Color',
    description: 'Pending statuses, custom fabrication alerts, and caution badges.',
    defaultHex: '#d97706',
  },
  {
    key: 'error_color',
    label: 'Error & Danger Color',
    description: 'Out of stock alerts, validation errors, and rejection tags.',
    defaultHex: '#dc2626',
  },
];

export function ThemeColorSection({ colors, onChange, disabled }: ThemeColorSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {COLOR_FIELDS.map(({ key, label, description, defaultHex }) => {
          const rawValue = colors[key];
          const hexValue = (rawValue && rawValue.startsWith('#') ? rawValue : defaultHex).slice(0, 7);

          return (
            <div
              key={key}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-2 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {label}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-slate-500 uppercase">
                    {hexValue}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{description}</p>
              </div>

              <div className="flex items-center gap-2 mt-1">
                {/* Native Color Picker swatch wrapper */}
                <div className="relative w-8 h-8 rounded-md overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer shadow-inner">
                  <input
                    type="color"
                    value={hexValue}
                    onChange={(e) => onChange(key, e.target.value)}
                    disabled={disabled}
                    className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                    title={`Pick ${label}`}
                  />
                </div>

                {/* Direct HEX Text Input */}
                <input
                  type="text"
                  value={rawValue || ''}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={defaultHex}
                  disabled={disabled}
                  maxLength={9}
                  className="flex-1 px-2.5 py-1 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ThemeColorSection;
