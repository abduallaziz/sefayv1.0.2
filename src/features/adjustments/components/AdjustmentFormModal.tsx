'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useWarehouses } from '@/features/warehouses/hooks/useWarehouses';
import { useItems } from '@/features/items/hooks/useItems';
import type { CreateAdjustmentDTO } from '../types/adjustment.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAdjustmentDTO) => void;
  isLoading?: boolean;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

export function AdjustmentFormModal({ open, onClose, onSubmit, isLoading }: Props) {
  const t = useTranslations('adjustments');
  const { data: warehouses = [] } = useWarehouses();
  const { data: items = [] } = useItems();

  const [warehouseId, setWarehouseId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantityDelta, setQuantityDelta] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setWarehouseId(''); setItemId(''); setQuantityDelta('');
    setUnitCost(''); setReason(''); setError('');
  };

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const delta = Number(quantityDelta);
    if (!warehouseId || !itemId || !reason.trim()) {
      setError(t('requiredFields'));
      return;
    }
    if (!delta || delta === 0) {
      setError(t('quantityDeltaRequired'));
      return;
    }

    const dto: CreateAdjustmentDTO = {
      warehouse_id: warehouseId,
      item_id: itemId,
      quantity_delta: delta,
      unit_cost: unitCost ? Number(unitCost) : undefined,
      reason: reason.trim(),
    };

    onSubmit(dto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{t('createAdjustment')}</h2>
          <button onClick={() => { resetForm(); onClose(); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('warehouse')}</label>
              <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={inputClass}>
                <option value="">{t('selectWarehouse')}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('item')}</label>
              <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputClass}>
                <option value="">{t('selectItem')}</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('quantityDelta')}</label>
              <input
                type="text" inputMode="decimal" placeholder={t('quantityDeltaHint')}
                value={quantityDelta} onChange={(e) => setQuantityDelta(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('unitCost')}</label>
              <input
                type="text" inputMode="decimal"
                value={unitCost} onChange={(e) => setUnitCost(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('reason')}</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} rows={3} />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isLoading} className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {isLoading ? t('saving') : t('save')}
            </button>
            <button type="button" onClick={() => { resetForm(); onClose(); }} className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
