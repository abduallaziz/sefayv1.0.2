'use client'

import { useState, useEffect } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { ThemeProvider } from '@/core/theme/components/ThemeProvider'
import { useTenantAuth } from '@/core/auth/hooks/useTenantAuth'
import { useTranslations } from 'next-intl'
import { settingsApi } from '@/features/settings/api/settings.api'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { useThemeStore } from '@/core/theme/stores/theme.store'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useTenantAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const t = useTranslations('common')
  const setCurrency = useTenantStore((s) => s.setCurrency)
  const isDark = useThemeStore((s) => s.theme === 'dark')
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#0D1117' : '#E9EEF5' }}>
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
          backgroundImage: isDark
            ? 'radial-gradient(1400px 700px at 88% -8%, rgba(37,99,235,0.10), transparent 52%), radial-gradient(1000px 600px at 6% 12%, rgba(12,68,124,0.10), transparent 48%)'
            : 'radial-gradient(1400px 700px at 88% -8%, rgba(37,99,235,0.07), transparent 52%), radial-gradient(1000px 600px at 6% 12%, rgba(12,68,124,0.055), transparent 48%)',
          backgroundColor: isDark ? '#0D1117' : '#E9EEF5',
          backgroundAttachment: 'fixed',
        }}
      >
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <div style={{ display: 'flex', height: 'calc(100vh - 66px)', position: 'relative' }}>

          <DashboardSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <main
            className="p-4 lg:p-6 lg:ms-[264px]"
            style={{ flex: 1, minWidth: 0, overflowX: 'hidden', overflowY: 'auto' }}
          >
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}