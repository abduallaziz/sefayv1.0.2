'use client'

import { useEffect, useState } from 'react'
import { Plus, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button, EmptyState, Skeleton } from '@/shared/ui'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { useAccessControlRoles, useDeleteRole } from '../hooks/useAccessControl'
import { RoleCard } from '../components/RoleCard'
import { RoleFormSheet } from '../components/RoleFormSheet'
import { RoleUsersSheet } from '../components/RoleUsersSheet'
import type { RoleSummary } from '../api/access-control.api'

type SheetState = { mode: 'create' } | { mode: 'edit' | 'view'; role: RoleSummary } | null

// `initialRoleId` preserves the deep-link behavior the old route-based
// master-detail layout had (e.g. bookmarked /access-control/{roleId} links)
// — it now opens straight into that role's slide-over instead of navigating,
// per the "do NOT navigate routes" requirement.
export function AccessControlPage({ initialRoleId }: { initialRoleId?: string } = {}) {
  const t = useTranslations('accessControl')
  const { data: roles, isLoading, isError } = useAccessControlRoles()
  const deleteRole = useDeleteRole()

  const [sheet, setSheet] = useState<SheetState>(null)
  const [roleToDelete, setRoleToDelete] = useState<RoleSummary | null>(null)
  const [manageUsersRole, setManageUsersRole] = useState<RoleSummary | null>(null)

  useEffect(() => {
    if (!initialRoleId || !roles) return
    const role = roles.find((r) => r.id === initialRoleId)
    // Only 'owner' opens read-only now — every other system role is editable
    // (matches RoleCard.tsx's isLocked; 'superadmin' never appears in `roles`
    // at all, filtered server-side).
    if (role) setSheet({ mode: role.name === 'owner' ? 'view' : 'edit', role })
    // Only react to roles finishing their first load for this deep link —
    // not on every roles refetch, which would re-open a sheet the user closed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoleId, !!roles])

  function handleDeleteConfirm() {
    if (!roleToDelete) return
    deleteRole.mutate(roleToDelete.id, {
      onSuccess: () => {
        toast.success(t('toast.roleDeleted', { name: roleToDelete.name }))
        setRoleToDelete(null)
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : t('toast.roleDeleteError'))
      },
    })
  }

  return (
    <div dir="auto" className="min-h-screen bg-slate-50 dark:bg-gray-950">
      {/* ── Sticky header ─────────────────────────────────────────────── */}
      {/* z-10, not z-40 — the mobile sidebar drawer (DashboardSidebar.tsx)
          and its backdrop use z-40/z-30, so matching z-40 here made this
          header fight the drawer for stacking order on mobile (reported
          live: header rendered on top of/overlapping the open sidebar). A
          sticky header only needs to sit above this page's own scrolling
          content, never above a global nav overlay. */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h1 className="font-cairo text-xl font-semibold tracking-tight text-slate-900 rtl:font-cairo ltr:font-inter dark:text-white sm:text-2xl">
              {t('title')}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('subtitle')}</p>
          </div>
          <Button
            onClick={() => setSheet({ mode: 'create' })}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto"
          >
            <Plus className="me-2 h-4 w-4" /> {t('createRoleCta')}
          </Button>
        </div>
      </div>

      {/* ── Workspace ─────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-6">
        {isError ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-red-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-red-400">
            {t('loadRolesError')}
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-24" />
                <div className="mt-1 flex gap-2 border-t border-slate-100 pt-3 dark:border-gray-800">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : !roles || roles.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <EmptyState
              icon={ShieldCheck}
              title={t('emptyRoles.title')}
              description={t('emptyRoles.description')}
              action={
                <Button
                  onClick={() => setSheet({ mode: 'create' })}
                  className="rounded-md bg-indigo-600 font-medium text-white hover:bg-indigo-700"
                >
                  <Plus className="me-2 h-4 w-4" /> {t('createRoleCta')}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onView={(r) => setSheet({ mode: 'view', role: r })}
                onEdit={(r) => setSheet({ mode: 'edit', role: r })}
                onDelete={(r) => setRoleToDelete(r)}
                onManageUsers={(r) => setManageUsersRole(r)}
              />
            ))}
          </div>
        )}
      </div>

      {sheet && (
        <RoleFormSheet
          mode={sheet.mode}
          role={sheet.mode !== 'create' ? sheet.role : undefined}
          open={!!sheet}
          onOpenChange={(open) => !open && setSheet(null)}
        />
      )}

      <RoleUsersSheet
        role={manageUsersRole}
        open={!!manageUsersRole}
        onOpenChange={(open) => !open && setManageUsersRole(null)}
      />

      <ConfirmDialog
        open={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        variant="danger"
        title={t('deleteConfirm.title')}
        message={roleToDelete ? t('deleteConfirm.message', { name: roleToDelete.name }) : ''}
        confirmLabel={t('actionsMenu.delete')}
        cancelLabel={t('cancel')}
        loadingLabel={t('deleteConfirm.loadingLabel')}
        isLoading={deleteRole.isPending}
      />
    </div>
  )
}
