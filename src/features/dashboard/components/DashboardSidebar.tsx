'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ShoppingCart, Package, Users,
  Receipt, Clock, BarChart3, Settings, UserCog,
  X, Zap, Truck, Warehouse, ClipboardList, PackageCheck, Boxes, SlidersHorizontal,
  ChevronDown, ArrowLeftRight, FileBarChart, Layers, ClipboardCheck, MapPin, ListChecks, LineChart, ShieldCheck, Forklift,
  Utensils, ChefHat, CalendarClock, CalendarDays, Wallet, ClipboardCheck as LeavesIcon,
  IdCard, Ticket, StickyNote, Calculator,
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
  section: string
}

const INVENTORY_ROLES = ['superadmin', 'owner', 'manager', 'inventory_clerk']

const ALL_NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/dashboard',           icon: LayoutDashboard, section: 'general' },
  { key: 'pos',       href: '/dashboard/pos',        icon: ShoppingCart,    section: 'sales' },
  { key: 'orders',    href: '/dashboard/orders',     icon: Receipt,         section: 'sales' },
  { key: 'items',     href: '/dashboard/items',      icon: Package,         section: 'inventory' },
  { key: 'customers', href: '/dashboard/customers',  icon: Users,           section: 'customers' },
  { key: 'expenses',  href: '/dashboard/expenses',   icon: Receipt,         section: 'finance', roles: ['owner', 'manager'] },
  { key: 'accounting', href: '/dashboard/accounting', icon: Calculator,     section: 'finance', roles: ['owner', 'manager'] },
  { key: 'shifts',    href: '/dashboard/shifts',     icon: Clock,           section: 'hr' },
  { key: 'tables',    href: '/dashboard/tables',     icon: Utensils,        section: 'sales' },
  { key: 'kitchen',   href: '/dashboard/kitchen',    icon: ChefHat,         section: 'sales' },
  { key: 'coupons',   href: '/dashboard/coupons',    icon: Ticket,          section: 'sales',    roles: ['owner', 'manager'] },
  { key: 'notePresets', href: '/dashboard/note-presets', icon: StickyNote, section: 'sales',    roles: ['owner', 'manager'] },
  { key: 'reports',   href: '/dashboard/reports',    icon: BarChart3,       section: 'reports',  roles: ['owner', 'manager'] },
  { key: 'users',     href: '/dashboard/users',      icon: UserCog,         section: 'hr',       roles: ['owner', 'manager'] },
  { key: 'employees', href: '/dashboard/employees',  icon: IdCard,          section: 'hr',       roles: ['owner', 'manager'] },
  { key: 'attendance', href: '/dashboard/attendance', icon: CalendarClock, section: 'hr' },
  { key: 'schedules', href: '/dashboard/schedules',  icon: CalendarDays,    section: 'hr',       roles: ['owner', 'manager'] },
  { key: 'payroll',   href: '/dashboard/payroll',    icon: Wallet,          section: 'hr',       roles: ['owner'] },
  { key: 'leaves',    href: '/dashboard/leaves',     icon: LeavesIcon,      section: 'hr',       roles: ['owner', 'manager'] },
  { key: 'settings',  href: '/dashboard/settings',   icon: Settings,        section: 'admin',    roles: ['owner'] },
]

