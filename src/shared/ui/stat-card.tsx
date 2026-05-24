import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  theme?: 'superadmin' | 'dashboard';
  className?: string;
}

const variantStyles = {
  superadmin: {
    default: 'bg-[#1a1f2e] border-[#1e2130]',
    success: 'bg-[#1a1f2e] border-[#22c55e30]',
    warning: 'bg-[#1a1f2e] border-[#f59e0b30]',
    danger:  'bg-[#1a1f2e] border-[#ef444430]',
    info:    'bg-[#1a1f2e] border-[#3b82f630]',
  },
  dashboard: {
    default: 'bg-white border-[#e2e8f0]',
    success: 'bg-white border-[#16a34a30]',
    warning: 'bg-white border-[#d9770630]',
    danger:  'bg-white border-[#dc262630]',
    info:    'bg-white border-[#2563eb30]',
  },
};

const iconBg = {
  default: 'bg-[#6366f115] text-[#6366f1]',
  success: 'bg-[#22c55e15] text-[#22c55e]',
  warning: 'bg-[#f59e0b15] text-[#f59e0b]',
  danger:  'bg-[#ef444415] text-[#ef4444]',
  info:    'bg-[#3b82f615] text-[#3b82f6]',
};

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = 'default',
  theme = 'dashboard',
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral  = change === 0;

  const textColor   = theme === 'superadmin' ? 'text-[#e2e8f0]' : 'text-[#0f172a]';
  const mutedColor  = theme === 'superadmin' ? 'text-[#64748b]' : 'text-[#64748b]';

  return (
    <div
      className={cn(
        'rounded-xl border p-5 transition-all duration-200',
        'hover:shadow-md',
        variantStyles[theme][variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-medium uppercase tracking-wide truncate', mutedColor)}>
            {title}
          </p>
          <p className={cn('mt-2 text-2xl font-bold tabular-nums', textColor)}>
            {value}
          </p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive && <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" />}
              {isNegative && <TrendingDown className="w-3.5 h-3.5 text-[#ef4444]" />}
              {isNeutral  && <Minus className="w-3.5 h-3.5 text-[#64748b]" />}
              <span className={cn(
                'text-xs font-medium',
                isPositive ? 'text-[#22c55e]' : isNegative ? 'text-[#ef4444]' : 'text-[#64748b]'
              )}>
                {isPositive ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className={cn('text-xs', mutedColor)}>{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('rounded-lg p-2.5 shrink-0', iconBg[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}