'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import { TrendingUp, ShoppingCart, Users, Clock } from 'lucide-react';
import { StatCard, PageHeader } from '@/shared/ui';

export function DashboardOverview() {
  const t = useTranslations('dashboard');
  const user = useAuthStore((s) => s.user);

  const stats = [
    { labelKey: 'todaySales',    value: '2,480 SAR', change: 12,  icon: TrendingUp,  variant: 'info'    as const },
    { labelKey: 'invoices',      value: '34',        change: 5,   icon: ShoppingCart, variant: 'success' as const },
    { labelKey: 'customers',     value: '28',        change: 3,   icon: Users,        variant: 'default' as const },
    { labelKey: 'shiftDuration', value: '6h',        change: 0,   icon: Clock,        variant: 'warning' as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('welcome')}، ${user?.name ?? '...'} 👋`}
        description={t('comingSoon')}
        theme="superadmin"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.labelKey}
            title={t(stat.labelKey)}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            variant={stat.variant}
            theme="superadmin"
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-[#1a1f2e] border border-[#1e2130] rounded-xl p-5 h-64 flex items-center justify-center">
          <p className="text-[#64748b] text-sm">{t('salesChart')} — {t('comingSoon')}</p>
        </div>
        <div className="bg-[#1a1f2e] border border-[#1e2130] rounded-xl p-5 h-64 flex items-center justify-center">
          <p className="text-[#64748b] text-sm">{t('recentInvoices')} — {t('comingSoon')}</p>
        </div>
      </div>
    </div>
  );
}