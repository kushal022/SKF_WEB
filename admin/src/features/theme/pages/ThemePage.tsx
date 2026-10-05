import { useState } from 'react';
import {
  Palette,
  Sparkles,
  Save,
  Upload,
  AlertCircle,
  RotateCcw,
  Type,
  History,
  Eye,
  Plus,
} from 'lucide-react';
import {
  useGetThemesQuery,
  useGetThemePresetsQuery,
  useUpdateThemeMutation,
  usePublishThemeMutation,
  useCreateThemeMutation,
  useApplyThemePresetMutation,
} from '../../../app/store/api';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  LoadingState,
  useToast,
  Badge,
  Modal,
} from '../../../components/ui';
import ThemeColorSection from '../components/ThemeColorSection';
import ThemeTypographySection from '../components/ThemeTypographySection';
import ThemePreview from '../components/ThemePreview';
import ThemePresetsCard from '../components/ThemePresetsCard';
import ThemeHistorySection from '../components/ThemeHistorySection';
import type {
  ThemeSetting,
  ThemeColors,
  ThemeTypography,
  ThemeStyles,
  ThemePreset,
  ThemePresetConfig,
  UpdateThemePayload,
} from '../../../types/theme';

interface ThemeEditorFormProps {
  initialTheme: ThemeSetting;
  allThemes: ThemeSetting[];
  presets: ThemePreset[];
  publishedTheme?: ThemeSetting;
  onSaveDraft: (publicId: string, payload: UpdateThemePayload) => Promise<void>;
  onPublish: (publicId: string, payload?: UpdateThemePayload) => Promise<void>;
  onCreateNewDraft: () => Promise<void>;
  onApplyPreset: (preset: ThemePreset, targetPublicId: string) => Promise<void>;
  onRollback: (theme: ThemeSetting) => Promise<void>;
  isSavingDraft: boolean;
  isPublishing: boolean;
  isCreating: boolean;
  isApplyingPreset: boolean;
}

