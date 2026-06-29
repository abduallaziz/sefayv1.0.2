'use client';

import { useState } from 'react';
import { TableSkeleton } from '@/shared/components/ui/Skeleton';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeftRight, Download } from 'lucide-react';
import { useTransfers, useCreateTransfer } from '../hooks/useTransfers';
import { TransferFiltersBar } from '../components/TransferFilters';
import { TransfersTable } from '../components/TransfersTable';
import { TransferFormModal } from '../components/TransferFormModal';
import { Transfer, TransferFilters, CreateTransferDTO } from '../types/transfer.types';
import { exportTransfersToCsv } from '../utils/exportTransfers';

export function TransfersPage() {
  const t = useTranslations('transfers');
  const locale = useLocale();
  const router = useRouter();

  const [filters, setFilters] = useState<TransferFilters>({});
  const [formOpen, setFormOpen] = useState(false);

  const { data: transfers = [], isLoading } = useTransfers(filters);
  const createTransfer = useCreateTransfer();

  const handleView = (transfer: Transfer) => {
    router.push(`/${locale}/dashboard/transfers/${transfer.id}`);
  };

  const handleSubmit = (data: CreateTransferDTO) => {
    createTransfer.mutate(data, {
      onSuccess: (newTransfer) => {
        setFormOpen(false);
        router.push(`/${locale}/dashboard/transfers/${newTransfer.id}`);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-[#0C447C]/10">
            <ArrowLeftRight size={22} className="text-[#0C447C] dark:text-[#5B9BD5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('transfers')}</h1>
            <p className="text-sm text-slate-500">{transfers.length} {t('totalTransfers')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportTransfersToCsv(transfers)}
            disabled={transfers.length === 0}
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
            {t('createTransfer')}
          </button>
        </div>
      </div>

      <TransferFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TransfersTable transfers={transfers} onView={handleView} />
      )}

      <TransferFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={createTransfer.isPending}
      />
    </div>
  );
}
