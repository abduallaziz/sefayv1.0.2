'use client';

import { useTranslations } from 'next-intl';
import { GoodsReceipt } from '../types/goods-receipt.types';

interface Props {
  receipts: GoodsReceipt[];
  onView: (receipt: GoodsReceipt) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400',
  posted: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function GoodsReceiptsTable({ receipts, onView }: Props) {
  const t = useTranslations('purchasing');

  if (receipts.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('noGoodsReceipts')}</p>
      </div>
    );
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
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColors[receipt.status]}`}>
                {t(`status.${receipt.status}`)}
              </span>
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
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[receipt.status]}`}>
                    {t(`status.${receipt.status}`)}
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
