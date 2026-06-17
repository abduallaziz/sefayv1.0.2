'use client';

import { useState, useMemo } from 'react';
import { Order, OrderFilters as IOrderFilters } from '../types/order.types';
import { useOrders, useOrder, useCancelOrder } from '../hooks/useOrders';
import { OrdersTable } from '../components/OrdersTable';
import { OrderFilters } from '../components/OrderFilters';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';

export function OrdersPage() {
  const t = useTranslations('orders');
  const currency = useTenantStore((s) => s.currency_symbol);
  const [filters, setFilters] = useState<IOrderFilters>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useOrders(filters);
  const { data: selectedOrder = null } = useOrder(selectedOrderId ?? '');
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filters.status && order.status !== filters.status) return false;
      if (filters.payment_method && order.payment_method !== filters.payment_method) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !order.id.toLowerCase().includes(q) &&
          !order.cashier_name?.toLowerCase().includes(q) &&
          !(order.customer_name?.toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [orders, filters]);

  const stats = useMemo(() => ({
    total: orders.length,
    completed: orders.filter(o => o.status === 'completed').length,
    pending: orders.filter(o => o.status === 'pending').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0),
  }), [orders]);

  const statsConfig = [
    { labelKey: 'totalInvoices', value: stats.total, color: 'text-slate-800 dark:text-white' },
    { labelKey: 'completedCount', value: stats.completed, color: 'text-emerald-600 dark:text-emerald-400' },
    { labelKey: 'pendingCount', value: stats.pending, color: 'text-amber-600 dark:text-amber-400' },
    { labelKey: 'cancelledCount', value: stats.cancelled, color: 'text-red-600 dark:text-red-400' },
    { labelKey: 'todayRevenue', value: `${stats.revenue.toLocaleString('en-US')} ${currency}`, color: 'text-[#0C447C] dark:text-blue-400' },
  ];

  function handleCancelConfirm(id: string, reason: string) {
    cancelOrder(
      { id, payload: { reason } },
      {
        onSuccess: () => {
          setCancelTarget(null);
          setSelectedOrderId(null);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-[#E8F1FB] dark:bg-blue-500/10">
          <FileText size={22} className="text-[#0C447C] dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsConfig.map(stat => (
          <div key={stat.labelKey} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{t(stat.labelKey as any)}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <OrderFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">{t('loading')}</div>
      ) : (
        <OrdersTable orders={filteredOrders} onViewOrder={(order) => setSelectedOrderId(order.id)} />
      )}

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onCancel={order => {
          setSelectedOrderId(null);
          setCancelTarget(order);
        }}
      />
      <CancelOrderModal
        order={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        isLoading={isCancelling}
      />
    </div>
  );
}