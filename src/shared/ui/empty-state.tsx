import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  theme?: 'superadmin' | 'dashboard' | 'inventory';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { icon: 'w-8 h-8', title: 'text-sm', desc: 'text-xs', padding: 'py-8' },
  md: { icon: 'w-10 h-10', title: 'text-base', desc: 'text-sm', padding: 'py-12' },
  lg: { icon: 'w-12 h-12', title: 'text-lg', desc: 'text-sm', padding: 'py-16' },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  theme = 'dashboard',
  size = 'md',
  className,
}: EmptyStateProps) {
  const s = sizeMap[size];

  if (theme === 'inventory') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center text-center px-4 bg-posCloud-surface dark:bg-posCloudDark-surface border border-dashed border-posCloud-border dark:border-posCloudDark-border rounded-xl',
          s.padding,
          className,
        )}
      >
        {Icon && (
          <div className="p-4 rounded-full bg-posCloud-primary-light dark:bg-posCloud-primary/10 mb-4">
            <Icon size={32} className="text-posCloud-primary" />
          </div>
        )}
        <p className="text-base font-semibold text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{title}</p>
        {description && (
          <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mt-1 max-w-sm">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  // Matrix D6: `theme` prop is a per-section variant, unrelated to the
  // global light/dark toggle. 'superadmin' keeps its own fixed dark navy
  // surface (unchanged). 'dashboard' previously had no dark: classes at
  // all — confirmed live (permission-denied title was low-contrast on a
  // dark shell) — added here matching the 'inventory' branch's existing
  // posCloud/posCloudDark pairing above, additive only, light mode
  // unchanged.
  const iconBg   = theme === 'superadmin' ? 'bg-posCloudDark-border/40 text-posCloudDark-text-tertiary' : 'bg-posCloud-background dark:bg-posCloudDark-background text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary';
  const titleC   = theme === 'superadmin' ? 'text-posCloudDark-text-secondary' : 'text-posCloud-text-primary dark:text-posCloudDark-text-primary';
  const descC    = theme === 'superadmin' ? 'text-posCloudDark-text-tertiary' : 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary';

  return (
    <div className={cn('flex flex-col items-center justify-center text-center', s.padding, className)}>
      {Icon && (
        <div className={cn('rounded-xl p-3 mb-4', iconBg)}>
          <Icon className={s.icon} />
        </div>
      )}
      <p className={cn('font-semibold', s.title, titleC)}>{title}</p>
      {description && (
        <p className={cn('mt-1 max-w-sm', s.desc, descC)}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}