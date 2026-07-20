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
  completed: 'bg-posCloud-success-light dark:bg-posCloud-success/15 text-posCloud-success',
  pending: 'bg-posCloud-warning-light dark:bg-posCloud-warning/15 text-posCloud-warning',
  cancelled: 'bg-posCloud-danger-light dark:bg-posCloud-danger/15 text-posCloud-danger',
};

export function OrdersTable({ orders, onViewOrder }: Props) {
  const t = useTranslations('orders');
  const currency = useTenantStore((s) => s.currency_symbol);

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
        <p className="text-lg font-medium">{t('noOrders')}</p>
        <p className="text-sm mt-1">{t('tryFilters')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => onViewOrder(order)}
            className="w-full text-start bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl p-3 hover:border-posCloud-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">#{order.id.slice(-6).toUpperCase()}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                {t(`status.${order.status}`)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="min-w-0">
                <p className="text-posCloud-text-primary dark:text-posCloudDark-text-primary font-medium truncate">{order.cashier_name}</p>
                {order.customer_name && <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary truncate">{order.customer_name}</p>}
              </div>
              <span className="font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary tabular-nums shrink-0">
                {order.total.toLocaleString('en-US')} {currency}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-posCloud-border dark:border-posCloudDark-border text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              <span>{order.payment_method ? t(`payment_method.${order.payment_method}`) : t('payment_method.unknown')}</span>
              <span>{new Date(order.created_at).toLocaleString('en-US')}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-posCloud-border dark:border-posCloudDark-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-posCloud-background dark:bg-posCloudDark-background border-b border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              <th className="text-start px-3 py-3 font-medium w-20">{t('invoiceNumber')}</th>
              <th className="text-start px-3 py-3 font-medium">{t('cashier')}</th>
              <th className="text-start px-3 py-3 font-medium">{t('customer')}</th>
              <th className="text-start px-3 py-3 font-medium w-24">{t('total')}</th>
              <th className="text-start px-3 py-3 font-medium">{t('payment')}</th>
              <th className="text-start px-3 py-3 font-medium w-24">{t('status.all')}</th>
              <th className="text-start px-3 py-3 font-medium">{t('date')}</th>
              <th className="px-3 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-posCloud-border dark:divide-posCloudDark-border">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-3 py-3 font-mono text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary w-20">
                  #{order.id.slice(-6).toUpperCase()}
                </td>
                <td className="px-3 py-3 text-posCloud-text-primary dark:text-posCloudDark-text-primary font-medium max-w-[140px] truncate">
                  {order.cashier_name}
                </td>
                <td className="px-3 py-3 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary max-w-[140px] truncate">
                  {order.customer_name || '—'}
                </td>
                <td className="px-3 py-3 font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary w-24 tabular-nums">
                  {order.total.toLocaleString('en-US')} {currency}
                </td>
                <td className="px-3 py-3 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                  {order.payment_method ? t(`payment_method.${order.payment_method}`) : t('payment_method.unknown')}
                </td>
                <td className="px-3 py-3 w-24">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {t(`status.${order.status}`)}
                  </span>
                </td>
                <td className="px-3 py-3 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-xs">
                  {new Date(order.created_at).toLocaleString('en-US')}
                </td>
                <td className="px-3 py-3 w-10">
                  <button
                    onClick={() => onViewOrder(order)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}