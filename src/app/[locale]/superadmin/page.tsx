'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useActivateTenant, useDeactivateTenant, useExtendTrial, useStats, useRevenue } from '@/features/superadmin/hooks/use-tenants';
import { OverviewCards } from '@/features/superadmin/components/overview-cards';
import { RevenueChart } from '@/features/superadmin/components/revenue-chart';
import { TenantsTable } from '@/features/superadmin/components/tenants-table';
import { SystemHealth } from '@/features/superadmin/components/system-health';
import { ActivityFeed } from '@/features/superadmin/components/activity-feed';
import { AiInsights } from '@/features/superadmin/components/ai-insights';
import { useTenants } from '@/features/superadmin/tenants/hooks';
import { superadminApi } from '@/features/superadmin/api/superadmin.api';
import type { GlobalStats } from '@/features/superadmin/types';

const FALLBACK_STATS: GlobalStats = {
  totalTenants: 0,
  totalUsers: 0,
  totalOrders: 0,
  totalRevenue: 0,
};

export default function SuperAdminPage() {
  const t = useTranslations('console');
  const activateTenant = useActivateTenant();
  const deactivateTenant = useDeactivateTenant();
  const extendTrial = useExtendTrial();

  const { data: stats } = useStats();
  const { data: revenueData } = useRevenue();
  const { data: tenantsData } = useTenants({ page: 1, limit: 10 });

  const { data: mrr = 0 } = useQuery({
    queryKey: ['superadmin', 'analytics', 'mrr'],
    queryFn: async () => {
      const res = await superadminApi.getMRR() as any;
      return typeof res === 'number' ? res : res?.mrr ?? 0;
    },
  });

  const { data: arr = 0 } = useQuery({
    queryKey: ['superadmin', 'analytics', 'arr'],
    queryFn: async () => {
      const res = await superadminApi.getARR() as any;
      return typeof res === 'number' ? res : res?.arr ?? 0;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t('title')}</h1>
          <p className="text-xs text-white/30 mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/3 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-white/40 font-mono">{t('production')}</span>
        </div>
      </div>

      <SystemHealth />

      <OverviewCards
        stats={stats ?? FALLBACK_STATS}
        mrr={mrr}
        arr={arr}
      />

      <div className="grid grid-cols-2 gap-4">
        <AiInsights />
        <RevenueChart data={revenueData ?? []} />
      </div>

      <ActivityFeed />

      <TenantsTable
        tenants={tenantsData?.data ?? []}
        onActivate={(id) => activateTenant.mutate(id)}
        onDeactivate={(id) => deactivateTenant.mutate(id)}
        onExtendTrial={(id) => extendTrial.mutate({ id, days: 14 })}
      />
    </div>
  );
}