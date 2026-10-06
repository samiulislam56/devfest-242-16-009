import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../types';

interface ToastSystemProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastSystem: React.FC<ToastSystemProps> = ({ toasts, onDismiss }) => {
  // Show max 5 visible
  const visibleToasts = toasts.slice(0, 5);

  if (visibleToasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" aria-hidden="true" />,
  };

  const bgBorders = {
    success: 'bg-surface border-emerald-500/30 text-text-primary shadow-lg',
    error: 'bg-surface border-rose-500/30 text-text-primary shadow-lg',
    warning: 'bg-surface border-amber-500/30 text-text-primary shadow-lg',
    info: 'bg-surface border-sky-500/30 text-text-primary shadow-lg',
  };

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {visibleToasts.map(toast => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border text-sm transition-all animate-in slide-in-from-bottom-3 duration-200 ${bgBorders[toast.type]}`}
        >
          {icons[toast.type]}
          <div className="flex-1 min-w-0">
            {toast.title && <div className="font-semibold text-xs mb-0.5">{toast.title}</div>}
            <div className="text-xs text-text-secondary break-words leading-relaxed">{toast.message}</div>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
