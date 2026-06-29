'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfirmDialogVariant = 'danger' | 'warning';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  loadingLabel?: string;
  isLoading?: boolean;
  variant?: ConfirmDialogVariant;
}

const variantStyles: Record<ConfirmDialogVariant, { iconBg: string; icon: string; title: string; confirmBtn: string }> = {
  danger: {
    iconBg: 'bg-red-50 dark:bg-red-950/30',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-600 dark:text-red-400',
    confirmBtn: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-600',
  },
  warning: {
    iconBg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-600 dark:text-amber-400',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-600',
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  loadingLabel,
  isLoading,
  variant = 'danger',
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && !isLoading && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, isLoading, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const styles = variantStyles[variant];

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div
        className="absolute inset-0"
        onClick={() => !isLoading && onClose()}
      />
      <div
        className={cn(
          'relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-150',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label={cancelLabel}
          className="absolute top-4 end-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center px-6 pt-7 pb-2">
          <div className={cn('flex items-center justify-center w-12 h-12 rounded-full mb-4', styles.iconBg)}>
            <AlertTriangle className={cn('w-6 h-6', styles.icon)} />
          </div>
          <h2 id="confirm-dialog-title" className={cn('text-base font-semibold', styles.title)}>
            {title}
          </h2>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</div>
        </div>

        <div className="flex items-center gap-3 px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              styles.confirmBtn,
            )}
          >
            {isLoading ? loadingLabel ?? confirmLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
