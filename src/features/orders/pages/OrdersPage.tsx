'use client';

import { useState, useMemo } from 'react';
import { Order, OrderFilters as IOrderFilters } from '../types/order.types';
import { useOrders, useOrder, useCancelOrder } from '../hooks/useOrders';
import { OrdersTable } from '../components/OrdersTable';
import { OrderFilters } from '../components/OrderFilters';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { useTranslations } from 'next-intl';
import { FileText, ClipboardList, Clock, CheckCircle2, XCircle, Wallet } from 'lucide-react';
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
    { labelKey: 'totalInvoices', value: stats.total, icon: ClipboardList, iconBg: 'bg-posCloud-primary-light dark:bg-posCloud-primary/15', iconColor: 'text-posCloud-primary' },
    { labelKey: 'pendingCount', value: stats.pending, icon: Clock, iconBg: 'bg-posCloud-warning-light dark:bg-posCloud-warning/15', iconColor: 'text-posCloud-warning' },
    { labelKey: 'completedCount', value: stats.completed, icon: CheckCircle2, iconBg: 'bg-posCloud-success-light dark:bg-posCloud-success/15', iconColor: 'text-posCloud-success' },
    { labelKey: 'cancelledCount', value: stats.cancelled, icon: XCircle, iconBg: 'bg-posCloud-danger-light dark:bg-posCloud-danger/15', iconColor: 'text-posCloud-danger' },
    { labelKey: 'todayRevenue', value: `${stats.revenue.toLocaleString('en-US')} ${currency}`, icon: Wallet, iconBg: 'bg-posCloud-primary-light dark:bg-posCloud-primary/15', iconColor: 'text-posCloud-primary' },
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
        <div className="p-2.5 rounded-xl bg-posCloud-primary-light dark:bg-posCloud-primary/15">
          <FileText size={22} className="text-posCloud-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statsConfig.map(stat => (
          <div key={stat.labelKey} className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl p-4">
            <div className={`inline-flex p-2 rounded-lg ${stat.iconBg}`}>
              <stat.icon size={18} className={stat.iconColor} />
            </div>
            <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mt-2 mb-1">{t(stat.labelKey as Parameters<typeof t>[0])}</p>
            <p className="text-xl font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <OrderFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="text-center py-16 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('loading')}</div>
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