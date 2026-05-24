'use client';

import { useState, useMemo } from 'react';
import { Order, OrderFilters as IOrderFilters } from '../types/order.types';
import { useOrders, useCancelOrder } from '../hooks/useOrders';
import { OrdersTable } from '../components/OrdersTable';
import { OrderFilters } from '../components/OrderFilters';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';

export function OrdersPage() {
  const t = useTranslations('orders');
  const [filters, setFilters] = useState<IOrderFilters>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useOrders(filters);
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filters.status && order.status !== filters.status) return false;
      if (filters.payment_method && order.payment_method !== filters.payment_method) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !order.id.toLowerCase().includes(q) &&
          !order.cashier_name.toLowerCase().includes(q) &&
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
    { labelKey: 'totalInvoices', value: stats.total, color: 'text-foreground' },
    { labelKey: 'completedCount', value: stats.completed, color: 'text-green-600' },
    { labelKey: 'pendingCount', value: stats.pending, color: 'text-yellow-600' },
    { labelKey: 'cancelledCount', value: stats.cancelled, color: 'text-red-500' },
    { labelKey: 'todayRevenue', value: `${stats.revenue} ر.س`, color: 'text-primary' },
  ];

  function handleCancelConfirm(id: string, reason: string) {
    cancelOrder(
      { id, payload: { reason } },
      {
        onSuccess: () => {
          setCancelTarget(null);
          setSelectedOrder(null);
        },
      }
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <FileText size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsConfig.map(stat => (
          <div key={stat.labelKey} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{t(stat.labelKey)}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <OrderFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          {t('loading')}
        </div>
      ) : (
        <OrdersTable orders={filteredOrders} onViewOrder={setSelectedOrder} />
      )}

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onCancel={order => {
          setSelectedOrder(null);
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