// Children of the single collapsible "Inventory" sidebar group. Kept out of
// ALL_NAV_ITEMS so they never render as separate top-level rows.
const INVENTORY_GROUP_ITEMS: NavItem[] = [
  { key: 'inventoryDashboard', href: '/dashboard/inventory',         icon: LayoutDashboard,   section: 'inventory-group' },
  { key: 'warehouses',         href: '/dashboard/warehouses',        icon: Warehouse,         section: 'inventory-group' },
  { key: 'locations',          href: '/dashboard/locations',         icon: MapPin,            section: 'inventory-group' },
  { key: 'stock',              href: '/dashboard/stock',             icon: Boxes,             section: 'inventory-group' },
  { key: 'movements',          href: '/dashboard/movements',         icon: ArrowLeftRight,    section: 'inventory-group' },
  { key: 'transfers',          href: '/dashboard/transfers',         icon: Layers,            section: 'inventory-group', roles: INVENTORY_ROLES },
  { key: 'adjustments',        href: '/dashboard/adjustments',       icon: SlidersHorizontal, section: 'inventory-group', roles: INVENTORY_ROLES },
  { key: 'stockCounts',        href: '/dashboard/stock-counts',      icon: ClipboardCheck,    section: 'inventory-group', roles: INVENTORY_ROLES },
  { key: 'planning',           href: '/dashboard/planning',          icon: ListChecks,        section: 'inventory-group', roles: INVENTORY_ROLES },
  { key: 'inventoryAnalytics', href: '/dashboard/inventory-analytics', icon: LineChart,       section: 'inventory-group', roles: INVENTORY_ROLES },
  { key: 'quality',            href: '/dashboard/quality',            icon: ShieldCheck,      section: 'inventory-group', roles: INVENTORY_ROLES },
  { key: 'wms',                href: '/dashboard/wms',                icon: Forklift,         section: 'inventory-group', roles: INVENTORY_ROLES },
  { key: 'suppliers',          href: '/dashboard/suppliers',         icon: Truck,             section: 'inventory-group', roles: INVENTORY_ROLES },
  { key: 'purchaseOrders',     href: '/dashboard/purchase-orders',   icon: ClipboardList,     section: 'inventory-group', roles: INVENTORY_ROLES },
  { key: 'goodsReceipts',      href: '/dashboard/goods-receipts',    icon: PackageCheck,      section: 'inventory-group', roles: INVENTORY_ROLES },
  { key: 'inventoryReports',   href: '/dashboard/inventory/reports', icon: FileBarChart,      section: 'inventory-group', roles: INVENTORY_ROLES },
]

