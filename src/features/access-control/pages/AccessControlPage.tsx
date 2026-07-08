'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  Search, Plus, LayoutGrid, List, ArrowRight, Info, ShieldCheck, Lock, Circle,
  ShoppingCart, Package, Receipt, Truck, BarChart3, Settings, Wallet,
  Users as UsersIcon, Clock, ShieldQuestion, ChevronDown,
} from 'lucide-react'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState } from '@/shared/ui/empty-state'
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
import { RoleCard } from '../components/RoleCard'
import { PermissionGroupSection } from '../components/PermissionGroupSection'
import { SimpleAdvancedToggle } from '../components/SimpleAdvancedToggle'
import { PlatformPermissionsNotice } from '../components/PlatformPermissionsNotice'
import { PermissionHistoryPanel } from '../components/PermissionHistoryPanel'
import { Sparkline } from '../components/Sparkline'

const PROTECTED_ROLE_NAMES = new Set(['owner', 'superadmin'])
const PAGE_SIZE = 8

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

export function AccessControlPage({ initialRoleId }: { initialRoleId?: string }) {
  const t = useTranslations('accessControl')
  const locale = useLocale()
  const user = useAuthStore((s) => s.user)
  const isSuperadmin = user?.role === 'superadmin'

  const { data: roles, isLoading: rolesLoading, isError: rolesError } = useAccessControlRoles()

  // Selection lives in plain state — clicking a role updates the detail panel
  // in place, it never navigates to a different page. The URL is kept in
  // sync (for shareable/bookmarkable links) via history.replaceState only,
  // with no Next.js route transition and no remount of the roles list.
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(initialRoleId)

  useEffect(() => {
    if (!selectedRoleId && roles && roles.length > 0) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  function selectRole(id: string) {
    setSelectedRoleId(id)
    window.history.replaceState(null, '', `/${locale}/dashboard/settings/access-control/${id}`)
  }

  const role = roles?.find((r) => r.id === selectedRoleId)
  const isProtected = role ? PROTECTED_ROLE_NAMES.has(role.name) : false

  // ---- left panel: search + pagination ----
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filteredRoles = useMemo(() => {
    if (!roles) return []
    if (!search.trim()) return roles
    const q = search.trim().toLowerCase()
    return roles.filter((r) => r.name.toLowerCase().includes(q))
  }, [roles, search])

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE))
  const pageItems = filteredRoles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ---- right panel: detail state ----
  const { data: groups, isLoading: groupsLoading } = usePermissionGroups()
  const { data: permissions, isLoading: permissionsLoading, isError: permsError } = useRolePermissions(selectedRoleId ?? '')
  const updatePermission = useUpdateRolePermission(selectedRoleId ?? '')
  const resetPermission = useResetRolePermission(selectedRoleId ?? '')
  const resetRole = useResetRole(selectedRoleId ?? '')

  const [tab, setTab] = useState<Tab>('overview')
  const [advanced, setAdvanced] = useState(false)
  const [permSearch, setPermSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'custom' | 'partial' | 'default'>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  const grantedTotal = permissions?.filter((p) => p.granted).length ?? 0
  const customizedTotal = permissions?.filter((p) => p.source === 'tenant_override').length ?? 0
  const defaultSourceTotal = permissions?.filter((p) => p.granted && p.source === 'global').length ?? 0

  const filteredPermissions = useMemo(() => {
    if (!permissions) return []
    if (!permSearch.trim()) return permissions
    const q = permSearch.trim().toLowerCase()
    return permissions.filter(
      (p) => p.permission_key.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q),
    )
  }, [permissions, permSearch])

  const groupedPermissions = useMemo(() => {
    if (!groups) return []
    return groups
      .map((group) => ({ group, items: filteredPermissions.filter((p) => p.group_code === group.code) }))
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
  const detailLoading = groupsLoading || permissionsLoading

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {/*
        This grid is forced to dir="ltr" purely so column order is
        predictable (roles panel = first column = visually on the left,
        detail panel = second column = visually on the right), matching the
        approved reference exactly. In an RTL grid, the first-defined column
        renders on the right instead, which put the roles panel on the wrong
        side. Each panel below restores dir="rtl" internally so Arabic text
        still flows correctly — only the column order is pinned.
      */}
      <div dir="ltr" className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
        {/* ===== LEFT: roles panel ===== */}
        <div dir="rtl" className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">{t('rolesListTitle')}</h2>
            <span className="bg-[#E8F1FB] dark:bg-[#0C447C]/20 text-[#0C447C] dark:text-[#5B9BD5] text-[11px] font-extrabold rounded-full px-2.5 py-0.5">
              {filteredRoles.length}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder={t('searchRolePlaceholder')}
                className="w-full bg-transparent border-0 outline-none text-sm text-slate-800 dark:text-white"
              />
            </div>
            <button className="w-9 h-9 flex-shrink-0 rounded-lg border border-[#0C447C] bg-[#E8F1FB] dark:bg-[#0C447C]/20 text-[#0C447C] dark:text-[#5B9BD5] flex items-center justify-center">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 flex-shrink-0 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-400 flex items-center justify-center">
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            disabled
            title={t('newRoleSoon')}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-gray-800 text-slate-400 rounded-lg py-2.5 text-sm font-bold mb-4 cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> {t('newRole')}
          </button>

          {rolesError && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 mb-3">
              <p className="text-sm text-red-600 dark:text-red-400">{t('loadError')}</p>
            </div>
          )}

          {rolesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : pageItems.length > 0 ? (
            <>
              <div className="space-y-2">
                {pageItems.map((r, i) => (
                  <RoleCard
                    key={r.id}
                    role={r}
                    index={(page - 1) * PAGE_SIZE + i}
                    selected={r.id === selectedRoleId}
                    onSelect={() => selectRole(r.id)}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-gray-800">
                <span className="text-xs text-slate-400">
                  {t('paginationInfo', {
                    from: filteredRoles.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
                    to: Math.min(page * PAGE_SIZE, filteredRoles.length),
                    total: filteredRoles.length,
                  })}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 rounded-md border border-slate-200 dark:border-gray-700 text-slate-500 flex items-center justify-center disabled:opacity-40">‹</button>
                  <span className="w-7 h-7 rounded-md bg-[#0C447C] text-white text-xs font-bold flex items-center justify-center">{page}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 rounded-md border border-slate-200 dark:border-gray-700 text-slate-500 flex items-center justify-center disabled:opacity-40">›</button>
                </div>
              </div>
            </>
          ) : (
            !rolesError && <EmptyState icon={ShieldCheck} title={t('emptyTitle')} description={t('emptyDescription')} />
          )}
        </div>

        {/* ===== RIGHT: detail panel ===== */}
        <div dir="rtl" className="space-y-5">
          {!role ? (
            rolesLoading ? (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-16 animate-pulse h-64" />
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-16 text-center text-sm text-slate-400">
                {t('selectRolePrompt')}
              </div>
            )
          ) : (
            <>
              {actionError && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
                  <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
                </div>
              )}
              {permsError && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{t('loadError')}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#0C447C] flex items-center justify-center text-white">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">{role.name}</h2>
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

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F1FB] dark:bg-[#0C447C]/20 text-[#0C447C] dark:text-[#5B9BD5] flex items-center justify-center mb-2.5"><UsersIcon className="w-4 h-4" /></div>
                  <p className="text-[11px] text-slate-400 font-bold mb-0.5">{t('userCount')}</p>
                  <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{role.user_count}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('outOfTotalUsers')}</p>
                  <Sparkline seed={`${role.id}-users`} color="#0C447C" />
                </div>
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F1FB] dark:bg-[#0C447C]/20 text-[#0C447C] dark:text-[#5B9BD5] flex items-center justify-center mb-2.5"><ShieldCheck className="w-4 h-4" /></div>
                  <p className="text-[11px] text-slate-400 font-bold mb-0.5">{t('totalPermissions')}</p>
                  <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{grantedTotal}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('outOfTotalPermissions')}</p>
                  <Sparkline seed={`${role.id}-total`} color="#0C447C" />
                </div>
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5"><ShieldQuestion className="w-4 h-4" /></div>
                  <p className="text-[11px] text-slate-400 font-bold mb-0.5">{t('customizedPermissions')}</p>
                  <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{customizedTotal}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('customizedHint')}</p>
                  <Sparkline seed={`${role.id}-custom`} color="#0EA5A0" />
                </div>
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-2.5"><Settings className="w-4 h-4" /></div>
                  <p className="text-[11px] text-slate-400 font-bold mb-0.5">{t('defaultSource')}</p>
                  <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{defaultSourceTotal}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('outOfTotalPermissions')}</p>
                  <Sparkline seed={`${role.id}-default`} color="#7C6EF6" />
                </div>
              </div>

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
                  <svg width="96" height="80" viewBox="0 0 110 90">
                    <rect x="6" y="34" width="20" height="20" rx="4" fill="#0C447C" opacity=".85" transform="rotate(15 16 44)" />
                    <rect x="82" y="20" width="18" height="18" rx="4" fill="#5B9BD5" opacity=".9" transform="rotate(-10 91 29)" />
                    <rect x="80" y="55" width="16" height="16" rx="4" fill="#0C447C" opacity=".7" transform="rotate(20 88 63)" />
                    <circle cx="55" cy="44" r="34" fill="#FFFFFF" />
                    <path d="M55 16 L82 26 V46 C82 62 70 74 55 80 C40 74 28 62 28 46 V26 Z" fill="#0C447C" />
                    <path d="M42 46 L51 55 L70 34" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

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

              {(tab === 'overview' || tab === 'permissions') && (
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
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
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

                    {!detailLoading && groupedPermissions.length > 0 && (
                      <div className="hidden md:flex items-center gap-3.5 px-5 pt-3 pb-1">
                        <span className="w-3.5 flex-shrink-0" />
                        <span className="text-[10px] font-extrabold text-slate-400 min-w-[62px] flex-shrink-0">{t('colProgress')}</span>
                        <span className="text-[10px] font-extrabold text-slate-400 w-14 flex-shrink-0">{t('colCustomized')}</span>
                        <span className="text-[10px] font-extrabold text-slate-400 w-20 flex-shrink-0">{t('colPermissions')}</span>
                        <span className="flex-1 text-[10px] font-extrabold text-slate-400">{t('colPercentage')}</span>
                        <span className="w-52 flex-shrink-0" />
                      </div>
                    )}

                    {detailLoading ? (
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
            </>
          )}
        </div>
      </div>

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
