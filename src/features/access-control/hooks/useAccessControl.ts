import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { accessControlApi, ResolvedPermission, RoleSummary } from '../api/access-control.api'

// System role names are fixed backend enum values ('owner', 'cashier', …) —
// translated via roles.<name>.name in access-control.json. Custom role names
// are tenant-authored free text and must NEVER be passed through i18n lookup.
export function useRoleDisplayName(role: RoleSummary): string {
  const t = useTranslations('accessControl')
  if (!role.is_system) return role.name
  const key = `roles.${role.name}.name`
  return t.has(key) ? t(key) : role.name
}

// Same reasoning as useRoleDisplayName, for the description shown on the
// card: system-role descriptions come from the `roles` table seed
// (001_create_roles_table.sql), which is English-only (e.g. "Branch/
// operations manager") — that was rendering unlocalized directly from the
// API response. Custom-role descriptions are tenant-authored free text and
// must stay exactly as entered, in whichever language the tenant typed them.
export function useRoleDisplayDescription(role: RoleSummary): string | null {
  const t = useTranslations('accessControl')
  if (role.is_system) {
    const key = `roles.${role.name}.description`
    if (t.has(key)) return t(key)
  }
  return role.description
}

export function usePermissionGroups() {
  return useQuery({
    queryKey: ['access-control', 'permission-groups'],
    queryFn: accessControlApi.getPermissionGroups,
    staleTime: 5 * 60 * 1000, // groups change rarely — avoid refetching on every focus
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: ['access-control', 'permissions'],
    queryFn: accessControlApi.getPermissions,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAccessControlRoles() {
  return useQuery({
    queryKey: ['access-control', 'roles'],
    queryFn: accessControlApi.getRoles,
  })
}

export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: ['access-control', 'roles', roleId, 'permissions'],
    queryFn: () => accessControlApi.getRolePermissions(roleId),
    enabled: !!roleId,
  })
}

// Optimistic update — mirrors the pattern already used in
// features/dashboard/expenses/hooks/useExpenses.ts (onMutate snapshot,
// onError rollback, onSettled reconcile). The permission toggle must feel
// instant; waiting for a round-trip before the switch visibly flips would
// read as "broken" for something this frequent.
export function useUpdateRolePermission(roleId: string) {
  const qc = useQueryClient()
  const key = ['access-control', 'roles', roleId, 'permissions']

  return useMutation({
    mutationFn: ({ permissionKey, isGranted }: { permissionKey: string; isGranted: boolean }) =>
      accessControlApi.updatePermission(roleId, permissionKey, isGranted),
    onMutate: async ({ permissionKey, isGranted }) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<ResolvedPermission[]>(key)
      qc.setQueryData<ResolvedPermission[]>(key, (old) =>
        (old ?? []).map((p) =>
          p.permission_key === permissionKey
            ? { ...p, granted: isGranted, source: 'tenant_override' as const }
            : p,
        ),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: ['access-control', 'roles'] }) // customized_permission_count changed
    },
  })
}

export function useResetRolePermission(roleId: string) {
  const qc = useQueryClient()
  const key = ['access-control', 'roles', roleId, 'permissions']

  return useMutation({
    mutationFn: (permissionKey: string) => accessControlApi.resetPermission(roleId, permissionKey),
    onMutate: async (permissionKey) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<ResolvedPermission[]>(key)
      // Optimistically show it as 'global' immediately; the actual granted
      // value reconciles from the server on settle (we don't know the true
      // global default client-side, only that it's no longer overridden).
      qc.setQueryData<ResolvedPermission[]>(key, (old) =>
        (old ?? []).map((p) =>
          p.permission_key === permissionKey ? { ...p, source: 'global' as const } : p,
        ),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: ['access-control', 'roles'] })
    },
  })
}

export function useResetRole(roleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => accessControlApi.resetRole(roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-control', 'roles', roleId, 'permissions'] })
      qc.invalidateQueries({ queryKey: ['access-control', 'roles'] })
    },
  })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: accessControlApi.createRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-control', 'roles'] })
    },
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: accessControlApi.deleteRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-control', 'roles'] })
    },
  })
}
