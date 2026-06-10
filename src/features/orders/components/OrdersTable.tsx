'use client';

import { Order } from '../types/order.types';
import { useTranslations } from 'next-intl';
import { Eye } from 'lucide-react';

interface Props {
  orders: Order[];
  onViewOrder: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function OrdersTable({ orders, onViewOrder }: Props) {
  const t = useTranslations('orders');

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">{t('noOrders')}</p>
        <p className="text-sm mt-1">{t('tryFilters')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border text-muted-foreground">
            <th className="text-right px-4 py-3 font-medium">{t('invoiceNumber')}</th>
            <th className="text-right px-4 py-3 font-medium">{t('cashier')}</th>
            <th className="text-right px-4 py-3 font-medium">{t('customer')}</th>
            <th className="text-right px-4 py-3 font-medium">{t('total')}</th>
            <th className="text-right px-4 py-3 font-medium">{t('payment')}</th>
            <th className="text-right px-4 py-3 font-medium">{t('status.all')}</th>
            <th className="text-right px-4 py-3 font-medium">{t('date')}</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <tr
              key={order.id}
              className={`border-b border-border transition-colors hover:bg-muted/20 ${
                i % 2 === 0 ? '' : 'bg-muted/10'
              }`}
            >
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                #{order.id.slice(-6).toUpperCase()}
              </td>
              <td className="px-4 py-3 text-foreground font-medium">{order.cashier_name}</td>
              <td className="px-4 py-3 text-foreground">{order.customer_name || '—'}</td>
              <td className="px-4 py-3 font-bold text-foreground">{order.total} ر.س</td>
              <td className="px-4 py-3 text-muted-foreground">
                {t(`payment_method.${order.payment_method}`)}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                  {t(`status.${order.status}`)}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {new Date(order.created_at).toLocaleString('ar-SA')}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onViewOrder(order)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
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