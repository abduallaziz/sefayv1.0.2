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

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-4 lg:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function PaymentBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value.toLocaleString('en-US')} <span className="text-slate-500 text-xs">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
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

  const totalRevenue = revenue?.total_revenue ?? 0;
  const totalOrders = revenue?.total_orders ?? 0;
  const avgOrder = revenue?.average_order ?? 0;
  const totalExpenses = expenses?.total_expenses ?? 0;
  const totalCustomers = customerStats?.total ?? 0;

  const shiftDuration = shift?.opened_at
    ? (() => {
        const diff = Date.now() - new Date(shift.opened_at).getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        return `${h}h ${m}m`;
      })()
    : '—';

  const paymentTotal = payments?.total ?? 0;
  const paymentMethods = payments?.by_method ?? [];
  const cash = paymentMethods.find((p) => p.method === 'cash')?.total ?? 0;
  const card = paymentMethods.find((p) => p.method === 'card')?.total ?? 0;
  const other = paymentTotal - cash - card;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">
          {t('welcome')}، {user?.name ?? '...'} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('quickStats')}</p>
      </div>

      {revError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{t('noData')}</span>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label={t('todaySales')}
          value={`${totalRevenue.toLocaleString('en-US')} ${currency}`}
          icon={TrendingUp}
          iconClass="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          label={t('invoices')}
          value={totalOrders.toLocaleString('en-US')}
          sub={avgOrder > 0 ? `${t('avgOrder')}: ${avgOrder.toLocaleString('en-US')} ${currency}` : undefined}
          icon={ShoppingCart}
          iconClass="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          label={t('customers')}
          value={totalCustomers.toLocaleString('en-US')}
          icon={Users}
          iconClass="bg-violet-500/10 text-violet-400"
        />
        <StatCard
          label={t('totalExpenses')}
          value={`${totalExpenses.toLocaleString('en-US')} ${currency}`}
          icon={Wallet}
          iconClass="bg-rose-500/10 text-rose-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">{t('salesByPayment')}</h2>
            <CreditCard className="w-4 h-4 text-slate-600" />
          </div>
          {paymentTotal > 0 ? (
            <div className="space-y-3">
              <PaymentBar label={t('cash')} value={cash} total={paymentTotal} color="bg-emerald-400" />
              <PaymentBar label={t('card')} value={card} total={paymentTotal} color="bg-blue-400" />
              {other > 0 && <PaymentBar label={t('other')} value={other} total={paymentTotal} color="bg-violet-400" />}
            </div>
          ) : (
            <p className="text-slate-600 text-sm">{t('noData')}</p>
          )}
        </div>

        <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">{t('shiftDuration')}</h2>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          {shift ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-sm font-medium">{t('openShift')}</span>
              </div>
              <p className="text-3xl font-bold text-white">{shiftDuration}</p>
              <p className="text-xs text-slate-500">
                {t('shiftOpenedAt')}: {new Date(shift.opened_at).toLocaleTimeString('en-US')}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <BarChart3 className="w-4 h-4" />
              <span>{t('noShift')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}