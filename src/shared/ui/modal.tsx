'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'superadmin' | 'dashboard';
  closeOnOverlay?: boolean;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  theme = 'dashboard',
  closeOnOverlay = true,
}: ModalProps) {
  // ESC key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const bgColor     = theme === 'superadmin' ? 'bg-[#1a1f2e]'    : 'bg-white';
  const borderColor = theme === 'superadmin' ? 'border-[#1e2130]' : 'border-[#e2e8f0]';
  const textColor   = theme === 'superadmin' ? 'text-[#e2e8f0]'  : 'text-[#0f172a]';
  const mutedColor  = theme === 'superadmin' ? 'text-[#64748b]'  : 'text-[#64748b]';
  const divColor    = theme === 'superadmin' ? 'border-[#1e2130]' : 'border-[#f1f5f9]';
  const closeBtn    = theme === 'superadmin'
    ? 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2436]'
    : 'text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f1f5f9]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      {/* Dialog */}
      <div
        className={cn(
          'relative w-full rounded-xl border shadow-xl',
          'animate-in fade-in zoom-in-95 duration-200',
          sizeMap[size],
          bgColor,
          borderColor
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description) && (
          <div className={cn('flex items-start justify-between gap-4 p-5 border-b', divColor)}>
            <div>
              {title && <h3 className={cn('text-base font-semibold', textColor)}>{title}</h3>}
              {description && <p className={cn('mt-1 text-sm', mutedColor)}>{description}</p>}
            </div>
            <button
              onClick={onClose}
              className={cn('rounded-lg p-1.5 transition-colors', closeBtn)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="p-5">{children}</div>
        {/* Footer */}
        {footer && (
          <div className={cn('flex items-center justify-end gap-2 p-5 border-t', divColor)}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}