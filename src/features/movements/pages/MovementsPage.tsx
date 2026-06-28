'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMovementsLedger } from '../hooks/useMovements';
import { MovementsFiltersBar } from '../components/MovementsFiltersBar';
import { MovementsLedgerTable } from '../components/MovementsLedgerTable';
import { MovementsLedgerFilters } from '../types/movements.types';

const PER_PAGE = 50;

export function MovementsPage() {
  const t = useTranslations('movements');
  const [filters, setFilters] = useState<MovementsLedgerFilters>({ page: 1, per_page: PER_PAGE });
  const { data, isLoading } = useMovementsLedger(filters);

  const page = filters.page ?? 1;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-[#0C447C]/10">
          <Activity size={22} className="text-[#0C447C] dark:text-[#5B9BD5]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500">{total} {t('totalMovements')}</p>
        </div>
      </div>

      <MovementsFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">{t('loading')}</div>
      ) : (
        <>
          <MovementsLedgerTable rows={data?.data ?? []} />

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{t('page')} {page} / {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(1, page - 1) })}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: Math.min(totalPages, page + 1) })}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
