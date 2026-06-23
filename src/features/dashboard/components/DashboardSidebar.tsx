'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Receipt,
  Clock,
  BarChart3,
  Settings,
  UserCog,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useBusinessType } from '@/shared/hooks/useBusinessType'
import { cn } from '@/lib/utils'
import type { NavKey } from '@/shared/config/business-type.config'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  key: NavKey
  href: string
  icon: React.ElementType
  roles?: string[]
}

const ALL_NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/dashboard',          icon: LayoutDashboard },
  { key: 'pos',       href: '/dashboard/pos',       icon: ShoppingCart },
  { key: 'orders',    href: '/dashboard/orders',    icon: Receipt },
  { key: 'items',     href: '/dashboard/items',     icon: Package },
  { key: 'customers', href: '/dashboard/customers', icon: Users },
  { key: 'expenses',  href: '/dashboard/expenses',  icon: Receipt,   roles: ['owner', 'manager'] },
  { key: 'shifts',    href: '/dashboard/shifts',    icon: Clock },
  { key: 'reports',   href: '/dashboard/reports',   icon: BarChart3, roles: ['owner', 'manager'] },
  { key: 'users',     href: '/dashboard/users',     icon: UserCog,   roles: ['owner', 'manager'] },
  { key: 'settings',  href: '/dashboard/settings',  icon: Settings,  roles: ['owner'] },
]

export function DashboardSidebar({ open, onClose }: SidebarProps) {
  const t = useTranslations('sidebar')
  const locale = useLocale()
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { config } = useBusinessType()

  const userRole = user?.role ?? 'cashier'

  const visibleItems = ALL_NAV_ITEMS.filter((item) => {
    const inBusinessType = config.sidebar.includes(item.key)
    const hasRole = !item.roles || item.roles.includes(userRole)
    return inBusinessType && hasRole
  })

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === `/${locale}/dashboard`
    return pathname.startsWith(`/${locale}${href}`)
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-header bottom-0 z-sidebar w-sidebar flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          locale === 'ar'
            ? open ? 'translate-x-0 end-0' : 'translate-x-full end-0'
            : open ? 'translate-x-0 start-0' : '-translate-x-full start-0'
        )}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderInlineEnd: '1px solid var(--surface-border)',
        }}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between px-4 py-3 lg:hidden border-b border-surface-border">
          <span className="text-sm font-semibold text-content-secondary">{t('menu')}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-sm text-content-secondary hover:text-content-primary hover:bg-surface-hover transition-colors"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium',
                  'transition-all duration-150',
                  active
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-hover'
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={active ? 'text-white' : 'text-content-muted'}
                />
                <span>{t(item.key)}</span>

                {active && (
                  <span
                    className="ms-auto w-1.5 h-1.5 rounded-full bg-white/70"
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Subscription card */}
        <div className="p-3 border-t border-surface-border">
          <div
            className="rounded-sm p-3 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(12,68,124,0.08) 0%, rgba(38,113,196,0.08) 100%)',
              border: '1px solid rgba(12,68,124,0.15)',
            }}
          >
            <p className="text-xs font-medium text-brand-primary">{t('plan')}</p>
            <p className="text-xs text-content-muted mt-0.5">{t('planDaysLeft', { days: 14 })}</p>
            <Link
              href={`/${locale}/dashboard/settings`}
              className="mt-2 block text-xs font-semibold text-brand-primary hover:underline"
            >
              {t('upgrade')}
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}