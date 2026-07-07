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
  return useMutation({
    mutationFn: (id: string) => usersApi.unbindAttendanceDevice(id),
  })
}