'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, Search } from 'lucide-react'
import { PageHeader } from '@/shared/ui/page-header'
import { StatusBadge } from '@/shared/ui/status-badge'
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

// Client-side only — same list as RoleCard, purely for read-only framing.
// Real enforcement is the backend's protected-role check.
const PROTECTED_ROLE_NAMES = new Set(['owner', 'superadmin'])

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

  const [advanced, setAdvanced] = useState(false)
  const [search, setSearch] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

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
  }, [groups, filteredPermissions])

  function handleToggle(permissionKey: string, isGranted: boolean) {
    setActionError(null)
    updatePermission.mutate(
      { permissionKey, isGranted },
      { onError: () => setActionError(t('saveError')) },
    )
  }

  function handleReset(permissionKey: string) {
    setActionError(null)
    resetPermission.mutate(permissionKey, {
      onError: () => setActionError(t('saveError')),
    })
  }

  function handleResetRole() {
    setActionError(null)
    resetRole.mutate(undefined, {
      onSuccess: () => setConfirmResetOpen(false),
      onError: () => {
        setActionError(t('saveError'))
        setConfirmResetOpen(false)
      },
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

      {isProtected && (
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-3">
          <StatusBadge label={`🔒 ${t('protectedRole')}`} tone="neutral" />
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('protectedRoleHint')}</p>
        </div>
      )}

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

      <div className="flex flex-wrap items-center justify-between gap-3">
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
              className="px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t('resetRoleToDefault')}
            </button>
          )}
        </div>
      </div>

      {!isSuperadmin && <PlatformPermissionsNotice />}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {groupedPermissions.map(({ group, items }) => (
            <PermissionGroupSection
              key={group.id}
              title={locale === 'ar' ? group.name_ar : group.name_en}
              permissions={items}
              labelFor={(p) => p.description ?? p.permission_key}
              advanced={advanced}
              readOnly={readOnly}
              defaultOpen={groupedPermissions.length <= 3}
              onToggle={handleToggle}
              onReset={handleReset}
            />
          ))}
        </div>
      )}

      <PermissionHistoryPanel />

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
