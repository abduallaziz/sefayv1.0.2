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
  // Matrix D6: `theme` prop is a per-section variant, unrelated to the
  // global light/dark toggle. 'superadmin' keeps its own fixed dark navy
  // surface (unchanged). 'dashboard' previously had no dark: classes at
  // all — confirmed live (readiness/fiscal-period cards stayed white on a
  // dark shell) — added here matching StatCard's/PageHeader's existing
  // posCloud/posCloudDark pairing, additive only, light mode unchanged.
  const bgColor     = theme === 'superadmin' ? 'bg-posCloudDark-surface' : 'bg-posCloud-surface dark:bg-posCloudDark-surface';
  const borderColor = theme === 'superadmin' ? 'border-posCloudDark-border' : 'border-posCloud-border dark:border-posCloudDark-border';
  const textColor   = theme === 'superadmin' ? 'text-posCloudDark-text-secondary' : 'text-posCloud-text-primary dark:text-posCloudDark-text-primary';
  const mutedColor  = theme === 'superadmin' ? 'text-posCloudDark-text-tertiary' : 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary';
  const divColor    = theme === 'superadmin' ? 'border-posCloudDark-border' : 'border-slate-100 dark:border-posCloudDark-border';

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