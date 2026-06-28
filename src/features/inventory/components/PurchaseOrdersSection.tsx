'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
import {
  usePurchaseOrders,
  useMarkPurchaseOrderOrdered,
  useReceivePurchaseOrder,
  useCancelPurchaseOrder,
} from '../hooks/useInventory';
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-500/10 text-slate-500',
  ordered: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  received: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function PurchaseOrdersSection() {
  const t = useTranslations('inventory');
  const currency = useTenantStore((s) => s.currency_symbol);
  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders();
  const markOrdered = useMarkPurchaseOrderOrdered();
  const receive = useReceivePurchaseOrder();
  const cancel = useCancelPurchaseOrder();

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('purchaseOrders.addPurchaseOrder')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">{t('purchaseOrders.noPurchaseOrders')}</div>
      ) : purchaseOrders.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">{t('purchaseOrders.noPurchaseOrders')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
              <tr>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('purchaseOrders.supplier')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('purchaseOrders.warehouse')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('purchaseOrders.items')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('purchaseOrders.totalCost')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('purchaseOrders.status')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('purchaseOrders.createdAt')}</th>
                <th className="px-3 py-3 w-48" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{po.supplier_name}</td>
                  <td className="px-3 py-3 text-slate-500">{po.warehouse_name}</td>
                  <td className="px-3 py-3 text-slate-500">{po.items.length}</td>
                  <td className="px-3 py-3 text-slate-500 tabular-nums">{po.total_cost.toLocaleString('en-US')} {currency}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[po.status]}`}>
                      {t(`status.${po.status}`)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{new Date(po.created_at).toLocaleString('en-US')}</td>
                  <td className="px-3 py-3 w-48">
                    <div className="flex items-center gap-3">
                      {po.status === 'draft' && (
                        <button
                          onClick={() => markOrdered.mutate(po.id)}
                          className="text-xs text-[#0C447C] dark:text-[#5B9BD5] hover:underline"
                        >
                          {t('purchaseOrders.markOrdered')}
                        </button>
                      )}
                      {po.status === 'ordered' && (
                        <button
                          onClick={() => receive.mutate(po.id)}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          {t('purchaseOrders.receive')}
                        </button>
                      )}
                      {(po.status === 'draft' || po.status === 'ordered') && (
                        <button
                          onClick={() => cancel.mutate(po.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          {t('purchaseOrders.cancel')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PurchaseOrderFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
