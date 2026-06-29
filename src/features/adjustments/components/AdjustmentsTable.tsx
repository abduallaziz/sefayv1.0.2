'use client';

import { useTranslations } from 'next-intl';
import { StockAdjustment } from '../types/adjustment.types';

interface Props {
  adjustments: StockAdjustment[];
  onView: (adjustment: StockAdjustment) => void;
}

const statusColors: Record<string, string> = {
  pending_approval: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
  posted: 'bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5]',
};

const statusLabelKeys = {
  pending_approval: 'status.pending_approval',
  approved: 'status.approved',
  rejected: 'status.rejected',
  posted: 'status.posted',
} as const;

export function AdjustmentsTable({ adjustments, onView }: Props) {
  const t = useTranslations('adjustments');

  if (adjustments.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('noAdjustments')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {adjustments.map((adj) => (
          <div
            key={adj.id}
            onClick={() => onView(adj)}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">{adj.items?.name ?? adj.item_id}</p>
                <p className="text-xs text-slate-500 truncate">{adj.warehouses?.name ?? adj.warehouse_id}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColors[adj.status]}`}>
                {t(statusLabelKeys[adj.status])}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t('quantityDelta')}: {adj.quantity_delta}</p>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800 sticky top-0 z-10">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('item')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('warehouse')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('quantityDelta')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('reason')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500 w-32">{t('status.label')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {adjustments.map((adj, i) => (
              <tr
                key={adj.id}
                onClick={() => onView(adj)}
                className={`hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-slate-50/40 dark:bg-gray-800/10' : ''}`}
              >
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{adj.items?.name ?? adj.item_id}</td>
                <td className="px-3 py-3 text-slate-500">{adj.warehouses?.name ?? adj.warehouse_id}</td>
                <td className="px-3 py-3 text-slate-500">{adj.quantity_delta}</td>
                <td className="px-3 py-3 text-slate-500 truncate max-w-xs">{adj.reason}</td>
                <td className="px-3 py-3 w-32">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[adj.status]}`}>
                    {t(statusLabelKeys[adj.status])}
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
