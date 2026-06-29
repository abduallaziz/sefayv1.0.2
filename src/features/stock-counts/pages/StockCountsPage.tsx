'use client';

import { useState } from 'react';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Plus, ClipboardCheck, Download } from 'lucide-react';
import { useStockCounts, useCreateStockCount } from '../hooks/useStockCounts';
import { StockCountFiltersBar } from '../components/StockCountFilters';
import { StockCountsTable } from '../components/StockCountsTable';
import { StockCountFormModal } from '../components/StockCountFormModal';
import { StockCount, StockCountFilters, CreateStockCountDTO } from '../types/stock-count.types';
import { exportStockCountsToCsv } from '../utils/exportStockCounts';

export function StockCountsPage() {
  const t = useTranslations('stockCounts');
  const locale = useLocale();
  const router = useRouter();

  const [filters, setFilters] = useState<StockCountFilters>({});
  const [formOpen, setFormOpen] = useState(false);

  const { data: counts = [], isLoading } = useStockCounts(filters);
  const createCount = useCreateStockCount();

  const handleView = (count: StockCount) => {
    router.push(`/${locale}/dashboard/stock-counts/${count.id}`);
  };

  const handleSubmit = (data: CreateStockCountDTO) => {
    createCount.mutate(data, {
      onSuccess: (newCount) => {
        setFormOpen(false);
        router.push(`/${locale}/dashboard/stock-counts/${newCount.id}`);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-[#0C447C]/10">
            <ClipboardCheck size={22} className="text-[#0C447C] dark:text-[#5B9BD5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('stockCounts')}</h1>
            <p className="text-sm text-slate-500">{counts.length} {t('totalCounts')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportStockCountsToCsv(counts)}
            disabled={counts.length === 0}
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
            {t('createCount')}
          </button>
        </div>
      </div>

      <StockCountFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <StockCountsTable counts={counts} onView={handleView} />
      )}

      <StockCountFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={createCount.isPending}
      />
    </div>
  );
}
