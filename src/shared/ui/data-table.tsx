'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  /** Pins the column to the end edge so row actions stay reachable on narrow screens. */
  sticky?: boolean;
  /** Shows a sort toggle in the header (requires onSort on the table). */
  sortable?: boolean;
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
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  /** Accessible names for the sort buttons (defaults to the column header). */
  sortLabel?: (header: string, dir: 'asc' | 'desc') => string;
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
  sortKey,
  sortDir,
  onSort,
  sortLabel,
}: DataTableProps<T>) {
  // Matrix D6: this `theme` prop is a per-section visual variant
  // (superadmin area vs. regular dashboard), independent of the app's
  // global light/dark toggle (theme.store.ts) — preserved exactly as-is,
  // only the hardcoded hex values were tokenized to posCloud/posCloudDark.
  const t = useTranslations('common');
  // 'dashboard' previously had no dark: variant at all — same class of gap
  // as SectionCard/EmptyState/Skeleton. DataTable had zero prior consumers
  // (confirmed via repo-wide search) before Step 2's Journal Entries list,
  // so this fix has zero blast radius on existing pages. Additive only.
  const bgColor       = theme === 'superadmin' ? 'bg-posCloudDark-surface'     : 'bg-posCloud-surface dark:bg-posCloudDark-surface';
  const borderColor   = theme === 'superadmin' ? 'border-posCloudDark-border' : 'border-posCloud-border dark:border-posCloudDark-border';
  const headerBg      = theme === 'superadmin' ? 'bg-posCloudDark-background'  : 'bg-posCloud-sidebar dark:bg-posCloudDark-background';
  const headerText    = theme === 'superadmin' ? 'text-posCloudDark-text-tertiary' : 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary';
  const rowHover      = theme === 'superadmin' ? 'hover:bg-posCloudDark-border/40' : 'hover:bg-posCloud-sidebar dark:hover:bg-posCloudDark-background';
  const divColor      = theme === 'superadmin' ? 'divide-posCloudDark-border' : 'divide-slate-100 dark:divide-posCloudDark-border';
  const cellText      = theme === 'superadmin' ? 'text-posCloudDark-text-secondary' : 'text-posCloud-text-primary dark:text-posCloudDark-text-primary';

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
                    alignClass(col.align),
                    col.sticky && 'sticky end-0 z-10 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)]',
                    col.sticky && headerBg
                  )}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      aria-label={sortLabel ? sortLabel(col.header, sortKey === col.key && sortDir === 'asc' ? 'desc' : 'asc') : col.header}
                      className="inline-flex items-center gap-1 uppercase tracking-wide font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C447C] rounded"
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
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
                        theme === 'superadmin' ? 'bg-posCloudDark-border/40' : 'bg-posCloud-background dark:bg-posCloudDark-border/40'
                      )} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  {emptyState ?? (
                    <span className={cn('text-sm', theme === 'superadmin' ? 'text-posCloudDark-text-tertiary' : 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary')}>
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
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={onRowClick ? (e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row); }
                  } : undefined}
                  className={cn(
                    'transition-colors duration-150',
                    rowHover,
                    onRowClick && 'cursor-pointer focus-visible:outline-none focus-visible:bg-posCloud-sidebar dark:focus-visible:bg-posCloudDark-background'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3 text-sm', cellText, alignClass(col.align), col.sticky && cn('sticky end-0 z-10', bgColor))}
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