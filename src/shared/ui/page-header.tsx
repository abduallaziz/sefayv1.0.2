import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Small inline action rendered immediately after the title (e.g. a favourite toggle). */
  titleAdornment?: ReactNode;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  /**
   * Where the breadcrumb sits relative to the title. 'default' (above the
   * title) is what every existing page renders — 'belowTitle' is opt-in for
   * ERP-style headers that lead with the page name.
   */
  breadcrumbPosition?: 'default' | 'belowTitle';
  /** Vertical alignment of the actions against the title block. */
  actionsAlign?: 'start' | 'center';
  /** Horizontal spacing between action buttons. */
  actionsGap?: 'default' | 'wide';
  theme?: 'superadmin' | 'dashboard';
  className?: string;
}

export function PageHeader({
  title,
  titleAdornment,
  description,
  actions,
  breadcrumb,
  breadcrumbPosition = 'default',
  actionsAlign = 'start',
  actionsGap = 'default',
  theme = 'dashboard',
  className,
}: PageHeaderProps) {
  // Matrix D6: `theme` prop is a per-section variant (superadmin vs.
  // dashboard section styling), unrelated to the global light/dark
  // toggle — preserved as-is, hex values tokenized only.
  const textColor   = theme === 'superadmin' ? 'text-posCloudDark-text-secondary' : 'text-posCloud-text-primary';
  const mutedColor  = theme === 'superadmin' ? 'text-posCloudDark-text-tertiary' : 'text-posCloud-text-tertiary';
  const borderColor = theme === 'superadmin' ? 'border-posCloudDark-border' : 'border-posCloud-border';

  const breadcrumbNav = breadcrumb && breadcrumb.length > 0 && (
    <nav
      className={cn(
        'flex items-center gap-1.5',
        breadcrumbPosition === 'belowTitle' ? 'mt-1.5' : 'mb-3',
      )}
    >
      {breadcrumb.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className={cn('text-xs', mutedColor)}>/</span>}
          <span className={cn('text-xs font-medium', i === breadcrumb.length - 1 ? mutedColor : 'text-posCloud-primary cursor-pointer hover:underline')}>
            {item.label}
          </span>
        </span>
      ))}
    </nav>
  );

  return (
    <div className={cn('pb-5 mb-6 border-b', borderColor, className)}>
      {breadcrumbPosition === 'default' && breadcrumbNav}
      <div
        className={cn(
          'flex justify-between gap-4',
          actionsAlign === 'center' ? 'items-center' : 'items-start',
        )}
      >
        <div className="min-w-0">
          {/* Only wrapped when an adornment is present — pages that don't pass
              one keep the exact bare <h1> markup they rendered before. */}
          {titleAdornment ? (
            <div className="flex min-w-0 items-center gap-2">
              <h1 className={cn('text-2xl font-bold tracking-tight truncate', textColor)}>
                {title}
              </h1>
              {titleAdornment}
            </div>
          ) : (
            <h1 className={cn('text-2xl font-bold tracking-tight truncate', textColor)}>
              {title}
            </h1>
          )}
          {description && (
            <p className={cn('mt-1 text-sm', mutedColor)}>{description}</p>
          )}
          {breadcrumbPosition === 'belowTitle' && breadcrumbNav}
        </div>
        {actions && (
          <div
            className={cn(
              'flex items-center shrink-0 flex-wrap',
              actionsGap === 'wide' ? 'gap-3' : 'gap-2',
            )}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}