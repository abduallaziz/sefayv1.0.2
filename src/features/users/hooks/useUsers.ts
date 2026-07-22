import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, CreateUserDto, CreateEmployeeDto, UpdateUserDto, UpdateEmployeeDto } from '../api/users.api'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  })
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: usersApi.getEmployees,
  })
}

export function useLinkableUsers() {
  return useQuery({
    queryKey: ['employees', 'linkable-users'],
    queryFn: usersApi.getLinkableUsers,
  })
}

export function useLinkAsEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.linkAsEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDto }) =>
      usersApi.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useCheckDuplicate() {
  return useMutation({
    mutationFn: (fields: { email?: string; phone?: string; employee_number?: string; exclude_id?: string }) =>
      usersApi.checkDuplicate(fields),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserDto) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEmployeeDto) => usersApi.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useChangeRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersApi.changeRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      // Changing the primary role moves this user out of their old role's
      // membership list and into the new one — both the per-role user list
      // (RoleUsersSheet) and the roles list's user_count need to reflect it.
      queryClient.invalidateQueries({ queryKey: ['access-control', 'roles'] })
    },
  })
}

// Parameterized by roleId, mirroring useUpdateRolePermission(roleId) in
// access-control's own hooks — RoleUsersSheet only ever operates within one
// role's context, so the role-scoped invalidation lives with the mutation
// rather than being repeated at every call site.
export function useAddUserRole(roleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => usersApi.addUserRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-control', 'roles', roleId, 'users'] })
      queryClient.invalidateQueries({ queryKey: ['access-control', 'roles'] }) // user_count changed
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useRemoveUserRole(roleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => usersApi.removeUserRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-control', 'roles', roleId, 'users'] })
      queryClient.invalidateQueries({ queryKey: ['access-control', 'roles'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Phase C(UI) of the Hybrid RBAC+ABAC model — powers RoleUsersSheet's
// per-user permission checklist.
export function useUserPermissionOverrides(userId: string, enabled = true) {
  return useQuery({
    queryKey: ['users', userId, 'permission-overrides'],
    queryFn: () => usersApi.getPermissionOverrides(userId),
    enabled: !!userId && enabled,
    refetchOnMount: 'always', // same reasoning as useRoleUsers — must reflect the exact current state on every open
  })
}

export function useSetPermissionOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, permissionKey, action }: { userId: string; permissionKey: string; action: 'GRANT' | 'DENY' }) =>
      usersApi.setPermissionOverride(userId, permissionKey, action),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users', userId, 'permission-overrides'] })
    },
  })
}

export function useRemovePermissionOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, permissionKey }: { userId: string; permissionKey: string }) =>
      usersApi.removePermissionOverride(userId, permissionKey),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users', userId, 'permission-overrides'] })
    },
  })
}

export function useResetPermissionOverrides() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => usersApi.resetPermissionOverrides(userId),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users', userId, 'permission-overrides'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useGenerateAttendanceLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.generateAttendanceLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUnbindAttendanceDevice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.unbindAttendanceDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useEmployeeHistory(id: string) {
  return useQuery({
    queryKey: ['employees', id, 'history'],
    queryFn: () => usersApi.getEmployeeHistory(id),
    enabled: !!id,
  })
}