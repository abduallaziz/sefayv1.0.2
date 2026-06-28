'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Boxes, Download } from 'lucide-react';
import { useStockLevelsEnriched } from '../hooks/useStock';
import { StockLevelsFiltersBar } from '../components/StockLevelsFiltersBar';
import { StockLevelsEnrichedTable } from '../components/StockLevelsEnrichedTable';
import { StockLevelEnrichedFilters } from '../types/stock.types';
import { exportStockLevelsToCsv } from '../utils/exportStockLevels';

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  );
}

export function StockPage() {
  const t = useTranslations('stock');

  const [filters, setFilters] = useState<StockLevelEnrichedFilters>({});
  const { data: levels = [], isLoading } = useStockLevelsEnriched(filters);

  const summary = useMemo(() => {
    return levels.reduce(
      (acc, l) => {
        acc.onHand += l.quantity_on_hand;
        acc.available += l.quantity_available;
        acc.reserved += l.quantity_reserved;
        acc.value += l.inventory_value;
        if (l.status === 'low_stock') acc.lowStock += 1;
        if (l.status === 'out_of_stock') acc.outOfStock += 1;
        return acc;
      },
      { onHand: 0, available: 0, reserved: 0, value: 0, lowStock: 0, outOfStock: 0 }
    );
  }, [levels]);

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
        <button
          onClick={() => exportStockLevelsToCsv(levels)}
          disabled={levels.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {t('export')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard label={t('totalOnHand')} value={summary.onHand} />
        <SummaryCard label={t('available')} value={summary.available} />
        <SummaryCard label={t('reserved')} value={summary.reserved} />
        <SummaryCard label={t('lowStockItems')} value={summary.lowStock} />
        <SummaryCard label={t('outOfStockItems')} value={summary.outOfStock} />
        <SummaryCard label={t('inventoryValue')} value={summary.value.toLocaleString()} />
      </div>

      <StockLevelsFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">{t('loading')}</div>
      ) : (
        <StockLevelsEnrichedTable levels={levels} />
      )}
    </div>
  );
}
