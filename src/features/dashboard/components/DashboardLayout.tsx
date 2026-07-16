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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useTenantAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const t = useTranslations('common')
  const setCurrency = useTenantStore((s) => s.setCurrency)
  const [profileLoaded, setProfileLoaded] = useState(false)

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
      <div className="min-h-screen bg-posCloud-background dark:bg-posCloudDark-background">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <div className="relative flex h-[calc(100vh-66px)]">

          <DashboardSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}