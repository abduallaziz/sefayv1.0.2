import { apiClient } from '@/lib/api'

export interface User {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  branch_id?: string
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
  role: string
  branch_id?: string
}

export interface UpdateUserDto {
  name?: string
  is_active?: boolean
  branch_id?: string
}

export const usersApi = {
  getAll: (): Promise<User[]> =>
    apiClient.get('/users'),

  getOne: (id: string): Promise<User> =>
    apiClient.get(`/users/${id}`),

  create: (data: CreateUserDto): Promise<User> =>
    apiClient.post('/users', data),

  update: (id: string, data: UpdateUserDto): Promise<User> =>
    apiClient.patch(`/users/${id}`, data),

  changeRole: (id: string, role: string): Promise<User> =>
    apiClient.patch(`/users/${id}/role`, { role }),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/users/${id}`),
}