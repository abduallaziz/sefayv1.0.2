'use client';

import { useState } from 'react';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useAdjustments, useCreateAdjustment } from '../hooks/useAdjustments';
import { AdjustmentFiltersBar } from '../components/AdjustmentFilters';
import { AdjustmentsTable } from '../components/AdjustmentsTable';
import { AdjustmentFormModal } from '../components/AdjustmentFormModal';
import { StockAdjustment, AdjustmentFilters, CreateAdjustmentDTO } from '../types/adjustment.types';

export function AdjustmentsPage() {
  const t = useTranslations('adjustments');
  const locale = useLocale();
  const router = useRouter();

  const [filters, setFilters] = useState<AdjustmentFilters>({});
  const [formOpen, setFormOpen] = useState(false);

  const { data: adjustments = [], isLoading } = useAdjustments(filters);
  const createAdjustment = useCreateAdjustment();

  const handleView = (adjustment: StockAdjustment) => {
    router.push(`/${locale}/dashboard/adjustments/${adjustment.id}`);
  };

  const handleSubmit = (data: CreateAdjustmentDTO) => {
    createAdjustment.mutate(data, {
      onSuccess: (newAdjustment) => {
        setFormOpen(false);
        router.push(`/${locale}/dashboard/adjustments/${newAdjustment.id}`);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-[#0C447C]/10">
            <SlidersHorizontal size={22} className="text-[#0C447C] dark:text-[#5B9BD5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('adjustments')}</h1>
            <p className="text-sm text-slate-500">{adjustments.length} {t('totalAdjustments')}</p>
          </div>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('createAdjustment')}
        </button>
      </div>

      <AdjustmentFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <AdjustmentsTable adjustments={adjustments} onView={handleView} />
      )}

      <AdjustmentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={createAdjustment.isPending}
      />
    </div>
  );
}
