'use client';

import { useTranslations } from 'next-intl';
import { PackageCheck } from 'lucide-react';
import { GoodsReceipt } from '../types/goods-receipt.types';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { EmptyState } from '@/shared/ui/empty-state';

interface Props {
  receipts: GoodsReceipt[];
  onView: (receipt: GoodsReceipt) => void;
}

const statusTones: Record<string, StatusTone> = {
  draft: 'neutral',
  posted: 'success',
  cancelled: 'danger',
};

export function GoodsReceiptsTable({ receipts, onView }: Props) {
  const t = useTranslations('purchasing');

  if (receipts.length === 0) {
    return <EmptyState theme="inventory" icon={PackageCheck} title={t('noGoodsReceipts')} />;
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {receipts.map((receipt) => (
          <div
            key={receipt.id}
            onClick={() => onView(receipt)}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">{receipt.receipt_number}</p>
                <p className="text-xs text-slate-500 truncate">
                  {receipt.supplier_name ?? '-'} · {receipt.warehouse_name ?? receipt.warehouse_id}
                </p>
              </div>
              <StatusBadge tone={statusTones[receipt.status]} label={t(`status.${receipt.status}`)} className="shrink-0" />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>{receipt.purchase_order_number ?? t('noPurchaseOrder')}</span>
              <span>{receipt.items_count ?? 0} {t('itemsCount').toLowerCase()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800 sticky top-0 z-10">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('receiptNumber')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('supplier')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('warehouse')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('purchaseOrder')}</th>
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('itemsCount')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500 w-24">{t('status.label')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {receipts.map((receipt, i) => (
              <tr
                key={receipt.id}
                onClick={() => onView(receipt)}
                className={`hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-slate-50/40 dark:bg-gray-800/10' : ''}`}
              >
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{receipt.receipt_number}</td>
                <td className="px-3 py-3 text-slate-500">{receipt.supplier_name ?? '-'}</td>
                <td className="px-3 py-3 text-slate-500">{receipt.warehouse_name ?? receipt.warehouse_id}</td>
                <td className="px-3 py-3 text-slate-500">{receipt.purchase_order_number ?? t('noPurchaseOrder')}</td>
                <td className="px-3 py-3 text-end text-slate-500">{receipt.items_count ?? 0}</td>
                <td className="px-3 py-3 w-24">
                  <StatusBadge tone={statusTones[receipt.status]} label={t(`status.${receipt.status}`)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