const INVENTORY_GROUP_STORAGE_KEY = 'sidebar.inventoryGroupExpanded'

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

  const visibleInventoryItems = INVENTORY_GROUP_ITEMS.filter((item) => {
    const inBusinessType = config.sidebar.includes(item.key)
    const hasRole = !item.roles || item.roles.includes(userRole)
    return inBusinessType && hasRole
  })

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === `/${locale}/dashboard`
    return pathname.startsWith(`/${locale}${href}`)
  }

  const inventoryGroupActive = visibleInventoryItems.some((item) => isActive(item.href))

  const [inventoryExpanded, setInventoryExpanded] = useState(inventoryGroupActive)

  useEffect(() => {
    const stored = window.localStorage.getItem(INVENTORY_GROUP_STORAGE_KEY)
    if (stored !== null) {
      setInventoryExpanded(stored === 'true')
    } else if (inventoryGroupActive) {
      setInventoryExpanded(true)
    }
    // Only read the persisted preference once on mount; active-route detection
    // below keeps the group open while navigating its own children.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (inventoryGroupActive) setInventoryExpanded(true)
  }, [inventoryGroupActive])

  const toggleInventoryGroup = () => {
    const next = !inventoryExpanded
    setInventoryExpanded(next)
    window.localStorage.setItem(INVENTORY_GROUP_STORAGE_KEY, String(next))
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — always docked at the inline-start edge (right in RTL, left in LTR) */}
      <aside
        className={cn(
          'fixed bottom-0 start-0 top-[66px] z-40 flex w-[260px] flex-col overflow-y-auto border-e border-posCloud-border dark:border-posCloudDark-border bg-posCloud-sidebar dark:bg-posCloudDark-sidebar transition-transform duration-300 ease-in-out',
          'lg:sticky lg:top-[66px] lg:bottom-auto lg:h-[calc(100vh-66px)] lg:shrink-0 lg:translate-x-0',
          open ? 'translate-x-0' : locale === 'ar' ? 'translate-x-full' : '-translate-x-full'
        )}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between border-b border-posCloud-border dark:border-posCloudDark-border px-4 py-3 lg:hidden">
          <span className="text-sm font-semibold text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('menu')}</span>
          <button
            onClick={onClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav — px-4 py-6 matches pos-cloud's exact outer nav padding
            (sidebar.tsx's <aside className="... px-4 py-6 ..."> wrapping
            SidebarContent's <nav>). */}
        <nav className="flex-1 overflow-y-auto px-4 pb-1 pt-6">
          {visibleItems.map((item) => {
            const active = isActive(item.href)
            return (
              <NavLink
                key={item.key}
                href={`/${locale}${item.href}`}
                label={t(item.key)}
                icon={item.icon}
                active={active}
                onClick={onClose}
              />
            )
          })}

          {visibleInventoryItems.length > 0 && (
            <div className="mb-1">
              <button
                type="button"
                onClick={toggleInventoryGroup}
                aria-expanded={inventoryExpanded}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] transition-colors',
                  inventoryGroupActive
                    ? 'bg-posCloud-primary font-semibold text-white shadow-sm shadow-posCloud-primary/30'
                    : 'font-medium text-posCloud-text-secondary hover:bg-slate-100 hover:text-posCloud-text-primary dark:text-posCloudDark-text-secondary dark:hover:bg-white/5 dark:hover:text-posCloudDark-text-primary'
                )}
              >
                <Layers size={18} strokeWidth={2} className="shrink-0" />
                <span className="flex-1 text-start">{t('inventory')}</span>
                <ChevronDown
                  size={16}
                  className={cn('shrink-0 transition-transform duration-200', inventoryExpanded && 'rotate-180')}
                />
              </button>

              {inventoryExpanded && (
                <div className="mt-0.5 ps-3.5">
                  {visibleInventoryItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <NavLink
                        key={item.key}
                        href={`/${locale}${item.href}`}
                        label={t(item.key)}
                        icon={item.icon}
                        active={active}
                        onClick={onClose}
                        compact
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Subscription card */}
        <div className="p-4">
          <div className="rounded-2xl bg-posCloud-primary dark:bg-posCloudDark-navy-900 p-[17px]">
            <div className="mb-3 flex items-center gap-[9px]">
              <div className="flex h-[31px] w-[31px] items-center justify-center rounded-[10px] bg-white/20">
                <Zap size={16} className="text-white" />
              </div>
              <div>
                <div className="text-[10px] font-semibold tracking-wide text-white/70">
                  {t('planLabel')}
                </div>
                <div className="text-[13px] font-bold text-white">
                  Pro — {t('trial')}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-[7px] h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-1.5 w-2/3 rounded-full bg-white" />
            </div>

            <div className="text-[11px] text-white/75">
              {t('planDaysLeft', { days: 9 })}
            </div>

            <Link
              href={`/${locale}/dashboard/settings`}
              className="mt-[13px] flex items-center justify-center gap-1.5 rounded-[11px] bg-white/20 py-2 text-xs font-bold text-white no-underline hover:bg-white/25"
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

interface NavLinkProps {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  onClick: () => void
  compact?: boolean
}

function NavLink({ href, label, icon: Icon, active, onClick, compact }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'mb-1 flex items-center gap-3 rounded-xl transition-colors',
        compact ? 'px-4 py-2.5 text-[13px]' : 'px-4 py-3 text-[14px]',
        active
          ? 'bg-posCloud-primary font-semibold text-white shadow-sm shadow-posCloud-primary/30'
          : 'font-medium text-posCloud-text-secondary hover:bg-slate-100 hover:text-posCloud-text-primary dark:text-posCloudDark-text-secondary dark:hover:bg-white/5 dark:hover:text-posCloudDark-text-primary'
      )}
    >
      <Icon size={compact ? 16 : 18} strokeWidth={2} className="shrink-0" />
      <span className="flex-1">{label}</span>
    </Link>
  )
}