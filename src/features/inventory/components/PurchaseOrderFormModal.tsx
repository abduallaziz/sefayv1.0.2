'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, X } from 'lucide-react';
import { useItems } from '@/features/items/hooks/useItems';
import { useSuppliers, useWarehouses, useCreatePurchaseOrder } from '../hooks/useInventory';
import { CreatePurchaseOrderItemDTO } from '../types/inventory.types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

interface Row {
  item_id: string;
  quantity: string;
  unit_cost: string;
}

export function PurchaseOrderFormModal({ open, onClose }: Props) {
  const t = useTranslations('inventory');
  const { data: items = [] } = useItems();
  const { data: suppliers = [] } = useSuppliers();
  const { data: warehouses = [] } = useWarehouses();
  const createPurchaseOrder = useCreatePurchaseOrder();

  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<Row[]>([{ item_id: '', quantity: '', unit_cost: '' }]);

  useEffect(() => {
    if (!open) return;
    setSupplierId(suppliers[0]?.id ?? '');
    setWarehouseId(warehouses.find((w) => w.is_default)?.id ?? warehouses[0]?.id ?? '');
    setNote('');
    setRows([{ item_id: '', quantity: '', unit_cost: '' }]);
  }, [open, suppliers, warehouses]);

  if (!open) return null;

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, { item_id: '', quantity: '', unit_cost: '' }]);
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !warehouseId) return;

    const dtoItems: CreatePurchaseOrderItemDTO[] = rows
      .filter((r) => r.item_id && Number(r.quantity) > 0)
      .map((r) => {
        const item = items.find((i) => i.id === r.item_id)!;
        return {
          item_id: item.id,
          item_name: item.name,
          quantity: Number(r.quantity),
          unit_cost: Number(r.unit_cost) || 0,
        };
      });

    if (dtoItems.length === 0) return;

    createPurchaseOrder.mutate(
      { supplier_id: supplierId, warehouse_id: warehouseId, items: dtoItems, note: note || undefined },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{t('purchaseOrders.addPurchaseOrder')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('purchaseOrders.supplier')}</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputClass} required>
                <option value="">{t('purchaseOrders.selectSupplier')}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('purchaseOrders.warehouse')}</label>
              <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={inputClass} required>
                <option value="">{t('purchaseOrders.selectWarehouse')}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>{t('purchaseOrders.items')}</label>
            {rows.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={row.item_id}
                  onChange={(e) => updateRow(index, { item_id: e.target.value })}
                  className={`${inputClass} flex-1`}
                  required
                >
                  <option value="">—</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  placeholder={t('purchaseOrders.quantity')}
                  value={row.quantity}
                  onChange={(e) => updateRow(index, { quantity: e.target.value })}
                  className={`${inputClass} w-24`}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t('purchaseOrders.unitCost')}
                  value={row.unit_cost}
                  onChange={(e) => updateRow(index, { unit_cost: e.target.value })}
                  className={`${inputClass} w-28`}
                  required
                />
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  disabled={rows.length === 1}
                  className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 text-xs text-[#0C447C] dark:text-[#5B9BD5] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('purchaseOrders.addItem')}
            </button>
          </div>

          <div>
            <label className={labelClass}>{t('purchaseOrders.note')}</label>
            <input
              type="text"
              placeholder={t('purchaseOrders.notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createPurchaseOrder.isPending} className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {createPurchaseOrder.isPending ? t('purchaseOrders.saving') : t('purchaseOrders.save')}
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
