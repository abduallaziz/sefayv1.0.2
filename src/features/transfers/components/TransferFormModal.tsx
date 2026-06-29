'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useWarehouses } from '@/features/warehouses/hooks/useWarehouses';
import { useItems } from '@/features/items/hooks/useItems';
import { TransferLineItems, TransferLineRow } from './TransferLineItems';
import type { CreateTransferDTO } from '../types/transfer.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransferDTO) => void;
  isLoading?: boolean;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

export function TransferFormModal({ open, onClose, onSubmit, isLoading }: Props) {
  const t = useTranslations('transfers');
  const { data: warehouses = [] } = useWarehouses();
  const { data: items = [] } = useItems();

  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<TransferLineRow[]>([]);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFromWarehouseId(''); setToWarehouseId(''); setTransferNumber('');
    setNotes(''); setRows([]); setError('');
  };

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fromWarehouseId || !toWarehouseId || !transferNumber.trim()) {
      setError(t('requiredFields'));
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      setError(t('sameWarehouseError'));
      return;
    }
    const validRows = rows.filter((r) => r.item_id && r.quantity > 0);
    if (validRows.length === 0) {
      setError(t('requireAtLeastOneLine'));
      return;
    }

    const dto: CreateTransferDTO = {
      from_warehouse_id: fromWarehouseId,
      to_warehouse_id: toWarehouseId,
      transfer_number: transferNumber.trim(),
      notes: notes || undefined,
      items: validRows.map((r) => ({
        item_id: r.item_id,
        variant_id: r.variant_id || undefined,
        quantity: r.quantity,
        from_location_id: r.from_location_id || undefined,
        to_location_id: r.to_location_id || undefined,
      })),
    };

    onSubmit(dto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{t('createTransfer')}</h2>
          <button onClick={() => { resetForm(); onClose(); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('fromWarehouse')}</label>
              <select value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)} className={inputClass}>
                <option value="">{t('selectWarehouse')}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('toWarehouse')}</label>
              <select value={toWarehouseId} onChange={(e) => setToWarehouseId(e.target.value)} className={inputClass}>
                <option value="">{t('selectWarehouse')}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('transferNumber')}</label>
            <input value={transferNumber} onChange={(e) => setTransferNumber(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{t('notes')}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} />
          </div>

          <TransferLineItems
            rows={rows}
            items={items}
            fromWarehouseId={fromWarehouseId}
            toWarehouseId={toWarehouseId}
            onChange={setRows}
          />

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
