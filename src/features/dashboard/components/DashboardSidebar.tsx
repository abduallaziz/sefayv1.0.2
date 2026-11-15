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
  Utensils, ChefHat, Car, CalendarClock, CalendarDays, Wallet, ClipboardCheck as LeavesIcon,
  IdCard, Ticket, StickyNote, Calculator, Building2, Gift,
} from 'lucide-react'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useBusinessType } from '@/shared/hooks/useBusinessType'
import { useSubscription } from '@/features/settings/hooks/useSettings'
import { useEntitlements } from '@/features/subscription-gate/useEntitlements'
import { cn } from '@/lib/utils'
import type { NavKey } from '@/shared/config/business-type.config'

// Nav keys that map to a gated feature. Anything absent here is always shown (core: POS, items, customers…).
// Gating only bites when SUBSCRIPTION_ENFORCEMENT is on for the tenant — see the entitlements filter below.
const NAV_FEATURE: Partial<Record<NavKey, string>> = {
  reports: 'reports',
  branches: 'multi_branch',
  accounting: 'billing',
  attendance: 'shifts',
  schedules: 'shifts',
  payroll: 'shifts',
  leaves: 'shifts',
}

// Same valid-status set BillingService.checkBranchLimit() and the Branch
// Management capacity card use — kept in sync manually, no shared enum
// between the two apps. A subscription outside this set has no real
// remaining-days concept, trial or otherwise.
const VALID_SUBSCRIPTION_STATUSES = ['trial', 'active', 'grace_period']

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export interface NavItem {
  key: NavKey
  href: string
  icon: React.ElementType
  roles?: string[]
  section?: string
}

export interface NavGroup {
  key: string
  icon: React.ElementType
  children: NavItem[]
}

type NavEntry = { kind: 'item'; item: NavItem } | { kind: 'group'; group: NavGroup }

const INVENTORY_ROLES = ['superadmin', 'owner', 'manager', 'inventory_clerk']
const MG = ['owner', 'manager']

// Sidebar organization is deliberately kept separate from module internals (owner-approved layout,
// 2026-11-15): one ordered list of top-level items and collapsible groups. Order here IS the sidebar order.
export const NAV_ENTRIES: NavEntry[] = [
  { kind: 'item', item: { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard } },

  { kind: 'group', group: { key: 'sales', icon: ShoppingCart, children: [
    { key: 'pos',         href: '/dashboard/pos',          icon: ShoppingCart },
    { key: 'orders',      href: '/dashboard/orders',       icon: Receipt },
    { key: 'tables',      href: '/dashboard/tables',       icon: Utensils },
    { key: 'kitchen',     href: '/dashboard/kitchen',      icon: ChefHat },
    { key: 'washQueue',   href: '/dashboard/queue',        icon: Car },
    { key: 'coupons',     href: '/dashboard/coupons',      icon: Ticket,     roles: MG },
    { key: 'rewards',     href: '/dashboard/rewards',      icon: Gift,       roles: MG },
    { key: 'notePresets', href: '/dashboard/note-presets', icon: StickyNote, roles: MG },
  ] } },

  { kind: 'item', item: { key: 'items', href: '/dashboard/items', icon: Package } },

  { kind: 'group', group: { key: 'inventory', icon: Layers, children: [
    { key: 'inventoryDashboard', href: '/dashboard/inventory',           icon: LayoutDashboard },
    { key: 'warehouses',         href: '/dashboard/warehouses',          icon: Warehouse },
    { key: 'locations',          href: '/dashboard/locations',           icon: MapPin },
    { key: 'stock',              href: '/dashboard/stock',               icon: Boxes },
    { key: 'movements',          href: '/dashboard/movements',           icon: ArrowLeftRight },
    { key: 'transfers',          href: '/dashboard/transfers',           icon: Layers,            roles: INVENTORY_ROLES },
    { key: 'adjustments',        href: '/dashboard/adjustments',         icon: SlidersHorizontal, roles: INVENTORY_ROLES },
    { key: 'stockCounts',        href: '/dashboard/stock-counts',        icon: ClipboardCheck,    roles: INVENTORY_ROLES },
    { key: 'planning',           href: '/dashboard/planning',            icon: ListChecks,        roles: INVENTORY_ROLES },
    { key: 'inventoryAnalytics', href: '/dashboard/inventory-analytics', icon: LineChart,         roles: INVENTORY_ROLES },
    { key: 'quality',            href: '/dashboard/quality',             icon: ShieldCheck,       roles: INVENTORY_ROLES },
    { key: 'wms',                href: '/dashboard/wms',                 icon: Forklift,          roles: INVENTORY_ROLES },
    { key: 'inventoryReports',   href: '/dashboard/inventory/reports',   icon: FileBarChart,      roles: INVENTORY_ROLES },
  ] } },

  { kind: 'group', group: { key: 'purchasing', icon: Truck, children: [
    { key: 'suppliers',      href: '/dashboard/suppliers',       icon: Truck,         roles: INVENTORY_ROLES },
    { key: 'purchaseOrders', href: '/dashboard/purchase-orders', icon: ClipboardList, roles: INVENTORY_ROLES },
    { key: 'goodsReceipts',  href: '/dashboard/goods-receipts',  icon: PackageCheck,  roles: INVENTORY_ROLES },
  ] } },

  { kind: 'item', item: { key: 'customers', href: '/dashboard/customers', icon: Users } },

  { kind: 'group', group: { key: 'finance', icon: Calculator, children: [
    { key: 'accounting', href: '/dashboard/accounting',            icon: Calculator, roles: MG },
    { key: 'expenses',   href: '/dashboard/expenses-v2/expenses',  icon: Receipt,    roles: MG },
  ] } },

  { kind: 'group', group: { key: 'hr', icon: IdCard, children: [
    { key: 'employees',  href: '/dashboard/employees',  icon: IdCard,        roles: MG },
    { key: 'attendance', href: '/dashboard/attendance', icon: CalendarClock },
    { key: 'schedules',  href: '/dashboard/schedules',  icon: CalendarDays,  roles: MG },
    { key: 'shifts',     href: '/dashboard/shifts',     icon: Clock },
    { key: 'payroll',    href: '/dashboard/payroll',    icon: Wallet,        roles: ['owner'] },
    { key: 'leaves',     href: '/dashboard/leaves',     icon: LeavesIcon,    roles: MG },
  ] } },

  { kind: 'item', item: { key: 'reports', href: '/dashboard/reports', icon: BarChart3, roles: MG } },

  { kind: 'group', group: { key: 'admin', icon: Settings, children: [
    { key: 'branches', href: '/dashboard/branches', icon: Building2, roles: MG },
    { key: 'users',    href: '/dashboard/users',    icon: UserCog,   roles: MG },
    { key: 'settings', href: '/dashboard/settings', icon: Settings,  roles: ['owner'] },
  ] } },
]

