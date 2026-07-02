'use client';

import { useTranslations } from 'next-intl';
import { useWarehouses } from '@/features/warehouses/hooks/useWarehouses';
import { useItems } from '@/features/items/hooks/useItems';
import { StockLevelEnrichedFilters } from '../types/stock.types';

interface Props {
  filters: StockLevelEnrichedFilters;
  onChange: (filters: StockLevelEnrichedFilters) => void;
}

const inputClass =
  'border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]';

export function StockLevelsFiltersBar({ filters, onChange }: Props) {
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
        <option value="">{t('allItems')}</option>
        {items.map((it) => (
          <option key={it.id} value={it.id}>{it.name}</option>
        ))}
      </select>
      <select
        value={filters.status ?? ''}
        onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
        className={inputClass}
      >
        <option value="">{t('allStatus')}</option>
        <option value="in_stock">{t('statusInStock')}</option>
        <option value="low_stock">{t('statusLowStock')}</option>
        <option value="out_of_stock">{t('statusOutOfStock')}</option>
      </select>
    </div>
  );
}
