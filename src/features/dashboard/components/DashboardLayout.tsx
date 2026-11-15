'use client'

import { useState, useEffect } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { ThemeProvider } from '@/core/theme/components/ThemeProvider'
import { useTenantAuth } from '@/core/auth/hooks/useTenantAuth'
import { useTranslations } from 'next-intl'
import { settingsApi } from '@/features/settings/api/settings.api'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { RealtimeProvider } from '@/core/realtime/RealtimeProvider'
import { ShiftReportHost } from '@/features/shifts/components/ShiftReportHost'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useEntitlements } from '@/features/subscription-gate/useEntitlements'
import { SubscriptionBanner } from '@/features/subscription-gate/SubscriptionBanner'
import { SubscriptionLockModal } from '@/features/subscription-gate/SubscriptionLockModal'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useTenantAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const t = useTranslations('common')
  const setCurrency = useTenantStore((s) => s.setCurrency)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const role = useAuthStore((s) => s.user?.role)
  const { data: ent } = useEntitlements()
  const [renewOpen, setRenewOpen] = useState(false)
  // Plan ended (and enforcement is on for this tenant): every page is blocked behind the renewal popup.
  const locked = !!ent?.enforced && ent.locked
  const isOwner = role === 'owner'
  const showBanner = !!ent?.enforced && !ent.locked && ent.show_countdown && (isOwner || role === 'manager')

  useEffect(() => {
    if (!isAuthenticated || profileLoaded) return
    settingsApi.getProfile().then((profile) => {
      if (profile.currency_code && profile.currency_symbol) {
        setCurrency(profile.currency_code, profile.currency_symbol)
      }
      setProfileLoaded(true)
    }).catch(() => setProfileLoaded(true))
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-posCloud-background dark:bg-posCloudDark-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-posCloud-primary">
            <span className="text-base font-bold text-white">S</span>
          </div>
          <p className="text-[13px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <ThemeProvider>
      <RealtimeProvider />
      <ShiftReportHost />
      <div className="min-h-screen bg-posCloud-background dark:bg-posCloudDark-background">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <div className="relative flex h-[calc(100vh-66px)]">

          <DashboardSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
            {showBanner && ent && (
              <div className="-mx-4 -mt-4 mb-4 lg:-mx-6 lg:-mt-6">
                <SubscriptionBanner ent={ent} onRenew={() => setRenewOpen(true)} />
              </div>
            )}
            {locked ? null : children}
          </main>
        </div>
      </div>
      {locked && ent && <SubscriptionLockModal ent={ent} canRenew={isOwner} forced />}
      {!locked && renewOpen && ent && (
        <SubscriptionLockModal ent={ent} canRenew={isOwner} forced={false} onClose={() => setRenewOpen(false)} />
      )}
    </ThemeProvider>
  )
}