const GROUP_KEYS = NAV_ENTRIES.flatMap((e) => (e.kind === 'group' ? [e.group.key] : []))

// Back-compat flat exports for GlobalSearch (it unions both to search every navigable page).
export const ALL_NAV_ITEMS: NavItem[] = NAV_ENTRIES.flatMap((e) => (e.kind === 'item' ? [e.item] : []))
export const INVENTORY_GROUP_ITEMS: NavItem[] = NAV_ENTRIES.flatMap((e) =>
  e.kind === 'group' ? e.group.children : [],
)

const GROUP_STORAGE_PREFIX = 'sidebar.group.'

export function DashboardSidebar({ open, onClose }: SidebarProps) {
  const t = useTranslations('sidebar')
  const locale = useLocale()
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { config } = useBusinessType()
  const { data: subData } = useSubscription()
  const { data: ent } = useEntitlements()
  // A feature outside the plan is hidden entirely (never read), but only once enforcement is on for
  // the tenant; otherwise `ent.enforced` is false and everything shows exactly as before.
  const featureAllowed = (key: NavKey) => {
    const feat = NAV_FEATURE[key]
    if (!feat || !ent?.enforced) return true
    return ent.features.includes(feat)
  }
  // Lazy initializer, not a direct Date.now() call in the render body —
  // same pattern already used elsewhere in this codebase (system-health.tsx)
  // to keep "now" a stable, pure render input instead of drifting per render.
  const [now] = useState(() => Date.now())

  const sub = subData?.subscription
  // Entitlements is the source of truth for the plan name/validity (it can't go stale or 402 like
  // /tenant/subscription), so the card never reads "no plan" while a plan is active.
  const planName = ent?.plan?.name ?? sub?.plan_name ?? null
  const subStatus = ent?.status ?? sub?.status
  const isValidSubscription = ent
    ? ['trial', 'active', 'grace'].includes(ent.phase)
    : !!sub && VALID_SUBSCRIPTION_STATUSES.includes(sub.status)
  const isTrialing = (ent?.phase ?? sub?.status) === 'trial'
  const trialDaysLeft = isTrialing
    ? (ent?.days_left ?? (subData?.trial_ends_at
        ? Math.max(0, Math.ceil((new Date(subData.trial_ends_at).getTime() - now) / 86_400_000))
        : null))
    : null

  const userRole = user?.role ?? 'cashier'

  const canSee = (item: NavItem) =>
    config.sidebar.includes(item.key) &&
    (!item.roles || item.roles.includes(userRole)) &&
    featureAllowed(item.key)

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === `/${locale}/dashboard`
    return pathname.startsWith(`/${locale}${href}`)
  }

  // The ordered entries after role / business-type / feature filtering; empty groups are dropped.
  const visibleEntries = NAV_ENTRIES.flatMap((entry): NavEntry[] => {
    if (entry.kind === 'item') return canSee(entry.item) ? [entry] : []
    const children = entry.group.children.filter(canSee)
    return children.length ? [{ kind: 'group', group: { ...entry.group, children } }] : []
  })

  // Per-group expand/collapse, persisted. Undefined => fall back to "expanded when a child route is active".
  const [groupState, setGroupState] = useState<Record<string, boolean>>({})
  useEffect(() => {
    // Client-only (localStorage is absent during SSR) — read once after hydration to avoid a mismatch.
    const next: Record<string, boolean> = {}
    for (const key of GROUP_KEYS) {
      const v = window.localStorage.getItem(`${GROUP_STORAGE_PREFIX}${key}`)
      if (v !== null) next[key] = v === 'true'
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Object.keys(next).length) setGroupState(next)
  }, [])

  const isGroupActive = (g: NavGroup) => g.children.some((c) => isActive(c.href))
  const isExpanded = (g: NavGroup) => groupState[g.key] ?? isGroupActive(g)
  const toggleGroup = (g: NavGroup) => {
    const next = !isExpanded(g)
    setGroupState((s) => ({ ...s, [g.key]: next }))
    window.localStorage.setItem(`${GROUP_STORAGE_PREFIX}${g.key}`, String(next))
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
          {visibleEntries.map((entry) => {
            if (entry.kind === 'item') {
              const item = entry.item
              return (
                <NavLink
                  key={item.key}
                  href={`/${locale}${item.href}`}
                  label={t(item.key)}
                  icon={item.icon}
                  active={isActive(item.href)}
                  onClick={onClose}
                />
              )
            }
            const group = entry.group
            const groupActive = isGroupActive(group)
            const expanded = isExpanded(group)
            const GroupIcon = group.icon
            return (
              <div key={group.key} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  aria-expanded={expanded}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] transition-colors',
                    groupActive
                      ? 'bg-posCloud-primary font-semibold text-white shadow-sm shadow-posCloud-primary/30'
                      : 'font-medium text-posCloud-text-secondary hover:bg-slate-100 hover:text-posCloud-text-primary dark:text-posCloudDark-text-secondary dark:hover:bg-white/5 dark:hover:text-posCloudDark-text-primary'
                  )}
                >
                  <GroupIcon size={18} strokeWidth={2} className="shrink-0" />
                  <span className="flex-1 text-start">{t(`group.${group.key}`)}</span>
                  <ChevronDown
                    size={16}
                    className={cn('shrink-0 transition-transform duration-200', expanded && 'rotate-180')}
                  />
                </button>

                {expanded && (
                  <div className="mt-0.5 ps-3.5">
                    {group.children.map((item) => (
                      <NavLink
                        key={item.key}
                        href={`/${locale}${item.href}`}
                        label={t(item.key)}
                        icon={item.icon}
                        active={isActive(item.href)}
                        onClick={onClose}
                        compact
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
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
                  {planName ?? '—'}
                  {isTrialing && <> — {t('trial')}</>}
                  {!isValidSubscription && <> — {t(`subStatus.${subStatus ?? 'none'}`)}</>}
                </div>
              </div>
            </div>

            {/* Progress bar only makes sense as a trial countdown — hidden
                for every other state instead of showing a fake fill. */}
            {isTrialing && (
              <div className="mb-[7px] h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-1.5 w-2/3 rounded-full bg-white" />
              </div>
            )}

            {isTrialing && trialDaysLeft !== null ? (
              <div className="text-[11px] text-white/75">
                {t('planDaysLeft', { days: trialDaysLeft })}
              </div>
            ) : !isValidSubscription ? (
              <div className="text-[11px] text-white/75">
                {t('subscriptionInactive')}
              </div>
            ) : null}

            <Link
              href={`/${locale}/dashboard/settings/subscription`}
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