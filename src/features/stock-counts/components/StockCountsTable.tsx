'use client';

import { useTranslations } from 'next-intl';
import { StockCount } from '../types/stock-count.types';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';

interface Props {
  counts: StockCount[];
  onView: (count: StockCount) => void;
}

const statusTones: Record<string, StatusTone> = {
  draft: 'neutral',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
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
              <StatusBadge tone={statusTones[count.status]} label={t(statusLabelKeys[count.status])} className="shrink-0" />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>{count.items_counted ?? 0}/{count.items_count ?? 0} {t('itemsCount').toLowerCase()}</span>
              {(count.items_with_variance ?? 0) > 0 && (
                <span
                  className={`font-medium ${
                    (count.net_variance_quantity ?? 0) > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : (count.net_variance_quantity ?? 0) < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {count.items_with_variance} {t('itemsWithVariance').toLowerCase()}
                </span>
              )}
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
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('itemsCount')}</th>
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('itemsWithVariance')}</th>
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('netVariance')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500 w-24">{t('status.label')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {counts.map((count, i) => (
              <tr
                key={count.id}
                onClick={() => onView(count)}
                className={`hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-slate-50/40 dark:bg-gray-800/10' : ''}`}
              >
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{count.count_number}</td>
                <td className="px-3 py-3 text-slate-500">{count.warehouse_name ?? count.warehouse_id}</td>
                <td className="px-3 py-3 text-end text-slate-500">{count.items_counted ?? 0}/{count.items_count ?? 0}</td>
                <td className="px-3 py-3 text-end">
                  <span className={(count.items_with_variance ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-500'}>
                    {count.items_with_variance ?? 0}
                  </span>
                </td>
                <td
                  className={`px-3 py-3 text-end font-medium ${
                    (count.net_variance_quantity ?? 0) === 0
                      ? 'text-slate-500'
                      : (count.net_variance_quantity ?? 0) > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {(count.net_variance_quantity ?? 0) > 0 ? `+${count.net_variance_quantity}` : count.net_variance_quantity ?? 0}
                </td>
                <td className="px-3 py-3 w-24">
                  <StatusBadge tone={statusTones[count.status]} label={t(statusLabelKeys[count.status])} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
