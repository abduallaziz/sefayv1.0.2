import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  theme?: 'superadmin' | 'dashboard';
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  theme = 'dashboard',
  className,
}: PageHeaderProps) {
  const textColor   = theme === 'superadmin' ? 'text-[#e2e8f0]' : 'text-[#0f172a]';
  const mutedColor  = theme === 'superadmin' ? 'text-[#64748b]' : 'text-[#64748b]';
  const borderColor = theme === 'superadmin' ? 'border-[#1e2130]' : 'border-[#e2e8f0]';

  return (
    <div className={cn('pb-5 mb-6 border-b', borderColor, className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-3 flex items-center gap-1.5">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className={cn('text-xs', mutedColor)}>/</span>}
              <span className={cn('text-xs font-medium', i === breadcrumb.length - 1 ? mutedColor : 'text-[#6366f1] cursor-pointer hover:underline')}>
                {item.label}
              </span>
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className={cn('text-2xl font-bold tracking-tight truncate', textColor)}>
            {title}
          </h1>
          {description && (
            <p className={cn('mt-1 text-sm', mutedColor)}>{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}