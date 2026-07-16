import { cn } from '@/lib/utils';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';

// Matrix D3: classes only, same StatusTone keys and same label/tone/
// className prop API. Prior implementation had inconsistent dark-mode
// coverage (4/6 tones overrode dark: text color, none overrode dark:
// background). Restyled to posCloud/posCloudDark tokens with full
// light+dark coverage on every tone: a solid pastel `-light` background
// in light mode, a translucent tint of the base color in dark mode (same
// technique the pre-existing badge.tsx already used for its dark-only
// palette) — text color uses the base token directly since
// primary/success/warning/danger/info are identical across themes
// (established in A3), so no dark: text override is needed.
const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-posCloud-background dark:bg-posCloudDark-border text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary',
  info: 'bg-posCloud-info-light dark:bg-posCloud-info/15 text-posCloud-info',
  success: 'bg-posCloud-success-light dark:bg-posCloud-success/15 text-posCloud-success',
  warning: 'bg-posCloud-warning-light dark:bg-posCloud-warning/15 text-posCloud-warning',
  danger: 'bg-posCloud-danger-light dark:bg-posCloud-danger/15 text-posCloud-danger',
  brand: 'bg-posCloud-primary-light dark:bg-posCloud-primary/15 text-posCloud-primary',
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
