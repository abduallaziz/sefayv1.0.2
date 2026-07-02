'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeftRight } from 'lucide-react';
import { Transfer } from '../types/transfer.types';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { EmptyState } from '@/shared/ui/empty-state';

interface Props {
  transfers: Transfer[];
  onView: (transfer: Transfer) => void;
}

const statusTones: Record<string, StatusTone> = {
  draft: 'neutral',
  in_transit: 'warning',
  completed: 'success',
  cancelled: 'danger',
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
    return <EmptyState theme="inventory" icon={ArrowLeftRight} title={t('noTransfers')} />;
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
              <StatusBadge tone={statusTones[transfer.status]} label={t(statusLabelKeys[transfer.status])} className="shrink-0" />
            </div>
            <p className="text-xs text-slate-500 mt-2">{transfer.items_count ?? 0} {t('itemsCount').toLowerCase()}</p>
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
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('itemsCount')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500 w-24">{t('status.label')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {transfers.map((transfer, i) => (
              <tr
                key={transfer.id}
                onClick={() => onView(transfer)}
                className={`hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-slate-50/40 dark:bg-gray-800/10' : ''}`}
              >
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{transfer.transfer_number}</td>
                <td className="px-3 py-3 text-slate-500">{transfer.from_warehouse_name ?? transfer.from_warehouse_id}</td>
                <td className="px-3 py-3 text-slate-500">{transfer.to_warehouse_name ?? transfer.to_warehouse_id}</td>
                <td className="px-3 py-3 text-end text-slate-500">{transfer.items_count ?? 0}</td>
                <td className="px-3 py-3 w-24">
                  <StatusBadge tone={statusTones[transfer.status]} label={t(statusLabelKeys[transfer.status])} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
