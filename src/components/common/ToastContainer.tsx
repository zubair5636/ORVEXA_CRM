import React from 'react';
import { useCrm } from '../../context/CrmContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useCrm();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'error'
            ? AlertCircle
            : toast.type === 'warning'
            ? AlertTriangle
            : Info;

        const borderCol =
          toast.type === 'success'
            ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            : toast.type === 'error'
            ? 'border-rose-500/40 text-rose-600 dark:text-rose-400'
            : toast.type === 'warning'
            ? 'border-amber-500/40 text-amber-600 dark:text-amber-400'
            : 'border-blue-500/40 text-blue-600 dark:text-blue-400';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border ${borderCol} rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 transition-all duration-200 animate-in fade-in slide-in-from-bottom-3`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-2">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors p-1 -mr-1 -mt-1"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
