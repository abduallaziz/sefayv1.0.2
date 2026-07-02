'use client';

import { useTranslations } from 'next-intl';
import { StockCountFilters as IStockCountFilters, StockCountStatus } from '../types/stock-count.types';

interface Props {
  filters: IStockCountFilters;
  onChange: (filters: IStockCountFilters) => void;
}

export function StockCountFiltersBar({ filters, onChange }: Props) {
  const t = useTranslations('stockCounts');

  const statuses: { value: StockCountStatus | ''; labelKey: string }[] = [
    { value: '', labelKey: 'status.all' },
    { value: 'draft', labelKey: 'status.draft' },
    { value: 'in_progress', labelKey: 'status.in_progress' },
    { value: 'completed', labelKey: 'status.completed' },
    { value: 'cancelled', labelKey: 'status.cancelled' },
  ];

  const inputClass =
    'border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.status || ''}
        onChange={(e) => onChange({ ...filters, status: (e.target.value as StockCountStatus) || undefined })}
        className={inputClass}
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.value === '' ? t('status.all') : t(`status.${s.value}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
