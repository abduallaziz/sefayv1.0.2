'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useWarehouses } from '@/features/warehouses/hooks/useWarehouses';
import type { CreateStockCountDTO } from '../types/stock-count.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStockCountDTO) => void;
  isLoading?: boolean;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

export function StockCountFormModal({ open, onClose, onSubmit, isLoading }: Props) {
  const t = useTranslations('stockCounts');
  const { data: warehouses = [] } = useWarehouses();

  const [warehouseId, setWarehouseId] = useState('');
  const [countNumber, setCountNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setWarehouseId(''); setCountNumber(''); setNotes(''); setError('');
  };

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!warehouseId || !countNumber.trim()) {
      setError(t('requiredFields'));
      return;
    }

    onSubmit({
      warehouse_id: warehouseId,
      count_number: countNumber.trim(),
      notes: notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{t('createCount')}</h2>
          <button onClick={() => { resetForm(); onClose(); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
            <label className={labelClass}>{t('countNumber')}</label>
            <input value={countNumber} onChange={(e) => setCountNumber(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{t('notes')}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} />
          </div>

          <p className="text-xs text-slate-400">{t('snapshotHint')}</p>

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
