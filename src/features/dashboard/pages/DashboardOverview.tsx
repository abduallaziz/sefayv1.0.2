'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
import {
  TrendingUp, ShoppingCart, Users, Clock,
  CreditCard, Wallet, BarChart3, AlertCircle,
} from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/features/reports/api/reports.api';
import { shiftsApi } from '@/features/shifts/api/shifts.api';
import { customersApi } from '@/features/customers/api/customers.api';

const CARD_STYLE = {
  borderTop: '3px solid #0C447C',
  borderRadius: '0 0 12px 12px',
} as const;

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: { value: string; up: boolean };
}) {
  return (
    <div
      className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-none dark:border-s dark:border-e dark:border-b dark:border-gray-800 overflow-hidden transition-transform duration-[180ms] hover:-translate-y-0.5"
      style={CARD_STYLE}
    >
      <div className="p-4 lg:p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px' }}>{label}</span>
          <div className="w-8 h-8 rounded-lg bg-[#E8F1FB] dark:bg-[#0C447C]/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#0C447C] dark:text-[#B5D4F4]" />
          </div>
        </div>
        <p className="tabular-nums text-slate-800 dark:text-slate-100" style={{ fontSize: '24px', fontWeight: 500 }}>
          {value}
        </p>
        <div className="flex items-center justify-between min-h-[20px]">
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
          {trend && (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-full"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                background: trend.up ? '#E8F1FB' : '#FCEBEB',
                color: trend.up ? '#0C447C' : '#A32D2D',
              }}
            >
              {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentBar({
  label,
  value,
  total,
  up,
}: {
  label: string;
  value: number;
  total: number;
  up: boolean;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '13px' }}>{label}</span>
        <span className="tabular-nums text-slate-700 dark:text-slate-300 font-medium" style={{ fontSize: '13px' }}>
          {value.toLocaleString('en-US')}
          <span className="text-slate-400 dark:text-slate-500 text-xs ms-1">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: up ? '#0C447C' : '#A32D2D' }}
        />
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const t = useTranslations('dashboard');
  const user = useAuthStore((s) => s.user);
  const currency = useTenantStore((s) => s.currency_symbol);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!user) router.replace(`/${locale}/login`);
  }, [user, router, locale]);

  const { data: revenue, isError: revError } = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: () => reportsApi.getRevenue({ period: 'today' }),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 0,
  });

  const { data: expenses } = useQuery({
    queryKey: ['dashboard', 'expenses'],
    queryFn: () => reportsApi.getExpenses({ period: 'today' }),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 0,
  });

  const { data: payments } = useQuery({
    queryKey: ['dashboard', 'payments'],
    queryFn: () => reportsApi.getPayments({ period: 'today' }),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 0,
  });

  const { data: shift } = useQuery({
    queryKey: ['dashboard', 'shift'],
    queryFn: () => shiftsApi.getCurrent(),
    enabled: !!user,
    refetchInterval: 10000,
    staleTime: 0,
  });

  const { data: customerStats } = useQuery({
    queryKey: ['dashboard', 'customers'],
    queryFn: () => customersApi.getStats(),
    enabled: !!user,
    refetchInterval: 60000,
    staleTime: 0,
  });

  if (!user) return null;

  const totalRevenue = revenue?.summary?.total_revenue ?? 0;
  const totalOrders = revenue?.summary?.total_orders ?? 0;
  const avgOrder = revenue?.summary?.avg_order_value ?? 0;
  const totalExpenses = expenses?.summary?.total_approved_amount ?? 0;
  const totalCustomers = customerStats?.total ?? 0;

  const shiftDuration = shift?.opened_at
    ? (() => {
        const diff = Date.now() - new Date(shift.opened_at).getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        return `${h}h ${m}m`;
      })()
    : '—';

  const paymentTotal = payments?.summary?.grand_total ?? 0;
  const cash = payments?.summary?.cash?.total ?? 0;
  const card = payments?.summary?.card?.total ?? 0;
  const other = paymentTotal - cash - card;

  return (
    <div className="space-y-6 max-w-screen-xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 sm:text-xl">
          {t('welcome')}، {user?.name ?? '...'} 👋
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{t('quickStats')}</p>
      </div>

      {/* Error */}
      {revError && (
        <div className="flex items-center gap-2 bg-[#FCEBEB] dark:bg-red-950/40 border border-[#A32D2D]/20 dark:border-red-800/30 rounded-xl px-4 py-3 text-[#A32D2D] dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{t('noData')}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label={t('todaySales')}
          value={`${totalRevenue.toLocaleString('en-US')} ${currency}`}
          icon={TrendingUp}
        />
        <StatCard
          label={t('invoices')}
          value={totalOrders.toLocaleString('en-US')}
          sub={avgOrder > 0 ? `${t('avgOrder')}: ${avgOrder.toLocaleString('en-US')} ${currency}` : undefined}
          icon={ShoppingCart}
        />
        <StatCard
          label={t('customers')}
          value={totalCustomers.toLocaleString('en-US')}
          icon={Users}
        />
        <StatCard
          label={t('totalExpenses')}
          value={`${totalExpenses.toLocaleString('en-US')} ${currency}`}
          icon={Wallet}
        />
      </div>

      {/* Payment + Shift */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">

        {/* Payment Methods */}
        <div
          className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-none dark:border dark:border-t-0 dark:border-gray-800 p-5 space-y-4"
          style={CARD_STYLE}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-slate-700 dark:text-slate-300 font-medium" style={{ fontSize: '13px' }}>
              {t('salesByPayment')}
            </h2>
            <CreditCard className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          </div>
          {paymentTotal > 0 ? (
            <div className="space-y-3">
              <PaymentBar label={t('cash')} value={cash} total={paymentTotal} up={true} />
              <PaymentBar label={t('card')} value={card} total={paymentTotal} up={true} />
              {other > 0 && <PaymentBar label={t('other')} value={other} total={paymentTotal} up={true} />}
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 text-sm">{t('noData')}</p>
          )}
        </div>

        {/* Current Shift */}
        <div
          className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-none dark:border dark:border-t-0 dark:border-gray-800 p-5 space-y-4"
          style={CARD_STYLE}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-slate-700 dark:text-slate-300 font-medium" style={{ fontSize: '13px' }}>
              {t('shiftDuration')}
            </h2>
            <Clock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          </div>
          {shift ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0C447C] animate-pulse" />
                <span className="text-[#0C447C] dark:text-[#B5D4F4] text-sm font-medium">{t('openShift')}</span>
              </div>
              <p className="tabular-nums text-slate-800 dark:text-slate-100" style={{ fontSize: '24px', fontWeight: 500 }}>
                {shiftDuration}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t('shiftOpenedAt')}: {new Date(shift.opened_at).toLocaleTimeString('en-US')}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm">
              <BarChart3 className="w-4 h-4" />
              <span>{t('noShift')}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}