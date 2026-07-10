'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
} from '../hooks/useAccessControl'
import { PermissionConfigurator } from './PermissionConfigurator'
import { RolesTableSkeleton } from './RolesTableSkeleton'
import { RoleStatusBadge } from './RoleStatusBadge'
import type { RoleSummary } from '../api/access-control.api'

const createRoleSchema = z.object({
  name: z.string().trim().min(2, 'Role name must be at least 2 characters').max(60),
  description: z.string().trim().max(255).optional(),
})
type CreateRoleForm = z.infer<typeof createRoleSchema>

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
  const createRole = useCreateRole()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleForm>({ resolver: zodResolver(createRoleSchema) })

  function onSubmit(values: CreateRoleForm) {
    createRole.mutate(values, {
      onSuccess: () => {
        toast.success(`Role "${values.name}" created`)
        reset()
        onOpenChange(false)
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Could not create role')
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-l border-slate-200 bg-white sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Create Custom Role</SheetTitle>
          <SheetDescription>Give it a name — you can configure its permissions right after.</SheetDescription>
        </SheetHeader>

        <form id="create-role-form" onSubmit={handleSubmit(onSubmit)}>
          <SheetBody className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Role name</label>
              <Input {...register('name')} placeholder="e.g. Shift Supervisor" className="h-10 rounded-md bg-white focus-visible:ring-indigo-500" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Description (optional)</label>
              <Input {...register('description')} placeholder="What this role is for" className="h-10 rounded-md bg-white focus-visible:ring-indigo-500" />
            </div>
          </SheetBody>
        </form>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-role-form"
            disabled={createRole.isPending}
            className="bg-indigo-600 font-medium text-white hover:bg-indigo-700"
          >
            {createRole.isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              'Create Role'
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
  const { data: groups, isLoading: groupsLoading } = usePermissionGroups()
  const { data: permissions, isLoading: permissionsLoading } = useRolePermissions(role.id)
  const updatePermission = useUpdateRolePermission(role.id)
  const resetPermission = useResetRolePermission(role.id)

  const loading = groupsLoading || permissionsLoading

  function handleToggle(permissionKey: string, isGranted: boolean) {
    updatePermission.mutate(
      { permissionKey, isGranted },
      { onError: () => toast.error('Could not save that change') },
    )
  }
  function handleReset(permissionKey: string) {
    resetPermission.mutate(permissionKey, { onError: () => toast.error('Could not reset that permission') })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-l border-slate-200 bg-white sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{role.name}</SheetTitle>
            <RoleStatusBadge isSystem={role.is_system} />
          </div>
          <SheetDescription>
            {readOnly
              ? 'System role — permissions are shown for reference and cannot be changed.'
              : 'Toggle a domain switch to grant or revoke its whole permission set, or fine-tune individual permissions below.'}
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
            {readOnly ? 'Close' : 'Done'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
