'use client';

import { useState } from 'react';
import { PageHeaderSkeleton, CardListSkeleton, TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  useTransfer,
  useDispatchTransfer,
  useReceiveTransfer,
  useCancelTransfer,
} from '../hooks/useTransfers';
import { CancelTransferModal } from '../components/CancelTransferModal';
import { TransferWorkflowTimeline } from '../components/TransferWorkflowTimeline';

interface Props {
  id: string;
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

export function TransferDetailPage({ id }: Props) {
  const t = useTranslations('transfers');
  const locale = useLocale();
  const router = useRouter();

  const { data: transfer, isLoading } = useTransfer(id);
  const dispatchTransfer = useDispatchTransfer();
  const receiveTransfer = useReceiveTransfer();
  const cancelTransfer = useCancelTransfer();

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

  if (!transfer) {
    return <div className="text-center py-16 text-slate-500">{t('notFound')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/${locale}/dashboard/transfers`)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{transfer.transfer_number}</h1>
          <p className="text-sm text-slate-500">#{transfer.id}</p>
        </div>
        <span className={`ms-auto px-3 py-1 rounded-full text-xs font-medium ${statusColors[transfer.status]}`}>
          {t(statusLabelKeys[transfer.status])}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5">
        <TransferWorkflowTimeline status={transfer.status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('fromWarehouse')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{transfer.from_warehouse_name ?? transfer.from_warehouse_id}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('toWarehouse')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{transfer.to_warehouse_name ?? transfer.to_warehouse_id}</p>
        </div>
      </div>

      {transfer.notes && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('notes')}</p>
          <p className="text-sm text-slate-800 dark:text-white">{transfer.notes}</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('item')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('quantity')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {(transfer.items ?? []).map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3 text-slate-800 dark:text-white">{item.item_name ?? item.item_id}</td>
                <td className="px-3 py-3 text-slate-500">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        {transfer.status === 'draft' && (
          <button
            onClick={() => dispatchTransfer.mutate(transfer.id)}
            disabled={dispatchTransfer.isPending}
            className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {dispatchTransfer.isPending ? t('dispatching') : t('dispatch')}
          </button>
        )}
        {transfer.status === 'in_transit' && (
          <button
            onClick={() => receiveTransfer.mutate(transfer.id)}
            disabled={receiveTransfer.isPending}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {receiveTransfer.isPending ? t('receiving') : t('receive')}
          </button>
        )}
        {transfer.status === 'draft' && (
          <button
            onClick={() => setCancelOpen(true)}
            className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20"
          >
            {t('cancelTransfer')}
          </button>
        )}
      </div>

      <CancelTransferModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          cancelTransfer.mutate(transfer.id, { onSuccess: () => setCancelOpen(false) });
        }}
        isLoading={cancelTransfer.isPending}
      />
    </div>
  );
}
