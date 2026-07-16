'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Bell, Menu, Moon, Sun, Search, LogOut } from 'lucide-react'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useThemeStore } from '@/core/theme/stores/theme.store'
import { useLogout } from '@/features/auth/hooks/use-auth'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const user = useAuthStore((s) => s.user)
  const { theme, toggle } = useThemeStore()
  const { mutate: logout } = useLogout()
  const [notifCount] = useState(3)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const avatarBtnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (!menuOpen) return
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        avatarBtnRef.current && !avatarBtnRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  const openMenu = () => {
    const rect = avatarBtnRef.current?.getBoundingClientRect()
    if (rect) {
      const menuWidth = 180
      const rawLeft = isRTL ? rect.left : rect.right - menuWidth
      const clampedLeft = Math.min(Math.max(rawLeft, 8), window.innerWidth - menuWidth - 8)
      setMenuPos({ top: rect.bottom + 10, left: clampedLeft })
    }
    setMenuOpen((v) => !v)
  }

  // Matrix C1 (Checkpoint 2): full visual conversion to the posCloud/
  // posCloudDark design language, per explicit approval for 100% visual
  // parity with pos-cloud's flat topbar style. Every existing behavior is
  // preserved exactly: branch + search remain non-functional placeholders
  // (B6 decision — do not wire them up, do not remove them), language
  // switch/theme toggle/notifications/avatar-dropdown-with-logout remain
  // fully functional with identical logic, the ⌘K hint and user-email-in-
  // dropdown are kept since they're existing Sefay features pos-cloud's
  // own topbar doesn't have. Converted from inline style={{}} + manual
  // isDark ternaries to Tailwind classes + dark: variants — the same
  // mechanism already used by every other component in this migration,
  // not a new pattern (this file was the outlier, not Checkpoint 1).
  return (
    <header className="sticky top-0 z-[300] flex h-[68px] shrink-0 items-center gap-2 border-b border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3 sm:gap-3 sm:px-4 max-[480px]:px-2 max-[480px]:gap-[5px] max-[360px]:gap-[3px]">
      {/* Mobile menu trigger */}
      <button
        onClick={onMenuClick}
        className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border p-2 text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40 lg:hidden max-[480px]:flex max-[480px]:h-8 max-[480px]:w-8 max-[480px]:items-center max-[480px]:justify-center max-[480px]:p-0"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Brand tile */}
      <div className="hidden h-full shrink-0 items-center gap-2 rounded-xl bg-posCloud-navy-950 px-4 sm:flex lg:w-[240px]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#60a5fa" stroke="none" />
        </svg>
        <span className="whitespace-nowrap text-sm font-extrabold text-white max-[480px]:hidden">Sefay</span>
      </div>

      {/* User identity — opens a profile/logout menu */}
      <div className="relative shrink-0">
        <button
          ref={avatarBtnRef}
          onClick={openMenu}
          className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-posCloud-primary-400 to-posCloud-primary text-sm font-bold text-white max-[480px]:h-8 max-[480px]:w-8 max-[480px]:text-[11px]">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="hidden text-start sm:block" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <div className="text-sm font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
              {user?.name ?? '...'}
            </div>
            <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              {user?.role ?? ''}
            </p>
          </div>
        </button>

        {menuOpen && typeof document !== 'undefined' && createPortal(
          <div
            ref={dropdownRef}
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
            className="z-[1000] w-[180px] rounded-xl border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface p-1.5 shadow-lg"
          >
            <div className="border-b border-posCloud-border dark:border-posCloudDark-border px-3 py-2">
              <div className="text-sm font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                {user?.name ?? '...'}
              </div>
              <div className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                {user?.email ?? ''}
              </div>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false)
                logout()
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-posCloud-danger hover:bg-posCloud-danger-light"
              style={{ textAlign: isRTL ? 'right' : 'left' }}
            >
              <LogOut size={15} />
              {t('logout')}
            </button>
          </div>,
          document.body
        )}
      </div>

      <div className="hidden h-8 w-px shrink-0 bg-posCloud-border dark:bg-posCloudDark-border sm:block" />

      {/* Branch — existing Sefay element, kept as a placeholder per B6 (no
          store/backend exists yet for real branch switching); visual only */}
      <button
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-posCloud-border dark:border-posCloudDark-border px-3 py-2 text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40 lg:hidden"
        aria-label={t('branch')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>
      <button className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-posCloud-border dark:border-posCloudDark-border px-3 py-2 text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40 lg:flex">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>{t('branch')}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-55">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Search — existing Sefay element (incl. ⌘K hint, absent from
          pos-cloud), kept as a placeholder exactly as today; visual only */}
      <button
        className="flex shrink-0 items-center justify-center rounded-lg border border-posCloud-border dark:border-posCloudDark-border p-2 text-posCloud-text-tertiary hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40 lg:hidden"
        aria-label={t('search')}
      >
        <Search size={16} />
      </button>
      <div className="relative hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background px-3 py-2 md:flex md:max-w-xs lg:max-w-sm">
        <Search size={16} className="shrink-0 text-posCloud-text-tertiary" />
        <span className="flex-1 truncate text-sm text-posCloud-text-tertiary">{t('search')}</span>
        <kbd className="shrink-0 rounded-md border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-1.5 py-0.5 text-[10px] text-posCloud-text-tertiary">
          ⌘K
        </kbd>
      </div>

      {/* Language switcher */}
      <button
        onClick={switchLocale}
        className="flex shrink-0 items-center gap-1 rounded-lg p-2 text-xs font-semibold text-posCloud-text-tertiary hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40 max-[480px]:px-2 max-[480px]:py-1.5 max-[480px]:text-[11px] max-[360px]:px-1.5 max-[360px]:py-1 max-[360px]:text-[10px]"
      >
        {otherLabel}
      </button>

      {/* Dark mode toggle */}
      <button
        onClick={toggle}
        className="shrink-0 rounded-lg border border-posCloud-border dark:border-posCloudDark-border p-2 text-posCloud-text-tertiary hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40 max-[480px]:flex max-[480px]:h-8 max-[480px]:w-8 max-[480px]:items-center max-[480px]:justify-center max-[480px]:p-0"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Notifications */}
      <button className="relative shrink-0 rounded-lg p-2 text-posCloud-text-tertiary hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40 max-[480px]:flex max-[480px]:h-8 max-[480px]:w-8 max-[480px]:items-center max-[480px]:justify-center max-[480px]:p-0">
        <Bell size={18} />
        {notifCount > 0 && (
          <span className="absolute -top-0.5 end-[-2px] flex h-4 w-4 items-center justify-center rounded-full bg-posCloud-danger text-[10px] font-bold text-white">
            {notifCount}
          </span>
        )}
      </button>
    </header>
  )
}