'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Bell, Search, Sun, Moon, Menu } from 'lucide-react'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useThemeStore } from '@/core/theme/stores/theme.store'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const t = useTranslations('header')
  const locale = useLocale()
  const { user, clearAuth } = useAuthStore()
  const { theme, toggle } = useThemeStore()

  return (
    <header
      className="fixed top-0 inset-x-0 z-header h-header flex items-center px-4 gap-3"
      style={{
        background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 50%, #1761B8 100%)',
        boxShadow: '0 2px 16px rgba(8, 47, 92, 0.4)',
      }}
    >
      {/* Menu toggle (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-150"
        aria-label="toggle menu"
      >
        <Menu size={20} strokeWidth={2} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="w-8 h-8 rounded-sm flex items-center justify-center text-white font-bold text-sm select-none"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        >
          S
        </div>
        <span className="hidden sm:block text-white font-semibold text-lg tracking-tight">
          Sefay
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <button className="hidden md:flex items-center gap-2 px-3 h-9 rounded-sm text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors duration-150 text-sm">
        <Search size={16} strokeWidth={2} />
        <span>{t('search')}</span>
        <kbd className="ms-2 text-xs text-white/40 border border-white/20 rounded px-1.5 py-0.5">
          /
        </kbd>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button className="relative flex items-center justify-center w-9 h-9 rounded-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-150">
          <Bell size={18} strokeWidth={2} />
          <span
            className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-red-400"
            aria-hidden="true"
          />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex items-center justify-center w-9 h-9 rounded-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-150"
          aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
        >
          {theme === 'dark' ? (
            <Sun size={18} strokeWidth={2} />
          ) : (
            <Moon size={18} strokeWidth={2} />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/20 mx-1" />

        {/* User */}
        <div className="flex items-center gap-2 ps-1">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-white text-sm font-medium leading-tight">
              {user?.name ?? t('user')}
            </span>
            <span className="text-white/50 text-xs leading-tight">
              {user?.role ?? ''}
            </span>
          </div>
          <button
            onClick={clearAuth}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 hover:opacity-90 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.92)', color: '#0C447C' }}
            title={t('logout')}
          >
            {(user?.name ?? 'U').charAt(0).toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  )
}