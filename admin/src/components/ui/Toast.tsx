import React, { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastContext } from './ToastContext';
import type { ToastMessage } from './ToastContext';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastMessage['type'], message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, message, title, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-[var(--status-success)] shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-[var(--status-error)] shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-[var(--status-warning)] shrink-0" />,
            info: <Info className="w-5 h-5 text-[var(--status-info)] shrink-0" />,
          };

          return (
            <div
              key={toast.id}
              role="alert"
              className="pointer-events-auto flex items-start gap-3 p-4 bg-[var(--surface-surface)] border border-[var(--border-border)] rounded-lg shadow-lg"
            >
              {icons[toast.type]}
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
