'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Bell, Menu, Moon, Sun, Search } from 'lucide-react'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useThemeStore } from '@/core/theme/stores/theme.store'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const user = useAuthStore((s) => s.user)
  const { theme, toggle } = useThemeStore()
  const [notifCount] = useState(3)
  const pathname = usePathname()
  const router = useRouter()
  const currentLocale = useLocale()
  const t = useTranslations('header')
  const isRTL = currentLocale === 'ar'
  const otherLocale = isRTL ? 'en' : 'ar'
  const otherLabel = isRTL ? 'EN' : 'عربي'

  const switchLocale = () => {
    const newPath = pathname.replace(`/${currentLocale}`, `/${otherLocale}`)
    router.push(newPath)
  }

  return (
    <header
      style={{
        height: '66px',
        background: 'linear-gradient(115deg, #082F5C 0%, #0C447C 42%, #1761B8 100%)',
        boxShadow: '0 6px 28px rgba(8,47,92,0.42), 0 1px 0 rgba(255,255,255,0.1) inset',
        position: 'sticky',
        top: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '12px',
        flexShrink: 0,
      }}
    >
      {/* Logo zone */}
      <div
        className="lg:w-[264px]"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        {/* Mobile menu btn */}
        <button
          onClick={onMenuClick}
          className="lg:hidden"
          style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.13)',
            border: '1px solid rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Menu size={18} />
        </button>

        {/* Logo mark */}
        <div
          style={{
            width: '39px', height: '39px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.12))',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.32)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.25) inset',
            flexShrink: 0,
          }}
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="white">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>

        {/* Brand name */}
        <span
          style={{
            fontSize: '21px', fontWeight: 700, color: '#fff',
            letterSpacing: '-0.6px', textShadow: '0 1px 3px rgba(0,0,0,0.18)',
          }}
        >
          Sefay
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Branch pill */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: 'rgba(255,255,255,0.13)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: '11px', padding: '8px 13px',
          color: 'rgba(255,255,255,0.94)', fontSize: '12px', fontWeight: 500,
          cursor: 'pointer', backdropFilter: 'blur(10px)',
        }}
        className="hidden sm:flex"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>{t('branch')}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Search */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          background: 'rgba(255,255,255,0.13)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: '11px', padding: '9px 14px',
          color: 'rgba(255,255,255,0.62)', fontSize: '13px',
          width: '206px', backdropFilter: 'blur(10px)', cursor: 'text',
        }}
        className="hidden md:flex"
      >
        <Search size={16} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{t('search')}</span>
        <kbd
          style={{
            fontSize: '10px',
            background: 'rgba(255,255,255,0.16)',
            padding: '2px 7px', borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.16)',
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Lang switcher */}
      <button
        onClick={switchLocale}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: 'rgba(255,255,255,0.13)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: '11px', padding: '8px 13px',
          color: 'rgba(255,255,255,0.94)', fontSize: '12px', fontWeight: 500,
          cursor: 'pointer', backdropFilter: 'blur(10px)',
        }}
      >
        {otherLabel}
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          width: '39px', height: '39px', borderRadius: '12px',
          background: 'rgba(255,255,255,0.13)',
          border: '1px solid rgba(255,255,255,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer', backdropFilter: 'blur(10px)',
          flexShrink: 0,
        }}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Notifications */}
      <button
        style={{
          width: '39px', height: '39px', borderRadius: '12px',
          background: 'rgba(255,255,255,0.13)',
          border: '1px solid rgba(255,255,255,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer', backdropFilter: 'blur(10px)',
          flexShrink: 0, position: 'relative',
        }}
      >
        <Bell size={18} />
        {notifCount > 0 && (
          <span
            style={{
              position: 'absolute', top: '-5px', left: '-5px',
              background: 'linear-gradient(135deg, #FB7185, #EF4444)',
              color: '#fff', fontSize: '9px', fontWeight: 700,
              width: '18px', height: '18px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #0C447C',
              boxShadow: '0 2px 8px rgba(239,68,68,0.55)',
            }}
          >
            {notifCount}
          </span>
        )}
      </button>

      {/* User avatar */}
      <div
        style={{
          width: '39px', height: '39px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
          border: '2px solid rgba(255,255,255,0.42)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, color: '#fff',
          flexShrink: 0, cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
        }}
      >
        {user?.name?.[0]?.toUpperCase() ?? 'U'}
      </div>

      {/* User name */}
      <div className="hidden sm:block" style={{ minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
          {user?.name ?? '...'}
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
          {user?.role ?? ''}
        </div>
      </div>
    </header>
  )
}