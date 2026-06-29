'use client';

import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import type { Item } from '@/features/items/api/items.api';

export interface GRLineRow {
  purchase_order_item_id: string;
  item_id: string;
  variant_id: string;
  quantity_received: number;
  unit_cost: number;
  batch_number: string;
  serial_number: string;
  expiration_date: string;
}

interface Props {
  rows: GRLineRow[];
  items: Item[];
  onChange: (rows: GRLineRow[]) => void;
}

const inputClass = "w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]";

export function GoodsReceiptLineItems({ rows, items, onChange }: Props) {
  const t = useTranslations('purchasing');

  const addRow = () => onChange([...rows, {
    purchase_order_item_id: '', item_id: '', variant_id: '',
    quantity_received: 1, unit_cost: 0, batch_number: '', serial_number: '', expiration_date: '',
  }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof GRLineRow, value: string | number) =>
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
        <div key={i} className="space-y-2 border-b border-slate-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center">
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
              value={row.quantity_received || ''}
              onChange={(e) => updateRow(i, 'quantity_received', Number(e.target.value))}
              className={inputClass}
            />
            <input
              type="text" inputMode="decimal" placeholder={t('unitCost')}
              value={row.unit_cost || ''}
              onChange={(e) => updateRow(i, 'unit_cost', Number(e.target.value))}
              className={inputClass}
            />
            <button type="button" onClick={() => removeRow(i)} className="p-2 text-slate-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              placeholder={t('batchNumber')}
              value={row.batch_number}
              onChange={(e) => updateRow(i, 'batch_number', e.target.value)}
              className={inputClass}
            />
            <input
              placeholder={t('serialNumber')}
              value={row.serial_number}
              onChange={(e) => updateRow(i, 'serial_number', e.target.value)}
              className={inputClass}
            />
            <input
              type="date"
              placeholder={t('expirationDate')}
              value={row.expiration_date}
              onChange={(e) => updateRow(i, 'expiration_date', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
