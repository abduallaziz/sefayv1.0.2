'use client';

import { Order } from '../types/order.types';
import { useTranslations } from 'next-intl';
import { Eye } from 'lucide-react';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';

interface Props {
  orders: Order[];
  onViewOrder: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function OrdersTable({ orders, onViewOrder }: Props) {
  const t = useTranslations('orders');
  const currency = useTenantStore((s) => s.currency_symbol);

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg font-medium">{t('noOrders')}</p>
        <p className="text-sm mt-1">{t('tryFilters')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
      <table className="w-full text-sm min-w-[360px]">
        <thead>
          <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800 text-slate-500">
            <th className="text-start px-3 py-3 font-medium w-20">{t('invoiceNumber')}</th>
            <th className="text-start px-3 py-3 font-medium">{t('cashier')}</th>
            <th className="hidden sm:table-cell text-start px-3 py-3 font-medium">{t('customer')}</th>
            <th className="text-start px-3 py-3 font-medium w-24">{t('total')}</th>
            <th className="hidden sm:table-cell text-start px-3 py-3 font-medium">{t('payment')}</th>
            <th className="text-start px-3 py-3 font-medium w-24">{t('status.all')}</th>
            <th className="hidden md:table-cell text-start px-3 py-3 font-medium">{t('date')}</th>
            <th className="px-3 py-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
              <td className="px-3 py-3 font-mono text-xs text-slate-400 w-20">
                #{order.id.slice(-6).toUpperCase()}
              </td>
              <td className="px-3 py-3 text-slate-800 dark:text-white font-medium max-w-[100px] truncate">
                {order.cashier_name}
              </td>
              <td className="hidden sm:table-cell px-3 py-3 text-slate-500 max-w-[120px] truncate">
                {order.customer_name || '—'}
              </td>
              <td className="px-3 py-3 font-bold text-slate-800 dark:text-white w-24 tabular-nums">
                {order.total.toLocaleString('en-US')} {currency}
              </td>
              <td className="hidden sm:table-cell px-3 py-3 text-slate-500">
                {t(`payment_method.${order.payment_method}`)}
              </td>
              <td className="px-3 py-3 w-24">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                  {t(`status.${order.status}`)}
                </span>
              </td>
              <td className="hidden md:table-cell px-3 py-3 text-slate-400 text-xs">
                {new Date(order.created_at).toLocaleString('en-US')}
              </td>
              <td className="px-3 py-3 w-10">
                <button
                  onClick={() => onViewOrder(order)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <Eye size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}