const FALLBACK_THEME: ThemeSetting = {
  public_id: 'default-theme',
  name: 'Default Luxury Steel',
  status: 'published',
  version: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function ThemeEditorForm({
  initialTheme,
  allThemes,
  presets,
  publishedTheme,
  onSaveDraft,
  onPublish,
  onCreateNewDraft,
  onApplyPreset,
  onRollback,
  isSavingDraft,
  isPublishing,
  isCreating,
  isApplyingPreset,
}: ThemeEditorFormProps) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'presets' | 'history'>('colors');
  const [themeName, setThemeName] = useState(initialTheme.name || 'Custom Theme');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Colors State
  const [colors, setColors] = useState<ThemeColors>({
    primary_color: initialTheme.primary_color || '#0f172a',
    secondary_color: initialTheme.secondary_color || '#475569',
    accent_color: initialTheme.accent_color || '#0284c7',
    background_color: initialTheme.background_color || '#f8fafc',
    surface_color: initialTheme.surface_color || '#ffffff',
    text_color: initialTheme.text_color || '#0f172a',
    muted_text_color: initialTheme.muted_text_color || '#64748b',
    border_color: initialTheme.border_color || '#e2e8f0',
    success_color: initialTheme.success_color || '#16a34a',
    warning_color: initialTheme.warning_color || '#d97706',
    error_color: initialTheme.error_color || '#dc2626',
  });

  // Typography State
  const [typography, setTypography] = useState<ThemeTypography>({
    heading_font: initialTheme.heading_font || 'Outfit, sans-serif',
    body_font: initialTheme.body_font || 'Plus Jakarta Sans, sans-serif',
    heading_weight: initialTheme.heading_weight || '700',
    body_weight: initialTheme.body_weight || '400',
  });

  // Layout & Styles State
  const [styles, setStyles] = useState<ThemeStyles>({
    border_radius: initialTheme.border_radius || '8px',
    button_style: initialTheme.button_style || 'rounded',
    card_style: initialTheme.card_style || 'elevated',
  });

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleTypographyChange = (key: keyof ThemeTypography, value: string) => {
    setTypography((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleStylesChange = (key: keyof ThemeStyles, value: string) => {
    setStyles((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = async () => {
    try {
      const payload: UpdateThemePayload = {
        name: themeName.trim() || 'Custom Draft Theme',
        ...colors,
        ...typography,
        ...styles,
        status: 'draft',
      };
      await onSaveDraft(initialTheme.public_id, payload);
      setHasUnsavedChanges(false);
    } catch {
      // Error handled by parent
    }
  };

  const handlePublishConfirm = async () => {
    try {
      const payload: UpdateThemePayload = {
        name: themeName.trim() || 'Custom Theme',
        ...colors,
        ...typography,
        ...styles,
      };
      await onPublish(initialTheme.public_id, hasUnsavedChanges ? payload : undefined);
      setIsPublishModalOpen(false);
      setHasUnsavedChanges(false);
    } catch {
      // Error handled by parent
    }
  };

  const handlePreviewPreset = (presetConfig: ThemePresetConfig, name: string) => {
    setColors({
      primary_color: presetConfig.primary_color || colors.primary_color,
      secondary_color: presetConfig.secondary_color || colors.secondary_color,
      accent_color: presetConfig.accent_color || colors.accent_color,
      background_color: presetConfig.background_color || colors.background_color,
      surface_color: presetConfig.surface_color || colors.surface_color,
      text_color: presetConfig.text_color || colors.text_color,
      muted_text_color: presetConfig.muted_text_color || colors.muted_text_color,
      border_color: presetConfig.border_color || colors.border_color,
      success_color: presetConfig.success_color || colors.success_color,
      warning_color: presetConfig.warning_color || colors.warning_color,
      error_color: presetConfig.error_color || colors.error_color,
    });

    if (presetConfig.heading_font || presetConfig.body_font) {
      setTypography({
        heading_font: presetConfig.heading_font || typography.heading_font,
        body_font: presetConfig.body_font || typography.body_font,
        heading_weight: presetConfig.heading_weight || typography.heading_weight,
        body_weight: presetConfig.body_weight || typography.body_weight,
      });
    }

    if (presetConfig.border_radius || presetConfig.button_style || presetConfig.card_style) {
      setStyles({
        border_radius: presetConfig.border_radius || styles.border_radius,
        button_style: presetConfig.button_style || styles.button_style,
        card_style: presetConfig.card_style || styles.card_style,
      });
    }

    setHasUnsavedChanges(true);
    showToast('info', `Previewing "${name}" preset in draft editor.`, 'Preset Preview');
  };

  const handleResetToPublished = () => {
    if (!publishedTheme) return;
    setColors({
      primary_color: publishedTheme.primary_color || '#0f172a',
      secondary_color: publishedTheme.secondary_color || '#475569',
      accent_color: publishedTheme.accent_color || '#0284c7',
      background_color: publishedTheme.background_color || '#f8fafc',
      surface_color: publishedTheme.surface_color || '#ffffff',
      text_color: publishedTheme.text_color || '#0f172a',
      muted_text_color: publishedTheme.muted_text_color || '#64748b',
      border_color: publishedTheme.border_color || '#e2e8f0',
      success_color: publishedTheme.success_color || '#16a34a',
      warning_color: publishedTheme.warning_color || '#d97706',
      error_color: publishedTheme.error_color || '#dc2626',
    });
    setTypography({
      heading_font: publishedTheme.heading_font || 'Outfit, sans-serif',
      body_font: publishedTheme.body_font || 'Plus Jakarta Sans, sans-serif',
      heading_weight: publishedTheme.heading_weight || '700',
      body_weight: publishedTheme.body_weight || '400',
    });
    setStyles({
      border_radius: publishedTheme.border_radius || '8px',
      button_style: publishedTheme.button_style || 'rounded',
      card_style: publishedTheme.card_style || 'elevated',
    });
    setHasUnsavedChanges(true);
    showToast('info', 'Editor state reset to currently published theme tokens.', 'Reset');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Publication Workflow Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Settings</span>
            <span>/</span>
            <span className="text-[var(--brand-accent)]">Theme & Appearance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-1">
            <Palette className="w-6 h-6 text-[var(--brand-accent)]" />
            Theme & Visual Appearance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full control over brand color palettes, typography, corner radius, component styles, and theme presets.
          </p>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {hasUnsavedChanges && (
            <Badge variant="warning" className="animate-pulse">
              Unsaved Draft Changes
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onCreateNewDraft}
            disabled={isCreating}
            leftIcon={<Plus className="w-4 h-4" />}
            title="Create a new draft branch"
          >
            New Draft
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            isLoading={isSavingDraft}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Draft
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPublishModalOpen(true)}
            disabled={isPublishing}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Publish Theme
          </Button>
        </div>
      </div>

      {/* Theme State & Workflow Progress Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Live Active Theme:
              </span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {publishedTheme?.name || 'Default Luxury Steel'}
              </span>
              <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold">
                v{publishedTheme?.version || 1}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft changes are safely simulated below. Click "Publish Theme" when ready to make changes live.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToPublished}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs text-slate-600 dark:text-slate-400"
          >
            Reset to Live Published
          </Button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Theme Controls */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Theme Name
                  </label>
                  <Input
                    value={themeName}
                    onChange={(e) => {
                      setThemeName(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="E.g. Platinum Modern Steel 2026"
                    className="font-bold text-base"
                  />
                </div>
              </div>

              {/* Sub-tabs within Editor */}
              <div className="flex items-center gap-1 mt-4 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('colors')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'colors'
                      ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Color Palette</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('typography')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'typography'
                      ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Typography & Layout</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'presets'
                      ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Presets ({presets.length || 4})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'history'
                      ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Versions ({allThemes.length})</span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Tab 1: Colors */}
              {activeTab === 'colors' && (
                <ThemeColorSection
                  colors={colors}
                  onChange={handleColorChange}
                  disabled={isSavingDraft || isPublishing}
                />
              )}

              {/* Tab 2: Typography & Styles */}
              {activeTab === 'typography' && (
                <ThemeTypographySection
                  typography={typography}
                  styles={styles}
                  onTypographyChange={handleTypographyChange}
                  onStylesChange={handleStylesChange}
                  disabled={isSavingDraft || isPublishing}
                />
              )}

              {/* Tab 3: Presets */}
              {activeTab === 'presets' && (
                <ThemePresetsCard
                  presets={presets}
                  activeDraftPublicId={initialTheme.public_id}
                  onApplyPreset={(p) => onApplyPreset(p, initialTheme.public_id)}
                  onPreviewPreset={handlePreviewPreset}
                  isApplying={isApplyingPreset}
                />
              )}

              {/* Tab 4: Version History */}
              {activeTab === 'history' && (
                <ThemeHistorySection
                  themes={allThemes}
                  onPreviewVersion={(t) => {
                    setColors({
                      primary_color: t.primary_color || colors.primary_color,
                      secondary_color: t.secondary_color || colors.secondary_color,
                      accent_color: t.accent_color || colors.accent_color,
                      background_color: t.background_color || colors.background_color,
                      surface_color: t.surface_color || colors.surface_color,
                      text_color: t.text_color || colors.text_color,
                      muted_text_color: t.muted_text_color || colors.muted_text_color,
                      border_color: t.border_color || colors.border_color,
                      success_color: t.success_color || colors.success_color,
                      warning_color: t.warning_color || colors.warning_color,
                      error_color: t.error_color || colors.error_color,
                    });
                    setTypography({
                      heading_font: t.heading_font || typography.heading_font,
                      body_font: t.body_font || typography.body_font,
                      heading_weight: t.heading_weight || typography.heading_weight,
                      body_weight: t.body_weight || typography.body_weight,
                    });
                    setStyles({
                      border_radius: t.border_radius || styles.border_radius,
                      button_style: t.button_style || styles.button_style,
                      card_style: t.card_style || styles.card_style,
                    });
                    setThemeName(t.name);
                    showToast('info', `Previewing Version v${t.version} in simulator.`, 'Preview Loaded');
                  }}
                  onRollbackVersion={onRollback}
                  isRollingBack={isPublishing}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sticky Live Interactive Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[var(--brand-accent)]" />
              Live Interactive Website Preview
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Real-time Draft Feedback
            </span>
          </div>

          <div className="h-[620px]">
            <ThemePreview
              colors={colors}
              typography={typography}
              styles={styles}
              themeName={themeName}
              isDraft={hasUnsavedChanges}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Theme Publication */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => {
          if (!isPublishing) setIsPublishModalOpen(false);
        }}
        title="Publish Live Website Theme"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs">
            <div>
              <p className="font-bold text-sm mb-1">
                Publish "{themeName}" to Public Website?
              </p>
              <p className="leading-relaxed">
                This will make the current draft theme live on the public website. Any previous active theme will be archived into version history.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Theme Name:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{themeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Public ID:</span>
              <span className="font-mono text-[11px] text-slate-500">
                {initialTheme.public_id}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPublishModalOpen(false)}
              disabled={isPublishing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePublishConfirm}
              isLoading={isPublishing}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Confirm & Publish Live
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function ThemePage() {
  const { data: themesData, isLoading: isLoadingThemes, isError, refetch } = useGetThemesQuery();
  const { data: presetsData } = useGetThemePresetsQuery();

  const [updateTheme, { isLoading: isSavingDraft }] = useUpdateThemeMutation();
  const [publishTheme, { isLoading: isPublishing }] = usePublishThemeMutation();
  const [createTheme, { isLoading: isCreating }] = useCreateThemeMutation();
  const [applyPreset, { isLoading: isApplyingPreset }] = useApplyThemePresetMutation();

  const { showToast } = useToast();

  const themes: ThemeSetting[] = themesData?.data?.themes || [];
  const presets: ThemePreset[] = presetsData?.data?.presets || [];

  const publishedTheme = themes.find((t) => t.status === 'published') || themes[0];
  const editableTheme =
    themes.find((t) => t.status === 'draft') || themes.find((t) => t.status === 'published') || themes[0];

  const handleSaveDraft = async (publicId: string, payload: UpdateThemePayload) => {
    try {
      await updateTheme({ publicId, payload }).unwrap();
      showToast('success', 'Theme draft saved successfully.', 'Draft Updated');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to save theme draft.';
      showToast('error', msg, 'Save Error');
      throw err;
    }
  };

  const handlePublish = async (publicId: string, payload?: UpdateThemePayload) => {
    try {
      if (payload) {
        await updateTheme({ publicId, payload }).unwrap();
      }
      const res = await publishTheme(publicId).unwrap();
      const v = res?.data?.theme?.version;
      showToast(
        'success',
        `Theme version ${v ? `v${v}` : ''} is now active and live on the public website.`,
        'Theme Published'
      );
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to publish theme.';
      showToast('error', msg, 'Publish Error');
      throw err;
    }
  };

  const handleCreateNewDraft = async () => {
    try {
      const base = editableTheme || publishedTheme;
      const res = await createTheme({
        name: `${base?.name || 'Luxury Steel'} (New Draft)`,
        primary_color: base?.primary_color || '#0f172a',
        secondary_color: base?.secondary_color || '#475569',
        accent_color: base?.accent_color || '#0284c7',
        background_color: base?.background_color || '#f8fafc',
        surface_color: base?.surface_color || '#ffffff',
        text_color: base?.text_color || '#0f172a',
        muted_text_color: base?.muted_text_color || '#64748b',
        border_color: base?.border_color || '#e2e8f0',
        heading_font: base?.heading_font || 'Outfit, sans-serif',
        body_font: base?.body_font || 'Plus Jakarta Sans, sans-serif',
        border_radius: base?.border_radius || '8px',
        status: 'draft',
      }).unwrap();

      const created = res.data?.theme;
      if (created) {
        showToast('success', 'New draft theme created and selected.', 'Draft Initialized');
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to create new draft.';
      showToast('error', msg, 'Error');
    }
  };

  const handleApplyPreset = async (preset: ThemePreset, targetPublicId: string) => {
    try {
      await applyPreset({
        presetPublicId: preset.public_id,
        themePublicId: targetPublicId,
      }).unwrap();
      showToast('success', `Applied preset "${preset.name}" to current draft.`, 'Draft Updated');
    } catch {
      // If server preset call has any mismatch, fallback to direct theme update
      const config = typeof preset.theme_config === 'string'
        ? JSON.parse(preset.theme_config)
        : preset.theme_config;
      await updateTheme({
        publicId: targetPublicId,
        payload: { ...config, status: 'draft' },
      }).unwrap();
      showToast('success', `Applied preset "${preset.name}" to current draft.`, 'Draft Updated');
    }
  };

  const handleRollback = async (historicalTheme: ThemeSetting) => {
    try {
      await publishTheme(historicalTheme.public_id).unwrap();
      showToast(
        'success',
        `Website appearance rolled back to Version ${historicalTheme.version} (${historicalTheme.name}).`,
        'Rollback Completed'
      );
      refetch();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to execute rollback.';
      showToast('error', msg, 'Rollback Failed');
    }
  };

  if (isLoadingThemes) {
    return <LoadingState message="Loading design system & theme tokens..." />;
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Failed to Load Theme Configuration</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4">
              Unable to connect to the backend theme service.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <ThemeEditorForm
        key={editableTheme ? `${editableTheme.public_id}-${editableTheme.version}` : 'initial'}
        initialTheme={editableTheme || FALLBACK_THEME}
        allThemes={themes}
        presets={presets}
        publishedTheme={publishedTheme}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onCreateNewDraft={handleCreateNewDraft}
        onApplyPreset={handleApplyPreset}
        onRollback={handleRollback}
        isSavingDraft={isSavingDraft}
        isPublishing={isPublishing}
        isCreating={isCreating}
        isApplyingPreset={isApplyingPreset}
      />
    </div>
  );
}

export default ThemePage;
