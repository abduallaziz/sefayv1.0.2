'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Boxes } from 'lucide-react';
import { useStockLevels } from '../hooks/useStock';
import { StockFiltersBar } from '../components/StockFilters';
import { StockLevelsTable } from '../components/StockLevelsTable';
import { StockLevelFilters } from '../types/stock.types';

export function StockPage() {
  const t = useTranslations('stock');

  const [filters, setFilters] = useState<StockLevelFilters>({});
  const { data: levels = [], isLoading } = useStockLevels(filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-[#0C447C]/10">
            <Boxes size={22} className="text-[#0C447C] dark:text-[#5B9BD5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('stockLevels')}</h1>
            <p className="text-sm text-slate-500">{levels.length} {t('totalLevels')}</p>
          </div>
        </div>
      </div>

      <StockFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">{t('loading')}</div>
      ) : (
        <StockLevelsTable levels={levels} />
      )}
    </div>
  );
}
