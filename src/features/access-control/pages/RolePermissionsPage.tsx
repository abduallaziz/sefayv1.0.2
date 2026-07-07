'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import {
  ArrowRight, Search, Info, ShieldCheck, Lock, Circle,
  ShoppingCart, Package, Receipt, Truck, BarChart3, Settings, Wallet,
  Users as UsersIcon, Clock, ShieldQuestion, ChevronDown,
} from 'lucide-react'
import { PageHeader } from '@/shared/ui/page-header'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import {
  useAccessControlRoles,
  usePermissionGroups,
  useRolePermissions,
  useUpdateRolePermission,
  useResetRolePermission,
  useResetRole,
} from '../hooks/useAccessControl'
import { PermissionGroupSection } from '../components/PermissionGroupSection'
import { SimpleAdvancedToggle } from '../components/SimpleAdvancedToggle'
import { PlatformPermissionsNotice } from '../components/PlatformPermissionsNotice'
import { PermissionHistoryPanel } from '../components/PermissionHistoryPanel'
import { Sparkline } from '../components/Sparkline'

const PROTECTED_ROLE_NAMES = new Set(['owner', 'superadmin'])

// Cosmetic icon per known group code — purely a display nicety, the set of
// groups/permissions itself always comes from the API, never from this map.
// Unknown/future codes fall back to a generic shield icon.
const GROUP_ICONS: Record<string, React.ReactNode> = {
  sales: <ShoppingCart className="w-4 h-4" />,
  inventory: <Package className="w-4 h-4" />,
  expenses: <Receipt className="w-4 h-4" />,
  purchasing: <Truck className="w-4 h-4" />,
  reports: <BarChart3 className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
  payroll: <Wallet className="w-4 h-4" />,
  employees: <UsersIcon className="w-4 h-4" />,
  attendance: <Clock className="w-4 h-4" />,
  platform: <ShieldQuestion className="w-4 h-4" />,
}
const GROUP_COLORS = [
  { bg: '#E8F1FB', fg: '#0C447C' },
  { bg: '#E6F9EE', fg: '#16A34A' },
  { bg: '#FEF3DA', fg: '#D97706' },
  { bg: '#EDEAFB', fg: '#7C6EF6' },
]

type Tab = 'overview' | 'permissions' | 'users' | 'history'

