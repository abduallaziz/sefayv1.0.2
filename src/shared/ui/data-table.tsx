'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  theme?: 'superadmin' | 'dashboard';
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  theme = 'dashboard',
  loading = false,
  onRowClick,
  emptyState,
  className,
}: DataTableProps<T>) {
  // Matrix D6: this `theme` prop is a per-section visual variant
  // (superadmin area vs. regular dashboard), independent of the app's
  // global light/dark toggle (theme.store.ts) — preserved exactly as-is,
  // only the hardcoded hex values were tokenized to posCloud/posCloudDark.
  const t = useTranslations('common');
  const bgColor       = theme === 'superadmin' ? 'bg-posCloudDark-surface'     : 'bg-posCloud-surface';
  const borderColor   = theme === 'superadmin' ? 'border-posCloudDark-border' : 'border-posCloud-border';
  const headerBg      = theme === 'superadmin' ? 'bg-posCloudDark-background'  : 'bg-posCloud-sidebar';
  const headerText    = theme === 'superadmin' ? 'text-posCloudDark-text-tertiary' : 'text-posCloud-text-tertiary';
  const rowHover      = theme === 'superadmin' ? 'hover:bg-posCloudDark-border/40' : 'hover:bg-posCloud-sidebar';
  const divColor      = theme === 'superadmin' ? 'divide-posCloudDark-border' : 'divide-slate-100';
  const cellText      = theme === 'superadmin' ? 'text-posCloudDark-text-secondary' : 'text-posCloud-text-primary';

  const alignClass = (align?: string) => {
    if (align === 'center') return 'text-center';
    if (align === 'right')  return 'text-right';
    return 'text-left';
  };

  return (
    <div className={cn('rounded-xl border overflow-hidden', bgColor, borderColor, className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn('border-b', borderColor, headerBg)}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wide',
                    headerText,
                    alignClass(col.align)
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn('divide-y', divColor)}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className={cn(
                        'h-4 rounded animate-pulse',
                        theme === 'superadmin' ? 'bg-posCloudDark-border/40' : 'bg-posCloud-background'
                      )} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  {emptyState ?? (
                    <span className={cn('text-sm', theme === 'superadmin' ? 'text-posCloudDark-text-tertiary' : 'text-posCloud-text-tertiary')}>
                      {t('noData')}
                    </span>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={keyExtractor(row, i)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors duration-150',
                    rowHover,
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3 text-sm', cellText, alignClass(col.align))}
                    >
                      {col.render
                        ? col.render(row, i)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}