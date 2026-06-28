'use client';

import { useTranslations } from 'next-intl';
import { StockCount } from '../types/stock-count.types';

interface Props {
  counts: StockCount[];
  onView: (count: StockCount) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400',
  in_progress: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const statusLabelKeys = {
  draft: 'status.draft',
  in_progress: 'status.in_progress',
  completed: 'status.completed',
  cancelled: 'status.cancelled',
} as const;

export function StockCountsTable({ counts, onView }: Props) {
  const t = useTranslations('stockCounts');

  if (counts.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('noCounts')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {counts.map((count) => (
          <div
            key={count.id}
            onClick={() => onView(count)}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">{count.count_number}</p>
                <p className="text-xs text-slate-500 truncate">{count.warehouse_name ?? count.warehouse_id}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColors[count.status]}`}>
                {t(statusLabelKeys[count.status])}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800 sticky top-0 z-10">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('countNumber')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('warehouse')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500 w-24">{t('status.label')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {counts.map((count) => (
              <tr
                key={count.id}
                onClick={() => onView(count)}
                className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
              >
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{count.count_number}</td>
                <td className="px-3 py-3 text-slate-500">{count.warehouse_name ?? count.warehouse_id}</td>
                <td className="px-3 py-3 w-24">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[count.status]}`}>
                    {t(statusLabelKeys[count.status])}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
