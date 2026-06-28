'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useItems } from '@/features/items/hooks/useItems';
import { useWarehouses, useAdjustStock } from '../hooks/useInventory';
import { StockLevel, StockMovementType } from '../types/inventory.types';

interface Props {
  open: boolean;
  onClose: () => void;
  prefill?: StockLevel | null;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

const ADJUSTABLE_TYPES: StockMovementType[] = ['purchase', 'adjustment', 'transfer_in', 'transfer_out', 'return'];

export function AdjustStockModal({ open, onClose, prefill }: Props) {
  const t = useTranslations('inventory');
  const { data: items = [] } = useItems();
  const { data: warehouses = [] } = useWarehouses();
  const adjustStock = useAdjustStock();

  const [itemId, setItemId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [type, setType] = useState<StockMovementType>('adjustment');
  const [quantityChange, setQuantityChange] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setItemId(prefill?.item_id ?? '');
    setWarehouseId(prefill?.warehouse_id ?? warehouses.find((w) => w.is_default)?.id ?? warehouses[0]?.id ?? '');
    setType('adjustment');
    setQuantityChange('');
    setNote('');
  }, [open, prefill, warehouses]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find((i) => i.id === itemId);
    const qty = Number(quantityChange);
    if (!item || !warehouseId || !qty) return;

    adjustStock.mutate(
      {
        item_id: item.id,
        item_name: item.name,
        variant_id: prefill?.variant_id ?? null,
        variant_name: prefill?.variant_name ?? null,
        warehouse_id: warehouseId,
        quantity_change: qty,
        type,
        note: note || undefined,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{t('adjust.title')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>{t('adjust.item')}</label>
            <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputClass} required>
              <option value="">—</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t('adjust.warehouse')}</label>
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={inputClass} required>
              <option value="">—</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('adjust.type')}</label>
              <select value={type} onChange={(e) => setType(e.target.value as StockMovementType)} className={inputClass}>
                {ADJUSTABLE_TYPES.map((mt) => (
                  <option key={mt} value={mt}>{t(`movementType.${mt}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('adjust.quantityChange')}</label>
              <input
                type="number"
                value={quantityChange}
                onChange={(e) => setQuantityChange(e.target.value)}
                className={inputClass}
                required
              />
              <p className="text-xs text-slate-400 mt-1">{t('adjust.quantityChangeHint')}</p>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('adjust.note')}</label>
            <input
              type="text"
              placeholder={t('adjust.notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={adjustStock.isPending} className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {adjustStock.isPending ? t('adjust.saving') : t('adjust.save')}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm">
              {t('adjust.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
