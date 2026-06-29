'use client';

import { useTranslations } from 'next-intl';
import { useWarehouses } from '@/features/warehouses/hooks/useWarehouses';
import { useItems } from '@/features/items/hooks/useItems';
import { SingleDatePicker } from '@/shared/ui/date-range-picker';
import { MovementsLedgerFilters, MovementType } from '../types/movements.types';

interface Props {
  filters: MovementsLedgerFilters;
  onChange: (filters: MovementsLedgerFilters) => void;
}

const MOVEMENT_TYPES: MovementType[] = [
  'receipt', 'sale', 'sale_return', 'adjustment_in', 'adjustment_out',
  'transfer_out', 'transfer_in', 'count_correction_in', 'count_correction_out',
];

const inputClass =
  'border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]';

export function MovementsFiltersBar({ filters, onChange }: Props) {
  const t = useTranslations('movements');
  const { data: warehouses = [] } = useWarehouses();
  const { data: items = [] } = useItems();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.warehouse_id ?? ''}
        onChange={(e) => onChange({ ...filters, warehouse_id: e.target.value || undefined, page: 1 })}
        className={inputClass}
      >
        <option value="">{t('allWarehouses')}</option>
        {warehouses.map((w) => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>
      <select
        value={filters.item_id ?? ''}
        onChange={(e) => onChange({ ...filters, item_id: e.target.value || undefined, page: 1 })}
        className={inputClass}
      >
        <option value="">{t('allItems')}</option>
        {items.map((it) => (
          <option key={it.id} value={it.id}>{it.name}</option>
        ))}
      </select>
      <select
        value={filters.movement_type ?? ''}
        onChange={(e) => onChange({ ...filters, movement_type: e.target.value || undefined, page: 1 })}
        className={inputClass}
      >
        <option value="">{t('allMovementTypes')}</option>
        {MOVEMENT_TYPES.map((mt) => (
          <option key={mt} value={mt}>{t(`type.${mt}`)}</option>
        ))}
      </select>
      <SingleDatePicker
        value={filters.date_from}
        onChange={(v) => onChange({ ...filters, date_from: v, page: 1 })}
        className={inputClass}
      />
      <SingleDatePicker
        value={filters.date_to}
        onChange={(v) => onChange({ ...filters, date_to: v, page: 1 })}
        className={inputClass}
      />
    </div>
  );
}
