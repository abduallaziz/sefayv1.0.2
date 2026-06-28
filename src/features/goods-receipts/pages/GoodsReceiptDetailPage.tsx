'use client';

import { useState } from 'react';
import { PageHeaderSkeleton, CardListSkeleton, TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useGoodsReceipt, usePostGoodsReceipt, useCancelGoodsReceipt } from '../hooks/useGoodsReceipts';
import { CancelGoodsReceiptModal } from '../components/CancelGoodsReceiptModal';

interface Props {
  id: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400',
  posted: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const statusLabelKeys = {
  draft: 'status.draft',
  posted: 'status.posted',
  cancelled: 'status.cancelled',
} as const;

export function GoodsReceiptDetailPage({ id }: Props) {
  const t = useTranslations('purchasing');
  const locale = useLocale();
  const router = useRouter();

  const { data: receipt, isLoading } = useGoodsReceipt(id);
  const postReceipt = usePostGoodsReceipt();
  const cancelReceipt = useCancelGoodsReceipt();

  const [cancelOpen, setCancelOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <CardListSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  if (!receipt) {
    return <div className="text-center py-16 text-slate-500">{t('notFound')}</div>;
  }

  const lineTotal = (receipt.items ?? []).reduce((sum, i) => sum + i.quantity_received * i.unit_cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/${locale}/dashboard/goods-receipts`)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{receipt.receipt_number}</h1>
          <p className="text-sm text-slate-500">#{receipt.id}</p>
        </div>
        <span className={`ms-auto px-3 py-1 rounded-full text-xs font-medium ${statusColors[receipt.status]}`}>
          {t(statusLabelKeys[receipt.status])}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('warehouse')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{receipt.warehouse_name ?? receipt.warehouse_id}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('purchaseOrder')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{receipt.purchase_order_number ?? t('noPurchaseOrder')}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('supplier')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{receipt.supplier_name ?? '—'}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('receiptNumber')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{receipt.receipt_number}</p>
        </div>
      </div>

      {receipt.notes && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('notes')}</p>
          <p className="text-sm text-slate-800 dark:text-white">{receipt.notes}</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('item')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('quantity')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('ordered')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('unitCost')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('lineTotal')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('batchNumber')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('serialNumber')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('expirationDate')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {(receipt.items ?? []).map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3 text-slate-800 dark:text-white">
                  {item.item_name ?? item.item_id}
                  {item.variant_name && <span className="text-slate-400 text-xs ms-1">({item.variant_name})</span>}
                </td>
                <td className="px-3 py-3 text-slate-500">{item.quantity_received}</td>
                <td className="px-3 py-3 text-slate-500">{item.quantity_ordered ?? '—'}</td>
                <td className="px-3 py-3 text-slate-500">{item.unit_cost.toLocaleString('en-US')}</td>
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">
                  {(item.quantity_received * item.unit_cost).toLocaleString('en-US')}
                </td>
                <td className="px-3 py-3 text-slate-500">{item.batch_number ?? '—'}</td>
                <td className="px-3 py-3 text-slate-500">{item.serial_number ?? '—'}</td>
                <td className="px-3 py-3 text-slate-500">
                  {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString('en-US') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 dark:border-gray-800">
              <td colSpan={4} className="px-3 py-3 text-end font-semibold text-slate-800 dark:text-white">{t('total')}</td>
              <td colSpan={4} className="px-3 py-3 font-bold text-slate-800 dark:text-white">{lineTotal.toLocaleString('en-US')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex gap-3">
        {receipt.status === 'draft' && (
          <button
            onClick={() => postReceipt.mutate(receipt.id)}
            disabled={postReceipt.isPending}
            className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {postReceipt.isPending ? t('posting') : t('post')}
          </button>
        )}
        {receipt.status === 'draft' && (
          <button
            onClick={() => setCancelOpen(true)}
            className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20"
          >
            {t('cancelReceipt')}
          </button>
        )}
      </div>

      <CancelGoodsReceiptModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          cancelReceipt.mutate(receipt.id, { onSuccess: () => setCancelOpen(false) });
        }}
        isLoading={cancelReceipt.isPending}
      />
    </div>
  );
}