export function RolePermissionsPage({ roleId }: { roleId: string }) {
  const t = useTranslations('accessControl')
  const locale = useLocale()
  const user = useAuthStore((s) => s.user)
  const isSuperadmin = user?.role === 'superadmin'

  const { data: roles } = useAccessControlRoles()
  const role = roles?.find((r) => r.id === roleId)
  const isProtected = role ? PROTECTED_ROLE_NAMES.has(role.name) : false

  const { data: groups, isLoading: groupsLoading } = usePermissionGroups()
  const { data: permissions, isLoading: permissionsLoading, isError } = useRolePermissions(roleId)
  const updatePermission = useUpdateRolePermission(roleId)
  const resetPermission = useResetRolePermission(roleId)
  const resetRole = useResetRole(roleId)

  const [tab, setTab] = useState<Tab>('overview')
  const [advanced, setAdvanced] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'custom' | 'partial' | 'default'>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  const grantedTotal = permissions?.filter((p) => p.granted).length ?? 0
  const customizedTotal = permissions?.filter((p) => p.source === 'tenant_override').length ?? 0
  const defaultSourceTotal = permissions?.filter((p) => p.granted && p.source === 'global').length ?? 0

  const filteredPermissions = useMemo(() => {
    if (!permissions) return []
    if (!search.trim()) return permissions
    const q = search.trim().toLowerCase()
    return permissions.filter(
      (p) =>
        p.permission_key.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q),
    )
  }, [permissions, search])

  const groupedPermissions = useMemo(() => {
    if (!groups) return []
    return groups
      .map((group) => ({
        group,
        items: filteredPermissions.filter((p) => p.group_code === group.code),
      }))
      .filter((g) => g.items.length > 0)
      .filter((g) => {
        if (statusFilter === 'all') return true
        const total = g.items.length
        const customized = g.items.filter((p) => p.source === 'tenant_override').length
        const status = customized === 0 ? 'default' : customized === total ? 'custom' : 'partial'
        return status === statusFilter
      })
  }, [groups, filteredPermissions, statusFilter])

  function handleToggle(permissionKey: string, isGranted: boolean) {
    setActionError(null)
    updatePermission.mutate({ permissionKey, isGranted }, { onError: () => setActionError(t('saveError')) })
  }

  function handleReset(permissionKey: string) {
    setActionError(null)
    resetPermission.mutate(permissionKey, { onError: () => setActionError(t('saveError')) })
  }

  function handleResetRole() {
    setActionError(null)
    resetRole.mutate(undefined, {
      onSuccess: () => setConfirmResetOpen(false),
      onError: () => { setActionError(t('saveError')); setConfirmResetOpen(false) },
    })
  }

  const readOnly = isProtected
  const isLoading = groupsLoading || permissionsLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title={role?.name ?? ''}
        description={t('roleDetailSubtitle')}
        breadcrumb={[
          { label: t('breadcrumbSettings'), href: '/dashboard/settings' },
          { label: t('title'), href: '/dashboard/settings/access-control' },
          { label: role?.name ?? '' },
        ]}
        actions={
          <Link
            href="/dashboard/settings/access-control"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0C447C] dark:hover:text-[#5B9BD5] transition-colors"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            {t('backToRoles')}
          </Link>
        }
      />

      {actionError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
        </div>
      )}
      {isError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{t('loadError')}</p>
        </div>
      )}

      {/* Role header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0C447C] flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">{role?.name}</h2>
        </div>
        {isProtected ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Lock className="w-3 h-3" /> {t('protectedRole')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Circle className="w-1.5 h-1.5 fill-current" /> {t('active')}
          </span>
        )}
      </div>

      {isProtected && (
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-3">
          <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('protectedRoleHint')}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-lg bg-[#E8F1FB] dark:bg-[#0C447C]/20 text-[#0C447C] dark:text-[#5B9BD5] flex items-center justify-center mb-2.5"><UsersIcon className="w-4 h-4" /></div>
          <p className="text-[11px] text-slate-400 font-bold mb-0.5">{t('userCount')}</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{role?.user_count ?? '—'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t('outOfTotalUsers')}</p>
          <Sparkline seed={`${roleId}-users`} color="#0C447C" />
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-lg bg-[#E8F1FB] dark:bg-[#0C447C]/20 text-[#0C447C] dark:text-[#5B9BD5] flex items-center justify-center mb-2.5"><ShieldCheck className="w-4 h-4" /></div>
          <p className="text-[11px] text-slate-400 font-bold mb-0.5">{t('totalPermissions')}</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{grantedTotal}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t('outOfTotalPermissions')}</p>
          <Sparkline seed={`${roleId}-total`} color="#0C447C" />
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5"><ShieldQuestion className="w-4 h-4" /></div>
          <p className="text-[11px] text-slate-400 font-bold mb-0.5">{t('customizedPermissions')}</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{customizedTotal}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t('customizedHint')}</p>
          <Sparkline seed={`${roleId}-custom`} color="#0EA5A0" />
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-2.5"><Settings className="w-4 h-4" /></div>
          <p className="text-[11px] text-slate-400 font-bold mb-0.5">{t('defaultSource')}</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{defaultSourceTotal}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t('outOfTotalPermissions')}</p>
          <Sparkline seed={`${roleId}-default`} color="#7C6EF6" />
        </div>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-[#DCE9F8] bg-gradient-to-l from-[#E8F1FB] via-[#EEF4FC] to-[#F5F9FF] dark:from-[#0C447C]/10 dark:via-[#0C447C]/5 dark:to-transparent p-6 flex items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white">{t('customizeTitle')}</h3>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">{t('customizeHint')}</p>
          {!readOnly && (
            <button
              onClick={() => setTab('permissions')}
              className="inline-flex items-center gap-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-colors"
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-180" /> {t('startCustomizing')}
            </button>
          )}
        </div>
        <div className="hidden sm:block flex-shrink-0">
          <div className="w-20 h-20 rounded-3xl bg-[#0C447C] flex items-center justify-center text-white">
            <ShieldCheck className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200 dark:border-gray-800">
        {([
          ['overview', t('tabOverview')],
          ['permissions', t('tabPermissions')],
          ['users', t('tabUsers')],
          ['history', t('tabHistory')],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 -mb-px text-sm font-bold border-b-2 transition-colors ${
              tab === key
                ? 'text-[#0C447C] dark:text-[#5B9BD5] border-[#0C447C] dark:border-[#5B9BD5]'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="text-sm text-slate-500 dark:text-slate-400">{t('overviewHint')}</div>
      )}

      {tab === 'permissions' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-sm font-bold text-slate-600 dark:text-slate-300"
              >
                {t(`statusFilter.${statusFilter}`)} <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {filterOpen && (
                <div className="absolute z-10 mt-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden min-w-[140px]">
                  {(['all', 'custom', 'partial', 'default'] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => { setStatusFilter(k); setFilterOpen(false) }}
                      className="block w-full text-start px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800"
                    >
                      {t(`statusFilter.${k}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full ps-9 pe-3 py-2 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C]"
              />
            </div>

            <div className="flex items-center gap-3">
              <SimpleAdvancedToggle advanced={advanced} onChange={setAdvanced} />
              {!isProtected && (
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t('resetRoleToDefault')}
                </button>
              )}
            </div>
          </div>

          {!isSuperadmin && <PlatformPermissionsNotice />}

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-gray-800">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">{t('groupsTableTitle')}</h3>
              <span className="bg-[#E8F1FB] dark:bg-[#0C447C]/20 text-[#0C447C] dark:text-[#5B9BD5] text-[11px] font-extrabold rounded-full px-2.5 py-0.5">
                {t('groupCount', { count: groupedPermissions.length })}
              </span>
            </div>

            {isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : groupedPermissions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">{t('noPermissionsFound')}</p>
            ) : (
              groupedPermissions.map(({ group, items }, i) => {
                const color = GROUP_COLORS[i % GROUP_COLORS.length]
                return (
                  <PermissionGroupSection
                    key={group.id}
                    title={locale === 'ar' ? group.name_ar : group.name_en}
                    icon={GROUP_ICONS[group.code] ?? <ShieldQuestion className="w-4 h-4" />}
                    iconBg={color.bg}
                    iconFg={color.fg}
                    permissions={items}
                    labelFor={(p) => p.description ?? p.permission_key}
                    advanced={advanced}
                    readOnly={readOnly}
                    defaultOpen={groupedPermissions.length <= 3}
                    onToggle={handleToggle}
                    onReset={handleReset}
                  />
                )
              })
            )}
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-10 text-center">
          <p className="text-sm text-slate-400">{t('usersTabSoon')}</p>
        </div>
      )}

      {tab === 'history' && <PermissionHistoryPanel />}

      <ConfirmDialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleResetRole}
        variant="warning"
        title={t('resetRoleConfirmTitle')}
        message={t('resetRoleConfirmMessage')}
        confirmLabel={t('resetRoleToDefault')}
        cancelLabel={t('cancel')}
        loadingLabel={t('saving')}
        isLoading={resetRole.isPending}
      />
    </div>
  )
}
