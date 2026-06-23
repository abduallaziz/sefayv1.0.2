'use client'

import { useState, useEffect } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { ThemeProvider } from '@/core/theme/components/ThemeProvider'
import { useTenantAuth } from '@/core/auth/hooks/useTenantAuth'
import { useTranslations, useLocale } from 'next-intl'
import { settingsApi } from '@/features/settings/api/settings.api'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useTenantAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const t = useTranslations('common')
  const locale = useLocale()
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E9EEF5' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #0C447C, #1761B8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 2s infinite',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>S</span>
          </div>
          <p style={{ color: '#8C9CB2', fontSize: '13px' }}>{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <ThemeProvider>
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(1400px 700px at 88% -8%, rgba(37,99,235,0.07), transparent 52%), radial-gradient(1000px 600px at 6% 12%, rgba(12,68,124,0.055), transparent 48%), #E9EEF5',
          backgroundAttachment: 'fixed',
        }}
      >
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <div style={{ display: 'flex', minHeight: 'calc(100vh - 66px)' }}>
          <DashboardSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <main
            style={{
              flex: 1,
              marginInlineEnd: locale === 'ar' ? '264px' : undefined,
              marginInlineStart: locale === 'ar' ? undefined : '264px',
              padding: '24px',
              minWidth: 0,
            }}
            className="lg:block"
          >
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}