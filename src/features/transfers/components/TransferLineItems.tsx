'use client';

import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import type { Item } from '@/features/items/api/items.api';
import { LocationSelect } from '@/features/locations/components/LocationSelect';

export interface TransferLineRow {
  item_id: string;
  variant_id: string;
  quantity: number;
  from_location_id: string;
  to_location_id: string;
}

interface Props {
  rows: TransferLineRow[];
  items: Item[];
  fromWarehouseId: string;
  toWarehouseId: string;
  onChange: (rows: TransferLineRow[]) => void;
}

const inputClass = "w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]";

export function TransferLineItems({ rows, items, fromWarehouseId, toWarehouseId, onChange }: Props) {
  const t = useTranslations('transfers');

  const addRow = () =>
    onChange([...rows, { item_id: '', variant_id: '', quantity: 1, from_location_id: '', to_location_id: '' }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof TransferLineRow, value: string | number) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  return (
    <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800 dark:text-white">{t('lineItems')}</p>
        <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs text-[#0C447C] dark:text-[#5B9BD5] hover:underline">
          <Plus className="w-3 h-3" />
          {t('addLine')}
        </button>
      </div>

      {rows.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-2">{t('noLineItems')}</p>
      )}

      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[2fr_1fr_auto] gap-2 items-center">
          <select
            value={row.item_id}
            onChange={(e) => updateRow(i, 'item_id', e.target.value)}
            className={inputClass}
          >
            <option value="">{t('selectItem')}</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>{it.name}</option>
            ))}
          </select>
          <input
            type="text" inputMode="decimal" placeholder={t('quantity')}
            value={row.quantity || ''}
            onChange={(e) => updateRow(i, 'quantity', Number(e.target.value))}
            className={inputClass}
          />
          <button type="button" onClick={() => removeRow(i)} className="p-2 text-slate-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>

          <LocationSelect
            warehouseId={fromWarehouseId || null}
            value={row.from_location_id}
            onChange={(v) => updateRow(i, 'from_location_id', v)}
            className={inputClass}
          />
          <LocationSelect
            warehouseId={toWarehouseId || null}
            value={row.to_location_id}
            onChange={(v) => updateRow(i, 'to_location_id', v)}
            className={inputClass}
          />
          <div />
        </div>
      ))}
    </div>
  );
}
