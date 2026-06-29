'use client';

import { useTranslations } from 'next-intl';
import { PurchaseOrder } from '../types/purchase-order.types';

interface Props {
  orders: PurchaseOrder[];
  onView: (order: PurchaseOrder) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400',
  submitted: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  partially_received: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  received: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const statusLabelKeys = {
  draft: 'status.draft',
  submitted: 'status.submitted',
  approved: 'status.approved',
  partially_received: 'status.partially_received',
  received: 'status.received',
  cancelled: 'status.cancelled',
} as const;

export function PurchaseOrdersTable({ orders, onView }: Props) {
  const t = useTranslations('purchasing');

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('noPurchaseOrders')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => onView(order)}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">{order.order_number}</p>
                <p className="text-xs text-slate-500 truncate">{order.supplier_name ?? order.supplier_id}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColors[order.status]}`}>
                {t(statusLabelKeys[order.status])}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>{order.items_count ?? 0} {t('itemsCount').toLowerCase()}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {(order.total_value ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800 sticky top-0 z-10">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('orderNumber')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('supplier')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('warehouse')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('orderDate')}</th>
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('itemsCount')}</th>
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('totalValue')}</th>
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('completion')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500 w-24">{t('status.label')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {orders.map((order, i) => (
              <tr
                key={order.id}
                onClick={() => onView(order)}
                className={`hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-slate-50/40 dark:bg-gray-800/10' : ''}`}
              >
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{order.order_number}</td>
                <td className="px-3 py-3 text-slate-500">{order.supplier_name ?? order.supplier_id}</td>
                <td className="px-3 py-3 text-slate-500">{order.warehouse_name ?? order.warehouse_id}</td>
                <td className="px-3 py-3 text-slate-500">
                  {order.order_date ? new Date(order.order_date).toLocaleDateString('en-US') : '—'}
                </td>
                <td className="px-3 py-3 text-end text-slate-500">{order.items_count ?? 0}</td>
                <td className="px-3 py-3 text-end font-medium text-slate-700 dark:text-slate-300">
                  {(order.total_value ?? 0).toLocaleString()}
                </td>
                <td className="px-3 py-3 text-end text-slate-500">{order.completion_pct ?? 0}%</td>
                <td className="px-3 py-3 w-24">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {t(statusLabelKeys[order.status])}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
