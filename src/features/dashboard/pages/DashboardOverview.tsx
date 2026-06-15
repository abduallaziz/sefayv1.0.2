'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import { TrendingUp, ShoppingCart, Users, Clock } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

export function DashboardOverview() {
  const t = useTranslations('dashboard');
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!user) {
      router.replace(`/${locale}/login`);
    }
  }, [user, router, locale]);

  const { data: revenueData } = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: () => apiClient.get('/reports/revenue?period=today') as any,
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 0,
  });

  const { data: customersData } = useQuery({
    queryKey: ['dashboard', 'customers-stats'],
    queryFn: () => apiClient.get('/customers/stats') as any,
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 0,
  });

  const { data: currentShift } = useQuery({
    queryKey: ['dashboard', 'current-shift'],
    queryFn: () => apiClient.get('/shifts/current') as any,
    enabled: !!user,
    refetchInterval: 10000,
    staleTime: 0,
  });

  if (!user) return null;

  const todayRevenue = revenueData?.summary?.total_revenue ?? 0;
  const todayOrders = revenueData?.summary?.total_orders ?? 0;
  const totalCustomers = customersData?.total ?? 0;

  const shiftDuration = currentShift?.opened_at
    ? (() => {
        const diff = Date.now() - new Date(currentShift.opened_at).getTime();
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return `${hours}h ${mins}m`;
      })()
    : '—';

  const stats = [
    { labelKey: 'todaySales', value: formatCurrency(todayRevenue), icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-400' },
    { labelKey: 'invoices', value: String(todayOrders), icon: ShoppingCart, color: 'bg-blue-500/10 text-blue-400' },
    { labelKey: 'customers', value: String(totalCustomers), icon: Users, color: 'bg-violet-500/10 text-violet-400' },
    { labelKey: 'shiftDuration', value: shiftDuration, icon: Clock, color: 'bg-amber-500/10 text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{t('welcome')}، {user?.name ?? '...'} 👋</h1>
        <p className="text-sm text-slate-500 mt-1">{t('comingSoon')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.labelKey} className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 uppercase tracking-wider">{t(stat.labelKey as any)}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5 h-64 flex items-center justify-center">
          <p className="text-slate-600 text-sm">{t('salesChart')} — {t('comingSoon')}</p>
        </div>
        <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5 h-64 flex items-center justify-center">
          <p className="text-slate-600 text-sm">{t('recentInvoices')} — {t('comingSoon')}</p>
        </div>
      </div>
    </div>
  );
}