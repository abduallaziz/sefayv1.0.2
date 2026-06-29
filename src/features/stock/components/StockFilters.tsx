'use client';

import { useTranslations } from 'next-intl';
import { useWarehouses } from '@/features/warehouses/hooks/useWarehouses';
import { useItems } from '@/features/items/hooks/useItems';
import { StockLevelFilters } from '../types/stock.types';

interface Props {
  filters: StockLevelFilters;
  onChange: (filters: StockLevelFilters) => void;
}

const inputClass =
  'border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]';

export function StockFiltersBar({ filters, onChange }: Props) {
  const t = useTranslations('stock');
  const { data: warehouses = [] } = useWarehouses();
  const { data: items = [] } = useItems();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.warehouse_id ?? ''}
        onChange={(e) => onChange({ ...filters, warehouse_id: e.target.value || undefined })}
        className={inputClass}
      >
        <option value="">{t('allWarehouses')}</option>
        {warehouses.map((w) => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>
      <select
        value={filters.item_id ?? ''}
        onChange={(e) => onChange({ ...filters, item_id: e.target.value || undefined })}
        className={inputClass}
      >
        <option value="">{t('item')}</option>
        {items.map((it) => (
          <option key={it.id} value={it.id}>{it.name}</option>
        ))}
      </select>
    </div>
  );
}
