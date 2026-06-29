'use client';

import { useTranslations } from 'next-intl';
import { Transfer } from '../types/transfer.types';

interface Props {
  transfers: Transfer[];
  onView: (transfer: Transfer) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400',
  in_transit: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const statusLabelKeys = {
  draft: 'status.draft',
  in_transit: 'status.in_transit',
  completed: 'status.completed',
  cancelled: 'status.cancelled',
} as const;

export function TransfersTable({ transfers, onView }: Props) {
  const t = useTranslations('transfers');

  if (transfers.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('noTransfers')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {transfers.map((transfer) => (
          <div
            key={transfer.id}
            onClick={() => onView(transfer)}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">{transfer.transfer_number}</p>
                <p className="text-xs text-slate-500 truncate">
                  {transfer.from_warehouse_name ?? transfer.from_warehouse_id} → {transfer.to_warehouse_name ?? transfer.to_warehouse_id}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColors[transfer.status]}`}>
                {t(statusLabelKeys[transfer.status])}
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
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('transferNumber')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('fromWarehouse')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('toWarehouse')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500 w-24">{t('status.label')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {transfers.map((transfer) => (
              <tr
                key={transfer.id}
                onClick={() => onView(transfer)}
                className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
              >
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{transfer.transfer_number}</td>
                <td className="px-3 py-3 text-slate-500">{transfer.from_warehouse_name ?? transfer.from_warehouse_id}</td>
                <td className="px-3 py-3 text-slate-500">{transfer.to_warehouse_name ?? transfer.to_warehouse_id}</td>
                <td className="px-3 py-3 w-24">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[transfer.status]}`}>
                    {t(statusLabelKeys[transfer.status])}
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
