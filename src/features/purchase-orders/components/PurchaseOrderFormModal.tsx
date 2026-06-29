'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { RequiredMark } from '@/shared/components/ui/RequiredMark';
import { SingleDatePicker } from '@/shared/ui/date-range-picker';
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers';
import { useWarehouses } from '@/features/warehouses/hooks/useWarehouses';
import { useItems } from '@/features/items/hooks/useItems';
import { PurchaseOrderLineItems, POLineRow } from './PurchaseOrderLineItems';
import type { CreatePurchaseOrderDTO } from '../types/purchase-order.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePurchaseOrderDTO) => void;
  isLoading?: boolean;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

export function PurchaseOrderFormModal({ open, onClose, onSubmit, isLoading }: Props) {
  const t = useTranslations('purchasing');
  const { data: suppliers = [] } = useSuppliers();
  const { data: warehouses = [] } = useWarehouses();
  const { data: items = [] } = useItems();

  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<POLineRow[]>([]);
  const [error, setError] = useState('');

  const resetForm = () => {
    setSupplierId(''); setWarehouseId(''); setOrderNumber('');
    setOrderDate(''); setExpectedDate(''); setNotes(''); setRows([]); setError('');
  };

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!supplierId || !warehouseId || !orderNumber.trim()) {
      setError(t('requiredFields'));
      return;
    }
    const validRows = rows.filter((r) => r.item_id && r.quantity_ordered > 0);
    if (validRows.length === 0) {
      setError(t('requireAtLeastOneLine'));
      return;
    }

    const dto: CreatePurchaseOrderDTO = {
      supplier_id: supplierId,
      warehouse_id: warehouseId,
      order_number: orderNumber.trim(),
      order_date: orderDate || undefined,
      expected_date: expectedDate || undefined,
      notes: notes || undefined,
      items: validRows.map((r) => ({
        item_id: r.item_id,
        variant_id: r.variant_id || undefined,
        quantity_ordered: r.quantity_ordered,
        unit_cost: r.unit_cost,
      })),
    };

    onSubmit(dto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{t('createPurchaseOrder')}</h2>
          <button onClick={() => { resetForm(); onClose(); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('supplier')}<RequiredMark /></label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputClass}>
                <option value="">{t('selectSupplier')}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('warehouse')}<RequiredMark /></label>
              <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={inputClass}>
                <option value="">{t('selectWarehouse')}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>{t('orderNumber')}<RequiredMark /></label>
              <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('orderDate')}</label>
              <SingleDatePicker value={orderDate || undefined} onChange={(v) => setOrderDate(v ?? '')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('expectedDate')}</label>
              <SingleDatePicker value={expectedDate || undefined} onChange={(v) => setExpectedDate(v ?? '')} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('notes')}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} />
          </div>

          <PurchaseOrderLineItems rows={rows} items={items} onChange={setRows} />

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
