'use client';

import { useEffect } from 'react';
import config from '@/lib/config';

export function ActiveThemeProvider() {
  useEffect(() => {
    let isMounted = true;

    async function loadActiveTheme() {
      try {
        const res = await fetch(`${config.apiBaseUrl}/theme/public`, { credentials: 'omit' });
        if (!res.ok) return;
        const data = await res.json();
        const theme = data?.data?.theme;
        if (!theme || !isMounted) return;

        const root = document.documentElement;
        if (theme.primary_color) root.style.setProperty('--brand-primary', theme.primary_color);
        if (theme.secondary_color) root.style.setProperty('--brand-secondary', theme.secondary_color);
        if (theme.accent_color) root.style.setProperty('--brand-accent', theme.accent_color);
        if (theme.background_color) root.style.setProperty('--surface-background', theme.background_color);
        if (theme.surface_color) {
          root.style.setProperty('--surface-surface', theme.surface_color);
          root.style.setProperty('--surface-elevated', theme.surface_color);
        }
        if (theme.text_color) root.style.setProperty('--text-primary', theme.text_color);
        if (theme.muted_text_color) root.style.setProperty('--text-muted', theme.muted_text_color);
        if (theme.border_color) root.style.setProperty('--border-border', theme.border_color);
        if (theme.success_color) root.style.setProperty('--status-success', theme.success_color);
        if (theme.warning_color) root.style.setProperty('--status-warning', theme.warning_color);
        if (theme.error_color) root.style.setProperty('--status-error', theme.error_color);
        if (theme.heading_font) root.style.setProperty('--font-heading', theme.heading_font);
        if (theme.body_font) root.style.setProperty('--font-sans', theme.body_font);
        if (theme.border_radius) root.style.setProperty('--radius-md', theme.border_radius);
      } catch {
        // Fall back gracefully to default tokens in globals.css
      }
    }

    loadActiveTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}

export default ActiveThemeProvider;
