import { cn } from '@/lib/utils';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
  brand: 'bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5]',
};

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
  className?: string;
}

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
