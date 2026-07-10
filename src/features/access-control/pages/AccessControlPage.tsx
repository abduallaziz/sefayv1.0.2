'use client'

import { useEffect, useState } from 'react'
import { Plus, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button, EmptyState } from '@/shared/ui'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { useAccessControlRoles, useDeleteRole } from '../hooks/useAccessControl'
import { RolesDataTable } from '../components/RolesDataTable'
import { RolesTableSkeleton } from '../components/RolesTableSkeleton'
import { RoleFormSheet } from '../components/RoleFormSheet'
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

  useEffect(() => {
    if (!initialRoleId || !roles) return
    const role = roles.find((r) => r.id === initialRoleId)
    if (role) setSheet({ mode: role.is_system ? 'view' : 'edit', role })
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
    <div dir="auto" className="min-h-screen bg-slate-50">
      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-slate-50/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-cairo text-2xl font-semibold tracking-tight text-slate-900 rtl:font-cairo ltr:font-inter">
              {t('title')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
          </div>
          <Button
            onClick={() => setSheet({ mode: 'create' })}
            className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="me-2 h-4 w-4" /> {t('createRoleCta')}
          </Button>
        </div>
      </div>

      {/* ── Workspace ─────────────────────────────────────────────────── */}
      <div className="p-6">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          {isError ? (
            <div className="p-10 text-center text-sm text-red-600">{t('loadRolesError')}</div>
          ) : isLoading ? (
            <RolesTableSkeleton />
          ) : !roles || roles.length === 0 ? (
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
          ) : (
            <RolesDataTable
              roles={roles}
              onView={(role) => setSheet({ mode: 'view', role })}
              onEdit={(role) => setSheet({ mode: 'edit', role })}
              onDelete={(role) => setRoleToDelete(role)}
            />
          )}
        </div>
      </div>

      {sheet && (
        <RoleFormSheet
          mode={sheet.mode}
          role={sheet.mode !== 'create' ? sheet.role : undefined}
          open={!!sheet}
          onOpenChange={(open) => !open && setSheet(null)}
        />
      )}

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
