/**
 * SKF Centralized Semantic Design Tokens
 * Note: Exact brand colors are abstracted into semantic tokens
 * for easy theming and dynamic overrides.
 */

export const tokens = {
  brand: {
    primary: 'var(--brand-primary)',
    primaryHover: 'var(--brand-primary-hover)',
    secondary: 'var(--brand-secondary)',
    accent: 'var(--brand-accent)',
  },
  surface: {
    background: 'var(--surface-background)',
    surface: 'var(--surface-surface)',
    muted: 'var(--surface-muted)',
    elevated: 'var(--surface-elevated)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    inverse: 'var(--text-inverse)',
  },
  border: {
    border: 'var(--border-border)',
    divider: 'var(--border-divider)',
  },
  status: {
    success: 'var(--status-success)',
    warning: 'var(--status-warning)',
    error: 'var(--status-error)',
    info: 'var(--status-info)',
  },
  typography: {
    family: {
      sans: 'var(--font-sans)',
      heading: 'var(--font-heading)',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadow: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  },
  motion: {
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export default tokens;
