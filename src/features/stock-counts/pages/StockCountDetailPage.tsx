'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useStockCount, useSubmitCountItem, useFinalizeStockCount } from '../hooks/useStockCounts';
import { StockCountProgress } from '../components/StockCountProgress';
import { StockCountItemsTable } from '../components/StockCountItemsTable';

interface Props {
  id: string;
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

export function StockCountDetailPage({ id }: Props) {
  const t = useTranslations('stockCounts');
  const locale = useLocale();
  const router = useRouter();

  const { data: count, isLoading } = useStockCount(id);
  const submitCountItem = useSubmitCountItem();
  const finalizeCount = useFinalizeStockCount();

  if (isLoading) {
    return <div className="text-center py-16 text-slate-500">{t('loading')}</div>;
  }

  if (!count) {
    return <div className="text-center py-16 text-slate-500">{t('notFound')}</div>;
  }

  const items = count.items ?? [];
  const editable = count.status === 'in_progress';
  const allCounted = items.length > 0 && items.every((i) => i.counted_quantity !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/${locale}/dashboard/stock-counts`)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{count.count_number}</h1>
          <p className="text-sm text-slate-500">#{count.id}</p>
        </div>
        <span className={`ms-auto px-3 py-1 rounded-full text-xs font-medium ${statusColors[count.status]}`}>
          {t(statusLabelKeys[count.status])}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('warehouse')}</p>
          <p className="font-medium text-slate-800 dark:text-white">{count.warehouse_name ?? count.warehouse_id}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('startedAt')}</p>
          <p className="font-medium text-slate-800 dark:text-white">
            {count.started_at ? new Date(count.started_at).toLocaleDateString('en-US') : '—'}
          </p>
        </div>
      </div>

      {(count.status === 'in_progress' || count.status === 'completed') && items.length > 0 && (
        <StockCountProgress items={items} />
      )}

      {count.notes && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">{t('notes')}</p>
          <p className="text-sm text-slate-800 dark:text-white">{count.notes}</p>
        </div>
      )}

      <StockCountItemsTable
        items={items}
        editable={editable}
        isSubmitting={submitCountItem.isPending}
        onSubmitCount={(itemId, countedQuantity) =>
          submitCountItem.mutate({ countId: count.id, itemId, data: { counted_quantity: countedQuantity } })
        }
      />

      {editable && (
        <div className="flex gap-3">
          <button
            onClick={() => finalizeCount.mutate(count.id)}
            disabled={finalizeCount.isPending || !allCounted}
            className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {finalizeCount.isPending ? t('finalizing') : t('finalize')}
          </button>
          {!allCounted && <p className="text-xs text-slate-400 self-center">{t('finalizeHint')}</p>}
        </div>
      )}
    </div>
  );
}
