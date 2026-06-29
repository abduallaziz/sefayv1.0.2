'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useWarehouses } from '@/features/warehouses/hooks/useWarehouses';
import { useItems } from '@/features/items/hooks/useItems';
import { purchaseOrdersApi } from '@/features/purchase-orders/api/purchase-orders.api';
import { usePurchaseOrders } from '@/features/purchase-orders/hooks/usePurchaseOrders';
import { GoodsReceiptLineItems, GRLineRow } from './GoodsReceiptLineItems';
import type { CreateGoodsReceiptDTO } from '../types/goods-receipt.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoodsReceiptDTO) => void;
  isLoading?: boolean;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

export function GoodsReceiptFormModal({ open, onClose, onSubmit, isLoading }: Props) {
  const t = useTranslations('purchasing');
  const { data: warehouses = [] } = useWarehouses();
  const { data: items = [] } = useItems();
  const { data: approvedOrders = [] } = usePurchaseOrders({ status: 'approved' });

  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<GRLineRow[]>([]);
  const [error, setError] = useState('');

  const handleSelectPurchaseOrder = async (poId: string) => {
    setPurchaseOrderId(poId);
    if (!poId) return;
    const selectedOrder = await purchaseOrdersApi.getById(poId);
    setWarehouseId(selectedOrder.warehouse_id);
    setRows(
      (selectedOrder.items ?? []).map((i) => ({
        purchase_order_item_id: i.id,
        item_id: i.item_id,
        variant_id: i.variant_id ?? '',
        quantity_received: i.quantity_ordered,
        unit_cost: i.unit_cost,
        batch_number: '',
        serial_number: '',
        expiration_date: '',
      }))
    );
  };

  const resetForm = () => {
    setPurchaseOrderId(''); setWarehouseId(''); setReceiptNumber('');
    setNotes(''); setRows([]); setError('');
  };

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!warehouseId || !receiptNumber.trim()) {
      setError(t('requiredFields'));
      return;
    }
    const validRows = rows.filter((r) => r.item_id && r.quantity_received > 0);
    if (validRows.length === 0) {
      setError(t('requireAtLeastOneLine'));
      return;
    }

    const dto: CreateGoodsReceiptDTO = {
      purchase_order_id: purchaseOrderId || undefined,
      warehouse_id: warehouseId,
      receipt_number: receiptNumber.trim(),
      notes: notes || undefined,
      items: validRows.map((r) => ({
        purchase_order_item_id: r.purchase_order_item_id || undefined,
        item_id: r.item_id,
        variant_id: r.variant_id || undefined,
        quantity_received: r.quantity_received,
        unit_cost: r.unit_cost,
        batch_number: r.batch_number || undefined,
        serial_number: r.serial_number || undefined,
        expiration_date: r.expiration_date || undefined,
      })),
    };

    onSubmit(dto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{t('createGoodsReceipt')}</h2>
          <button onClick={() => { resetForm(); onClose(); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>{t('selectPurchaseOrder')}</label>
            <select value={purchaseOrderId} onChange={(e) => handleSelectPurchaseOrder(e.target.value)} className={inputClass}>
              <option value="">{t('noPurchaseOrder')}</option>
              {approvedOrders.map((po) => (
                <option key={po.id} value={po.id}>{po.order_number}</option>
              ))}
            </select>
          </div>

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
              <label className={labelClass}>{t('receiptNumber')}</label>
              <input value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('notes')}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} />
          </div>

          <GoodsReceiptLineItems rows={rows} items={items} onChange={setRows} />

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
