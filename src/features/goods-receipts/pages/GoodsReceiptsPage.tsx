'use client';

import { useState } from 'react';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Plus, PackageCheck, Download } from 'lucide-react';
import { useGoodsReceipts, useCreateGoodsReceipt } from '../hooks/useGoodsReceipts';
import { GoodsReceiptFiltersBar } from '../components/GoodsReceiptFilters';
import { GoodsReceiptsTable } from '../components/GoodsReceiptsTable';
import { GoodsReceiptFormModal } from '../components/GoodsReceiptFormModal';
import { GoodsReceipt, GoodsReceiptFilters, CreateGoodsReceiptDTO } from '../types/goods-receipt.types';
import { exportGoodsReceiptsToCsv } from '../utils/exportGoodsReceipts';

export function GoodsReceiptsPage() {
  const t = useTranslations('purchasing');
  const locale = useLocale();
  const router = useRouter();

  const [filters, setFilters] = useState<GoodsReceiptFilters>({});
  const [formOpen, setFormOpen] = useState(false);

  const { data: receipts = [], isLoading } = useGoodsReceipts(filters);
  const createReceipt = useCreateGoodsReceipt();

  const handleView = (receipt: GoodsReceipt) => {
    router.push(`/${locale}/dashboard/goods-receipts/${receipt.id}`);
  };

  const handleSubmit = (data: CreateGoodsReceiptDTO) => {
    createReceipt.mutate(data, {
      onSuccess: (newReceipt) => {
        setFormOpen(false);
        router.push(`/${locale}/dashboard/goods-receipts/${newReceipt.id}`);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-[#0C447C]/10">
            <PackageCheck size={22} className="text-[#0C447C] dark:text-[#5B9BD5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('goodsReceipts')}</h1>
            <p className="text-sm text-slate-500">{receipts.length} {t('totalReceipts')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportGoodsReceiptsToCsv(receipts)}
            disabled={receipts.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {t('export')}
          </button>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('createGoodsReceipt')}
          </button>
        </div>
      </div>

      <GoodsReceiptFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <GoodsReceiptsTable receipts={receipts} onView={handleView} />
      )}

      <GoodsReceiptFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={createReceipt.isPending}
      />
    </div>
  );
}
