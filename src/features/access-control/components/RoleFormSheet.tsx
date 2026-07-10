'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  Button,
  Input,
} from '@/shared/ui'
import {
  usePermissionGroups,
  useRolePermissions,
  useUpdateRolePermission,
  useResetRolePermission,
  useCreateRole,
  useRoleDisplayName,
} from '../hooks/useAccessControl'
import { PermissionConfigurator } from './PermissionConfigurator'
import { RolesTableSkeleton } from './RolesTableSkeleton'
import { RoleStatusBadge } from './RoleStatusBadge'
import type { RoleSummary } from '../api/access-control.api'

type CreateRoleForm = { name: string; description?: string }

type SheetMode = 'create' | 'edit' | 'view'

interface RoleFormSheetProps {
  mode: SheetMode
  role?: RoleSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleFormSheet({ mode, role, open, onOpenChange }: RoleFormSheetProps) {
  if (mode === 'create') {
    return <CreateRoleSheet open={open} onOpenChange={onOpenChange} />
  }
  if (role) {
    return (
      <ConfigureRoleSheet
        role={role}
        readOnly={mode === 'view'}
        open={open}
        onOpenChange={onOpenChange}
      />
    )
  }
  return null
}

function CreateRoleSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations('accessControl')
  const createRole = useCreateRole()

  // Schema built inside the component so the validation message can go
  // through i18n — zod's .min(n, message) needs the translated string at
  // call time, not at module-load time before any locale is known.
  const createRoleSchema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t('sheet.roleNameMinLength')).max(60),
        description: z.string().trim().max(255).optional(),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleForm>({ resolver: zodResolver(createRoleSchema) })

  function onSubmit(values: CreateRoleForm) {
    createRole.mutate(values, {
      onSuccess: () => {
        toast.success(t('toast.roleCreated', { name: values.name }))
        reset()
        onOpenChange(false)
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : t('toast.roleCreateError'))
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end" className="w-full border-s border-slate-200 bg-white sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t('sheet.createTitle')}</SheetTitle>
          <SheetDescription>{t('sheet.createDescription')}</SheetDescription>
        </SheetHeader>

        <form id="create-role-form" onSubmit={handleSubmit(onSubmit)}>
          <SheetBody className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('sheet.roleNameLabel')}</label>
              <Input
                {...register('name')}
                placeholder={t('sheet.roleNamePlaceholder')}
                className="h-10 rounded-md bg-white focus-visible:ring-indigo-500"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('sheet.descriptionLabel')}</label>
              <Input
                {...register('description')}
                placeholder={t('sheet.descriptionPlaceholder')}
                className="h-10 rounded-md bg-white focus-visible:ring-indigo-500"
              />
            </div>
          </SheetBody>
        </form>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form="create-role-form"
            disabled={createRole.isPending}
            className="bg-indigo-600 font-medium text-white hover:bg-indigo-700"
          >
            {createRole.isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" /> {t('saving')}
              </>
            ) : (
              t('sheet.createSubmit')
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function ConfigureRoleSheet({
  role,
  readOnly,
  open,
  onOpenChange,
}: {
  role: RoleSummary
  readOnly: boolean
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const t = useTranslations('accessControl')
  const displayName = useRoleDisplayName(role)
  const { data: groups, isLoading: groupsLoading } = usePermissionGroups()
  const { data: permissions, isLoading: permissionsLoading } = useRolePermissions(role.id)
  const updatePermission = useUpdateRolePermission(role.id)
  const resetPermission = useResetRolePermission(role.id)

  const loading = groupsLoading || permissionsLoading

  function handleToggle(permissionKey: string, isGranted: boolean) {
    updatePermission.mutate(
      { permissionKey, isGranted },
      { onError: () => toast.error(t('toast.permissionSaveError')) },
    )
  }
  function handleReset(permissionKey: string) {
    resetPermission.mutate(permissionKey, { onError: () => toast.error(t('toast.permissionResetError')) })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end" className="w-full border-s border-slate-200 bg-white sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{displayName}</SheetTitle>
            <RoleStatusBadge isSystem={role.is_system} />
          </div>
          <SheetDescription>
            {readOnly ? t('sheet.configureDescriptionView') : t('sheet.configureDescriptionEdit')}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className={readOnly ? 'pointer-events-none opacity-90' : undefined}>
          {loading || !groups || !permissions ? (
            <RolesTableSkeleton rows={4} />
          ) : (
            <PermissionConfigurator
              groups={groups}
              permissions={permissions}
              readOnly={readOnly}
              onToggle={handleToggle}
              onReset={handleReset}
            />
          )}
        </SheetBody>

        <SheetFooter>
          <Button type="button" onClick={() => onOpenChange(false)} className="bg-indigo-600 font-medium text-white hover:bg-indigo-700">
            {readOnly ? t('sheet.close') : t('sheet.done')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
