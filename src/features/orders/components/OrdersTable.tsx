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
  completed: 'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-400',
  cancelled: 'bg-red-500/10 text-red-400',
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
    <div className="overflow-x-auto rounded-xl border border-[#1e2130]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 border-b border-[#1e2130] text-slate-500">
            <th className="text-start px-4 py-3 font-medium">{t('invoiceNumber')}</th>
            <th className="text-start px-4 py-3 font-medium">{t('cashier')}</th>
            <th className="hidden sm:table-cell text-start px-4 py-3 font-medium">{t('customer')}</th>
            <th className="text-start px-4 py-3 font-medium">{t('total')}</th>
            <th className="hidden sm:table-cell text-start px-4 py-3 font-medium">{t('payment')}</th>
            <th className="text-start px-4 py-3 font-medium">{t('status.all')}</th>
            <th className="hidden md:table-cell text-start px-4 py-3 font-medium">{t('date')}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-[#1e2130] last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs text-slate-400">
                #{order.id.slice(-6).toUpperCase()}
              </td>
              <td className="px-4 py-3 text-white font-medium">{order.cashier_name}</td>
              <td className="hidden sm:table-cell px-4 py-3 text-slate-400">{order.customer_name || '—'}</td>
              <td className="px-4 py-3 font-bold text-white">
                {order.total.toLocaleString('en-US')} {currency}
              </td>
              <td className="hidden sm:table-cell px-4 py-3 text-slate-400">
                {t(`payment_method.${order.payment_method}`)}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                  {t(`status.${order.status}`)}
                </span>
              </td>
              <td className="hidden md:table-cell px-4 py-3 text-slate-500 text-xs">
                {new Date(order.created_at).toLocaleString('en-US')}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onViewOrder(order)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-500 hover:text-white"
                >
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}