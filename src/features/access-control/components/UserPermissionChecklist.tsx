'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Search, RotateCcw, Check, X, Lock } from 'lucide-react'
import { Button, Input } from '@/shared/ui'
import { StatusBadge } from '@/shared/ui/status-badge'
import { usePermissions, useRolePermissions } from '../hooks/useAccessControl'
import {
  useUserPermissionOverrides,
  useSetPermissionOverride,
  useRemovePermissionOverride,
  useResetPermissionOverrides,
} from '@/features/users/hooks/useUsers'
import { RolesTableSkeleton } from './RolesTableSkeleton'

interface UserPermissionChecklistProps {
  userId: string
  roleId: string
  /** The role's own force-true rule (see PermissionsService.hasPermissionForUser)
   *  makes any override on an owner meaningless — lock editing rather than let
   *  an admin toggle something that can never actually change the outcome. */
  locked: boolean
}

export function UserPermissionChecklist({ userId, roleId, locked }: UserPermissionChecklistProps) {
  const t = useTranslations('accessControl')
  const permissionLabels = t.raw('permissions') as Record<string, string>

  const { data: catalog, isLoading: catalogLoading } = usePermissions()
  const { data: rolePermissions, isLoading: roleLoading } = useRolePermissions(roleId)
  const { data: overrides, isLoading: overridesLoading } = useUserPermissionOverrides(userId)

  const setOverride = useSetPermissionOverride()
  const removeOverride = useRemovePermissionOverride()
  const resetAll = useResetPermissionOverrides()
  const anyPending = setOverride.isPending || removeOverride.isPending || resetAll.isPending

  const [search, setSearch] = useState('')

  const baseGrantedMap = useMemo(
    () => new Map((rolePermissions ?? []).map((p) => [p.permission_key, p.granted])),
    [rolePermissions],
  )
  const overrideMap = useMemo(
    () => new Map((overrides ?? []).map((o) => [o.permission_key, o.action])),
    [overrides],
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (catalog ?? [])
      .map((p) => {
        const label = permissionLabels[p.name.replace(/\./g, '__')] ?? p.description ?? p.name
        const baseGranted = baseGrantedMap.get(p.name) ?? false
        const overrideAction = overrideMap.get(p.name)
        const effectiveGranted = overrideAction === 'GRANT' ? true : overrideAction === 'DENY' ? false : baseGranted
        return { key: p.name, label, baseGranted, overrideAction, effectiveGranted }
      })
      .filter((row) => !q || row.label.toLowerCase().includes(q) || row.key.toLowerCase().includes(q))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [catalog, search, baseGrantedMap, overrideMap, permissionLabels])

  const hasAnyOverride = (overrides ?? []).length > 0
  const loading = catalogLoading || roleLoading || overridesLoading

  // The row's own button visibility already guarantees handleGrant only
  // fires when GRANT isn't already active (that button hides itself once
  // active — see the row render below), and same for handleDeny/DENY.
  // Canceling an active override is a separate path (handleReset), wired
  // directly to the remaining button's onClick, not routed through these.
  function handleGrant(permissionKey: string) {
    setOverride.mutate(
      { userId, permissionKey, action: 'GRANT' },
      { onError: (err) => toast.error(err instanceof Error ? err.message : t('userPermissionChecklist.setError')) },
    )
  }
  function handleDeny(permissionKey: string) {
    setOverride.mutate(
      { userId, permissionKey, action: 'DENY' },
      { onError: (err) => toast.error(err instanceof Error ? err.message : t('userPermissionChecklist.setError')) },
    )
  }
  function handleReset(permissionKey: string) {
    removeOverride.mutate(
      { userId, permissionKey },
      { onError: (err) => toast.error(err instanceof Error ? err.message : t('userPermissionChecklist.resetOneError')) },
    )
  }
  function handleResetAll() {
    resetAll.mutate(userId, {
      onError: (err) => toast.error(err instanceof Error ? err.message : t('userPermissionChecklist.resetAllError')),
    })
  }

  if (locked) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
        <Lock className="h-4 w-4 shrink-0" />
        {t('userPermissionChecklist.ownerLocked')}
      </div>
    )
  }

  if (loading) {
    return <RolesTableSkeleton rows={4} />
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('userPermissionChecklist.searchPlaceholder')}
            className="h-8 rounded-md bg-white dark:bg-[#141720] ps-8 text-xs"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasAnyOverride || anyPending}
          onClick={handleResetAll}
          className="h-8 shrink-0 text-xs"
        >
          <RotateCcw className="me-1.5 h-3 w-3" /> {t('userPermissionChecklist.resetToDefaults')}
        </Button>
      </div>

      <div className="max-h-72 space-y-1 overflow-y-auto">
        {rows.map((row) => (
          <div
            key={row.key}
            className={
              row.overrideAction
                ? 'flex items-center justify-between gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1.5 dark:border-indigo-500/20 dark:bg-indigo-500/10'
                : 'flex items-center justify-between gap-2 rounded-md px-2 py-1.5'
            }
          >
            <div className="flex min-w-0 items-center gap-2">
              {/* Green only for an explicit GRANT override the admin just
                  clicked — not for a permission that's simply checked
                  because the base role already grants it with no override
                  at all. Reported live: every inherited-granted row (no
                  override, row.overrideAction undefined) was rendering
                  green too, looking like an activation nobody actually
                  performed. */}
              <input
                type="checkbox"
                checked={row.effectiveGranted}
                disabled
                className={row.overrideAction === 'GRANT' ? 'h-3.5 w-3.5 shrink-0 accent-emerald-600' : 'h-3.5 w-3.5 shrink-0'}
                aria-label={row.label}
              />
              <span className="truncate text-xs text-slate-700 dark:text-slate-200">{row.label}</span>
              {row.overrideAction && <StatusBadge label={t('customized')} tone="brand" />}
            </div>

            {/* Exact interaction agreed on: with no override, both actions
                show neutral. Clicking one applies it and HIDES the other
                entirely — the remaining button is the one NOT chosen,
                recolored red, now meaning "cancel this" (calls handleReset,
                not the opposite action) rather than "this is denied." That
                red is a transient undo affordance on a single button, not a
                persistent status color, which is what earlier feedback
                objected to. */}
            <div className="flex shrink-0 items-center gap-1">
              {row.overrideAction !== 'GRANT' && (
                <Button
                  type="button"
                  size="sm"
                  variant={row.overrideAction === 'DENY' ? undefined : 'outline'}
                  disabled={anyPending}
                  onClick={() => (row.overrideAction === 'DENY' ? handleReset(row.key) : handleGrant(row.key))}
                  className={row.overrideAction === 'DENY' ? 'h-7 bg-red-600 px-2 text-xs text-white hover:bg-red-700' : 'h-7 px-2 text-xs'}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              {row.overrideAction !== 'DENY' && (
                <Button
                  type="button"
                  size="sm"
                  variant={row.overrideAction === 'GRANT' ? undefined : 'outline'}
                  disabled={anyPending}
                  onClick={() => (row.overrideAction === 'GRANT' ? handleReset(row.key) : handleDeny(row.key))}
                  className={row.overrideAction === 'GRANT' ? 'h-7 bg-red-600 px-2 text-xs text-white hover:bg-red-700' : 'h-7 px-2 text-xs'}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
