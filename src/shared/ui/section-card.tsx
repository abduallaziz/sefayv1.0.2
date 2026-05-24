import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  theme?: 'superadmin' | 'dashboard';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function SectionCard({
  title,
  description,
  actions,
  children,
  theme = 'dashboard',
  padding = 'md',
  className,
}: SectionCardProps) {
  const bgColor     = theme === 'superadmin' ? 'bg-[#1a1f2e]' : 'bg-white';
  const borderColor = theme === 'superadmin' ? 'border-[#1e2130]' : 'border-[#e2e8f0]';
  const textColor   = theme === 'superadmin' ? 'text-[#e2e8f0]' : 'text-[#0f172a]';
  const mutedColor  = theme === 'superadmin' ? 'text-[#64748b]' : 'text-[#64748b]';
  const divColor    = theme === 'superadmin' ? 'border-[#1e2130]' : 'border-[#f1f5f9]';

  const hasHeader = title || description || actions;

  return (
    <div className={cn('rounded-xl border', bgColor, borderColor, className)}>
      {hasHeader && (
        <div className={cn('flex items-center justify-between gap-4 p-5', hasHeader && children ? `border-b ${divColor}` : '')}>
          <div className="min-w-0">
            {title && (
              <h3 className={cn('text-base font-semibold', textColor)}>{title}</h3>
            )}
            {description && (
              <p className={cn('mt-0.5 text-sm', mutedColor)}>{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={paddingMap[padding]}>{children}</div>
    </div>
  );
}