'use client';

import { useTranslations } from 'next-intl';
import { StockCountItem } from '../types/stock-count.types';

interface Props {
  items: StockCountItem[];
}

export function StockCountProgress({ items }: Props) {
  const t = useTranslations('stockCounts');

  const total = items.length;
  const counted = items.filter((i) => i.counted_quantity !== null).length;
  const pct = total > 0 ? Math.round((counted / total) * 100) : 0;
  const variances = items.filter((i) => i.counted_quantity !== null && i.counted_quantity !== i.expected_quantity);
  const netVariance = items.reduce(
    (sum, i) => sum + ((i.counted_quantity ?? i.expected_quantity) - i.expected_quantity),
    0,
  );

  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{t('countingProgress')}</p>
        <p className="text-xs font-medium text-slate-700 dark:text-gray-300">
          {counted} / {total} ({pct}%)
        </p>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
        <div className="h-full bg-[#0C447C] rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-1">
        <div>
          <p className="text-xs text-slate-500">{t('itemsWithVariance')}</p>
          <p className={`text-sm font-semibold ${variances.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>
            {variances.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('netVariance')}</p>
          <p className={`text-sm font-semibold ${netVariance === 0 ? 'text-slate-800 dark:text-white' : netVariance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {netVariance > 0 ? '+' : ''}{netVariance}
          </p>
        </div>
      </div>
    </div>
  );
}
