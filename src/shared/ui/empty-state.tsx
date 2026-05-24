import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  theme?: 'superadmin' | 'dashboard';
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
  const iconBg   = theme === 'superadmin' ? 'bg-[#1e2436] text-[#64748b]' : 'bg-[#f1f5f9] text-[#94a3b8]';
  const titleC   = theme === 'superadmin' ? 'text-[#e2e8f0]' : 'text-[#0f172a]';
  const descC    = theme === 'superadmin' ? 'text-[#64748b]' : 'text-[#64748b]';

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