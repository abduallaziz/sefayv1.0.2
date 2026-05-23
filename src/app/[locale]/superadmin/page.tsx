'use client'

import { useTranslations } from 'next-intl'
import { useActivateTenant, useDeactivateTenant, useExtendTrial } from '@/features/superadmin/hooks/use-tenants'
import { OverviewCards } from '@/features/superadmin/components/overview-cards'
import { RevenueChart } from '@/features/superadmin/components/revenue-chart'
import { TenantsTable } from '@/features/superadmin/components/tenants-table'
import { SystemHealth } from '@/features/superadmin/components/system-health'
import { ActivityFeed } from '@/features/superadmin/components/activity-feed'
import { AiInsights } from '@/features/superadmin/components/ai-insights'

const mockStats = {
  total_tenants: 248, active_tenants: 186, trial_tenants: 42,
  suspended_tenants: 20, mrr: 48500, arr: 582000, churn_rate: 2.4, new_tenants_this_month: 18,
}

const mockRevenue = [
  { month: 'Jan', revenue: 32000, tenants: 180 },
  { month: 'Feb', revenue: 35000, tenants: 195 },
  { month: 'Mar', revenue: 38000, tenants: 210 },
  { month: 'Apr', revenue: 36000, tenants: 205 },
  { month: 'May', revenue: 42000, tenants: 225 },
  { month: 'Jun', revenue: 45000, tenants: 235 },
  { month: 'Jul', revenue: 48500, tenants: 248 },
]

const mockTenants = [
  { id: '1', name: 'Coffee House',  business_type: 'cafe',       status: 'active' as const,    trial_ends_at: null,         created_at: '2024-01-15', deleted_at: null, users_count: 8,  branches_count: 3, mrr: 299 },
  { id: '2', name: 'Tech Repairs',  business_type: 'workshop',   status: 'trial' as const,     trial_ends_at: '2024-08-01', created_at: '2024-07-01', deleted_at: null, users_count: 3,  branches_count: 1, mrr: 0 },
  { id: '3', name: 'Fashion Store', business_type: 'retail',     status: 'active' as const,    trial_ends_at: null,         created_at: '2024-02-20', deleted_at: null, users_count: 12, branches_count: 5, mrr: 599 },
  { id: '4', name: 'Quick Bites',   business_type: 'restaurant', status: 'suspended' as const, trial_ends_at: null,         created_at: '2024-03-10', deleted_at: null, users_count: 6,  branches_count: 2, mrr: 199 },
  { id: '5', name: 'Beauty Salon',  business_type: 'services',   status: 'active' as const,    trial_ends_at: null,         created_at: '2024-04-05', deleted_at: null, users_count: 4,  branches_count: 1, mrr: 149 },
]

export default function SuperAdminPage() {
  const t = useTranslations('console')
  const activateTenant = useActivateTenant()
  const deactivateTenant = useDeactivateTenant()
  const extendTrial = useExtendTrial()

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
      <OverviewCards stats={mockStats} />

      <div className="grid grid-cols-2 gap-4">
        <AiInsights />
        <RevenueChart data={mockRevenue} />
      </div>

      <ActivityFeed />

      <TenantsTable
        tenants={mockTenants}
        onActivate={(id) => activateTenant.mutate(id)}
        onDeactivate={(id) => deactivateTenant.mutate(id)}
        onExtendTrial={(id) => extendTrial.mutate({ id, days: 14 })}
      />
    </div>
  )
}