import { useState } from 'react';
import {
  History,
  RotateCcw,
  CheckCircle2,
  Archive,
  FileEdit,
  Eye,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Button, Badge, Modal } from '../../../components/ui';
import type { ThemeSetting } from '../../../types/theme';

interface ThemeHistorySectionProps {
  themes: ThemeSetting[];
  onPreviewVersion: (theme: ThemeSetting) => void;
  onRollbackVersion: (theme: ThemeSetting) => Promise<void>;
  isRollingBack?: boolean;
}

export function ThemeHistorySection({
  themes,
  onPreviewVersion,
  onRollbackVersion,
  isRollingBack,
}: ThemeHistorySectionProps) {
  const [selectedThemeForRollback, setSelectedThemeForRollback] = useState<ThemeSetting | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleOpenRollbackModal = (theme: ThemeSetting) => {
    setSelectedThemeForRollback(theme);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmRollback = async () => {
    if (!selectedThemeForRollback) return;
    await onRollbackVersion(selectedThemeForRollback);
    setIsConfirmModalOpen(false);
    setSelectedThemeForRollback(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <History className="w-4 h-4 text-[var(--brand-accent)]" />
          Theme Version History & Rollback
        </h4>
        <p className="text-xs text-slate-500">
          Chronological record of all theme versions and snapshots. Restore any previous published or archived state.
        </p>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
        {themes.map((t) => {
          const isPublished = t.status === 'published';
          const isDraft = t.status === 'draft';
          const isArchived = t.status === 'archived';

          return (
            <div
              key={t.public_id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isPublished ? 'bg-emerald-50/40 dark:bg-emerald-950/10' : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    v{t.version}
                  </span>

                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.name}
                  </h5>

                  {isPublished && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Live Active
                    </Badge>
                  )}
                  {isDraft && (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <FileEdit className="w-3 h-3" />
                      Current Draft
                    </Badge>
                  )}
                  {isArchived && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Archive className="w-3 h-3" />
                      Archived
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Created: {new Date(t.created_at).toLocaleDateString()}
                  </span>
                  {t.published_at && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Published: {new Date(t.published_at).toLocaleDateString()}
                    </span>
                  )}
                  <span className="font-mono text-[11px] text-slate-400">
                    ID: {t.public_id.slice(0, 8)}...
                  </span>
                </div>

                {/* Color swatches */}
                <div className="flex items-center gap-1.5 pt-1">
                  {t.primary_color && (
                    <div
                      style={{ backgroundColor: t.primary_color }}
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      title={`Primary: ${t.primary_color}`}
                    />
                  )}
                  {t.secondary_color && (
                    <div
                      style={{ backgroundColor: t.secondary_color }}
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      title={`Secondary: ${t.secondary_color}`}
                    />
                  )}
                  {t.accent_color && (
                    <div
                      style={{ backgroundColor: t.accent_color }}
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      title={`Accent: ${t.accent_color}`}
                    />
                  )}
                  {t.heading_font && (
                    <span className="text-[10px] text-slate-400 font-mono ml-2">
                      {t.heading_font.split(',')[0]} • {t.border_radius || '8px'}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPreviewVersion(t)}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Preview
                </Button>

                {!isPublished && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRollbackModal(t)}
                    disabled={isRollingBack}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-500" />}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:border-amber-400"
                  >
                    Restore
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Restore / Rollback */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          if (!isRollingBack) {
            setIsConfirmModalOpen(false);
            setSelectedThemeForRollback(null);
          }
        }}
        title="Confirm Theme Rollback"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-semibold text-sm mb-1">
                Restore Theme Version {selectedThemeForRollback?.version}?
              </p>
              <p className="leading-relaxed">
                The current live website theme will be rolled back to version{' '}
                <span className="font-bold">v{selectedThemeForRollback?.version}</span> (
                {selectedThemeForRollback?.name}). All public visitors will immediately see this theme.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsConfirmModalOpen(false);
                setSelectedThemeForRollback(null);
              }}
              disabled={isRollingBack}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmRollback}
              isLoading={isRollingBack}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Confirm Rollback
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ThemeHistorySection;
