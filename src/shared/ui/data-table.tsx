import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

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
  const bgColor       = theme === 'superadmin' ? 'bg-[#1a1f2e]'   : 'bg-white';
  const borderColor   = theme === 'superadmin' ? 'border-[#1e2130]' : 'border-[#e2e8f0]';
  const headerBg      = theme === 'superadmin' ? 'bg-[#141720]'    : 'bg-[#f8fafc]';
  const headerText    = theme === 'superadmin' ? 'text-[#64748b]'  : 'text-[#64748b]';
  const rowHover      = theme === 'superadmin' ? 'hover:bg-[#1e2436]' : 'hover:bg-[#f8fafc]';
  const divColor      = theme === 'superadmin' ? 'divide-[#1e2130]' : 'divide-[#f1f5f9]';
  const cellText      = theme === 'superadmin' ? 'text-[#e2e8f0]'  : 'text-[#0f172a]';

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
                        theme === 'superadmin' ? 'bg-[#1e2436]' : 'bg-[#f1f5f9]'
                      )} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  {emptyState ?? (
                    <span className={cn('text-sm', theme === 'superadmin' ? 'text-[#64748b]' : 'text-[#94a3b8]')}>
                      لا توجد بيانات
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