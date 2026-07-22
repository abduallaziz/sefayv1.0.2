'use client';

import { useState, useMemo, useEffect } from 'react';
import { Order, OrderFilters as IOrderFilters, OrderStatus } from '../types/order.types';
import { useOrders, useOrder, useCancelOrder } from '../hooks/useOrders';
import { OrdersTable } from '../components/OrdersTable';
import { OrderFilters } from '../components/OrderFilters';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { useTranslations, useLocale } from 'next-intl';
import { FileText, ClipboardList, Clock, CheckCircle2, XCircle, Wallet, ChevronRight, ChevronLeft, ChevronDown, Download, Settings2, ArrowUp, ArrowDown, Circle } from 'lucide-react';
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store';

const PAGE_SIZES = [10, 25, 50];
// Real percentage swings against a still-thin monthly data history can be
// enormous (e.g. 6 -> 50 orders reads as "+733%") — cap the displayed
// magnitude with a "+" suffix rather than show a technically-real but
// visually absurd number. Once more months of real data accumulate, actual
// swings will fall under this cap on their own and the "+" disappears.
const DELTA_CAP = 300;

export function OrdersPage() {
  const t = useTranslations('orders');
  const locale = useLocale();
  const isRtl = locale !== 'en';
  // "Previous"/"Next" arrows must point in the actual backward/forward
  // reading direction, which flips between Arabic (RTL) and English (LTR) —
  // hardcoding one icon pair made English pagination point the wrong way.
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const currency = useCurrencyDisplay();
  const [filters, setFilters] = useState<IOrderFilters>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [printRequestId, setPrintRequestId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useOrders(filters);
  const { data: selectedOrder = null } = useOrder(selectedOrderId ?? '');
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

  useEffect(() => {
    if (printRequestId && selectedOrder?.id === printRequestId) {
      window.print();
      const timer = setTimeout(() => setPrintRequestId(null), 0);
      return () => clearTimeout(timer);
    }
  }, [printRequestId, selectedOrder]);

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

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const stats = useMemo(() => ({
    total: orders.length,
    completed: orders.filter(o => o.status === 'completed').length,
    pending: orders.filter(o => o.status === 'pending').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0),
  }), [orders]);

  // Real this-month-vs-last-month deltas, computed from the already-fetched
  // order list's actual created_at timestamps — no fabricated percentages.
  const deltas = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonth = orders.filter(o => new Date(o.created_at) >= monthStart);
    const lastMonth = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= prevMonthStart && d < monthStart;
    });

    // A percentage change against a near-zero prior sample is statistically
    // meaningless (e.g. 1 -> 6 orders reads as "+500%") — hide it rather
    // than show a technically-real but misleading number. Gated on the
    // prior month's total order count (not the metric's own raw value),
    // since a currency amount like "5 SAR" isn't a meaningful sample size.
    const MIN_SAMPLE = 5;
    const reliable = lastMonth.length >= MIN_SAMPLE;
    const pct = (current: number, previous: number): number | null => {
      if (!reliable || previous === 0) return null;
      return Math.round(((current - previous) / previous) * 100);
    };

    const count = (list: Order[], status?: Order['status']) =>
      status ? list.filter(o => o.status === status).length : list.length;
    const revenue = (list: Order[]) =>
      list.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0);

    return {
      total: pct(count(thisMonth), count(lastMonth)),
      pending: pct(count(thisMonth, 'pending'), count(lastMonth, 'pending')),
      completed: pct(count(thisMonth, 'completed'), count(lastMonth, 'completed')),
      cancelled: pct(count(thisMonth, 'cancelled'), count(lastMonth, 'cancelled')),
      revenue: pct(revenue(thisMonth), revenue(lastMonth)),
    };
  }, [orders]);

  const statsConfig = [
    { labelKey: 'totalInvoices', value: stats.total, delta: deltas.total, icon: ClipboardList, iconBg: 'bg-posCloud-primary-light dark:bg-posCloud-primary/15', iconColor: 'text-posCloud-primary' },
    { labelKey: 'pendingCount', value: stats.pending, delta: deltas.pending, icon: Clock, iconBg: 'bg-posCloud-warning-light dark:bg-posCloud-warning/15', iconColor: 'text-posCloud-warning' },
    { labelKey: 'completedCount', value: stats.completed, delta: deltas.completed, icon: CheckCircle2, iconBg: 'bg-posCloud-success-light dark:bg-posCloud-success/15', iconColor: 'text-posCloud-success' },
    { labelKey: 'cancelledCount', value: stats.cancelled, delta: deltas.cancelled, icon: XCircle, iconBg: 'bg-posCloud-danger-light dark:bg-posCloud-danger/15', iconColor: 'text-posCloud-danger' },
    { labelKey: 'todayRevenue', value: `${stats.revenue.toLocaleString('en-US')} ${currency}`, delta: deltas.revenue, icon: Wallet, iconBg: 'bg-posCloud-primary-light dark:bg-posCloud-primary/15', iconColor: 'text-posCloud-primary' },
  ];

  function handlePrintOrder(order: Order) {
    setSelectedOrderId(order.id);
    setPrintRequestId(order.id);
  }

  // Order: draft, cancelled, pending, completed — matches the reference
  // exactly. "Draft" always shows 0 (real, not fabricated) since Sefay's
  // OrderStatus has no draft state — there can never be a draft order, so 0
  // is true by definition. Non-clickable since there's no real state to
  // filter by. "All" is rendered separately as a bordered dropdown-style box.
  // DOM order (right-to-left reading order in RTL): draft, cancelled,
  // completed, pending — "مسودة ملغاة مكتملة معلقة" per explicit correction.
  const statusPills: { value: OrderStatus; labelKey: string; count: number; iconColor: string; icon: typeof XCircle }[] = [
    { value: 'cancelled', labelKey: 'status.cancelled', count: stats.cancelled, iconColor: 'text-posCloud-danger bg-posCloud-danger-light dark:bg-posCloud-danger/15', icon: XCircle },
    { value: 'completed', labelKey: 'status.completed', count: stats.completed, iconColor: 'text-posCloud-success bg-posCloud-success-light dark:bg-posCloud-success/15', icon: CheckCircle2 },
    { value: 'pending', labelKey: 'status.pending', count: stats.pending, iconColor: 'text-posCloud-warning bg-posCloud-warning-light dark:bg-posCloud-warning/15', icon: Clock },
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
            <div className="flex items-center justify-between">
              <div className={`inline-flex p-2 rounded-lg ${stat.iconBg}`}>
                <stat.icon size={18} className={stat.iconColor} />
              </div>
              <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t(stat.labelKey as Parameters<typeof t>[0])}</p>
            </div>
            <p className="text-xl font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary mt-2">{stat.value}</p>
            {stat.delta !== null && (
              <p className={`flex items-center gap-1 text-xs mt-1 ${stat.delta >= 0 ? 'text-posCloud-success' : 'text-posCloud-danger'}`}>
                {stat.delta >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                {Math.min(Math.abs(stat.delta), DELTA_CAP)}{Math.abs(stat.delta) > DELTA_CAP ? '+' : ''}%
                <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('stats.vsLastMonth')}</span>
              </p>
            )}
          </div>
        ))}
      </div>

      <OrderFilters filters={filters} onChange={(next) => { setFilters(next); setPage(1); }} />

      <div className="flex flex-wrap items-center justify-between gap-2 -mt-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            title={t('status.draftHint')}
            className="flex items-center gap-1.5 h-8 rounded-full border border-posCloud-border dark:border-posCloudDark-border px-2.5 text-xs font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary cursor-default"
          >
            <span className="tabular-nums">0</span>
            {t('status.draft')}
            <span className="flex h-4 w-4 items-center justify-center rounded-full text-posCloud-text-tertiary bg-posCloud-background dark:bg-posCloudDark-background">
              <Circle size={11} />
            </span>
          </span>

          {statusPills.map(pill => (
            <button
              key={pill.value}
              onClick={() => { setFilters({ ...filters, status: pill.value }); setPage(1); }}
              className={`flex items-center gap-1.5 h-8 rounded-full border px-2.5 text-xs font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary transition-colors ${
                filters.status === pill.value
                  ? 'border-posCloud-primary/40'
                  : 'border-posCloud-border dark:border-posCloudDark-border hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span className="tabular-nums">{pill.count}</span>
              {t(pill.labelKey as Parameters<typeof t>[0])}
              <span className={`flex h-4 w-4 items-center justify-center rounded-full ${pill.iconColor}`}>
                <pill.icon size={11} />
              </span>
            </button>
          ))}

          <button
            onClick={() => { setFilters({ ...filters, status: undefined }); setPage(1); }}
            className={`flex items-center gap-1.5 h-8 rounded-lg border px-3 text-xs font-semibold transition-colors ${
              !filters.status
                ? 'border-posCloud-primary text-posCloud-primary bg-posCloud-primary-light dark:bg-posCloud-primary/15'
                : 'border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {t('status.all')}
            <span className="tabular-nums">{stats.total}</span>
            <ChevronDown size={13} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            title={t('edit.soon')}
            className="flex items-center gap-1.5 h-8 rounded-lg border border-posCloud-border dark:border-posCloudDark-border px-2.5 text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <Download size={13} />
            {t('filters.export')}
          </button>
          <button
            type="button"
            title={t('edit.soon')}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-secondary dark:text-posCloudDark-text-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <Settings2 size={13} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('loading')}</div>
      ) : (
        <>
          <OrdersTable
            orders={pagedOrders}
            onViewOrder={(order) => setSelectedOrderId(order.id)}
            onPrintOrder={handlePrintOrder}
            onCancelOrder={(order) => setCancelTarget(order)}
          />

          {filteredOrders.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-posCloud-border dark:border-posCloudDark-border hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <PrevIcon size={13} />
                  {t('pagination.prev')}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-1">
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1">…</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`h-7 w-7 rounded-lg text-xs font-medium ${p === currentPage ? 'bg-posCloud-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-secondary dark:text-posCloudDark-text-primary'}`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-posCloud-border dark:border-posCloudDark-border hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('pagination.next')}
                  <NextIcon size={13} />
                </button>
              </div>

              <span>
                {t('pagination.range', {
                  from: (currentPage - 1) * pageSize + 1,
                  to: Math.min(currentPage * pageSize, filteredOrders.length),
                  total: filteredOrders.length,
                })}
              </span>

              <div className="flex items-center gap-1.5">
                <span>{t('pagination.show')}</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="h-7 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-1.5 text-xs text-posCloud-text-primary dark:text-posCloudDark-text-primary focus:outline-none"
                >
                  {PAGE_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </>
      )}

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
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