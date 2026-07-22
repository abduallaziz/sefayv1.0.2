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
    iconBg: 'bg-posCloud-danger-light dark:bg-posCloud-danger/15',
    icon: 'text-posCloud-danger',
    title: 'text-posCloud-danger',
    confirmBtn: 'bg-posCloud-danger hover:brightness-95 focus-visible:ring-posCloud-danger',
  },
  warning: {
    iconBg: 'bg-posCloud-warning-light dark:bg-posCloud-warning/15',
    icon: 'text-posCloud-warning',
    title: 'text-posCloud-warning',
    confirmBtn: 'bg-posCloud-warning hover:brightness-95 focus-visible:ring-posCloud-warning',
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
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        className="absolute inset-0"
        onClick={() => !isLoading && onClose()}
      />
      <div
        className={cn(
          'relative w-full max-w-sm rounded-2xl bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-150',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label={cancelLabel}
          className="absolute top-4 end-4 p-1.5 rounded-lg text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40 transition-colors disabled:opacity-50"
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
          <div className="mt-2 text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{message}</div>
        </div>

        <div className="flex items-center gap-3 px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40 transition-colors disabled:opacity-50"
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
