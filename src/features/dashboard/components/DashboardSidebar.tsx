'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  LayoutDashboard, ShoppingCart, Package, Users,
  Receipt, Clock, BarChart3, Settings, UserCog,
  X, Zap, Warehouse,
} from 'lucide-react'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useThemeStore } from '@/core/theme/stores/theme.store'
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
  section: string
}

const ALL_NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/dashboard',           icon: LayoutDashboard, section: 'general' },
  { key: 'pos',       href: '/dashboard/pos',        icon: ShoppingCart,    section: 'sales' },
  { key: 'orders',    href: '/dashboard/orders',     icon: Receipt,         section: 'sales' },
  { key: 'items',     href: '/dashboard/items',      icon: Package,         section: 'inventory' },
  { key: 'inventory', href: '/dashboard/inventory',  icon: Warehouse,       section: 'inventory' },
  { key: 'customers', href: '/dashboard/customers',  icon: Users,           section: 'customers' },
  { key: 'expenses',  href: '/dashboard/expenses',   icon: Receipt,         section: 'finance', roles: ['owner', 'manager'] },
  { key: 'shifts',    href: '/dashboard/shifts',     icon: Clock,           section: 'hr' },
  { key: 'reports',   href: '/dashboard/reports',    icon: BarChart3,       section: 'reports',  roles: ['owner', 'manager'] },
  { key: 'users',     href: '/dashboard/users',      icon: UserCog,         section: 'hr',       roles: ['owner', 'manager'] },
  { key: 'settings',  href: '/dashboard/settings',   icon: Settings,        section: 'admin',    roles: ['owner'] },
]

export function DashboardSidebar({ open, onClose }: SidebarProps) {
  const t = useTranslations('sidebar')
  const locale = useLocale()
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { config } = useBusinessType()
  const isDark = useThemeStore((s) => s.theme === 'dark')

  const textMuted = isDark ? '#8B949E' : '#54657C'
  const iconMuted = isDark ? '#6E7681' : '#8C9CB2'
  const hoverBg = isDark ? 'rgba(91,155,213,0.12)' : 'rgba(12,68,124,0.065)'
  const hoverText = isDark ? '#5B9BD5' : '#0C447C'

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
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(10,22,40,0.4)', backdropFilter: 'blur(3px)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — always docked at the inline-start edge (right in RTL, left in LTR) */}
      <aside
        className={cn(
          'fixed bottom-0 start-0 z-40 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          open ? 'translate-x-0' : locale === 'ar' ? 'translate-x-full' : '-translate-x-full'
        )}
        style={{
          top: '66px',
          width: '264px',
          background: isDark
            ? 'linear-gradient(180deg, rgba(22,27,34,0.94), rgba(13,17,23,0.88))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.72))',
          backdropFilter: 'blur(22px) saturate(180%)',
          WebkitBackdropFilter: 'blur(22px) saturate(180%)',
          borderInlineEnd: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.95)',
          boxShadow: locale === 'ar' ? '-4px 0 28px rgba(10,22,40,0.06)' : '4px 0 28px rgba(10,22,40,0.06)',
        }}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between px-4 py-3 lg:hidden border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)' }}>
          <span className="text-sm font-semibold" style={{ color: textMuted }}>{t('menu')}</span>
          <button
            onClick={onClose}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: textMuted, cursor: 'pointer', background: 'transparent', border: 'none',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '13px 13px 3px' }}>
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 12px', borderRadius: '13px',
                  fontSize: '13px', fontWeight: active ? 600 : 500,
                  marginBottom: '2px', textDecoration: 'none',
                  transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                  position: 'relative',
                  ...(active
                    ? {
                        background: isDark
                          ? 'linear-gradient(135deg, #161D29, #1C2433)'
                          : 'linear-gradient(135deg, #0C447C, #1761B8)',
                        color: isDark ? '#5B9BD5' : '#fff',
                        border: isDark ? '1px solid rgba(91,155,213,0.28)' : 'none',
                        boxShadow: isDark
                          ? '0 4px 14px rgba(0,0,0,0.45)'
                          : '0 6px 18px rgba(12,68,124,0.32), 0 2px 6px rgba(12,68,124,0.24)',
                      }
                    : {
                        color: textMuted,
                        background: 'transparent',
                      }),
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = hoverBg
                    e.currentTarget.style.color = hoverText
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = textMuted
                  }
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  style={{ color: active ? (isDark ? '#5B9BD5' : '#fff') : iconMuted, flexShrink: 0 }}
                />
                <span style={{ flex: 1 }}>{t(item.key)}</span>
              </Link>
            )
          })}
        </nav>

        {/* Subscription card */}
        <div style={{ padding: '13px' }}>
          <div
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #11161F 0%, #161D29 48%, #1C2433 100%)'
                : 'linear-gradient(135deg, #082F5C 0%, #0C447C 48%, #1761B8 100%)',
              border: isDark ? '1px solid rgba(91,155,213,0.2)' : 'none',
              borderRadius: '18px', padding: '17px',
              position: 'relative', overflow: 'hidden',
              boxShadow: isDark
                ? '0 8px 16px rgba(0,0,0,0.4), 0 20px 40px rgba(0,0,0,0.4)'
                : '0 8px 16px rgba(10,22,40,0.05), 0 20px 48px rgba(10,22,40,0.12), 0 1px 0 rgba(255,255,255,0.12) inset',
            }}
          >
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', top: '-32px', left: '-32px',
              width: '104px', height: '104px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: '-42px', right: '-22px',
              width: '94px', height: '94px',
              background: 'radial-gradient(circle, rgba(37,99,235,0.28), transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px', position: 'relative' }}>
              <div style={{
                width: '31px', height: '31px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.22)',
              }}>
                <Zap size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.05em' }}>
                  {t('planLabel')}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  Pro — {t('trial')}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              height: '6px', background: 'rgba(255,255,255,0.18)',
              borderRadius: '6px', marginBottom: '7px', overflow: 'hidden',
            }}>
              <div style={{
                height: '6px', width: '64%',
                background: 'linear-gradient(90deg, #fff, #DBEAFE)',
                borderRadius: '6px',
                boxShadow: '0 0 12px rgba(255,255,255,0.55)',
              }} />
            </div>

            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.72)', position: 'relative' }}>
              {t('planDaysLeft', { days: 9 })}
            </div>

            <Link
              href={`/${locale}/dashboard/settings`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '6px', marginTop: '13px',
                background: 'rgba(255,255,255,0.22)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '11px', padding: '9px',
                fontSize: '12px', fontWeight: 700, color: '#fff',
                textDecoration: 'none', position: 'relative',
                backdropFilter: 'blur(10px)',
              }}
            >
              {t('upgrade')}
              <Zap size={14} />
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}