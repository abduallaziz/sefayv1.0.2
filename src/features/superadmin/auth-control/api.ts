import { apiClient } from '@/lib/api';
import type { TenantUser, DeviceSession, TenantOption } from './types';

export const authControlApi = {
  getTenants: (): Promise<TenantOption[]> =>
    apiClient.get('/superadmin/tenants/options'),

  getTenantUsers: (tenantId: string): Promise<TenantUser[]> =>
    apiClient.get(`/superadmin/tenants/${tenantId}/users`),

  resetPassword: (userId: string, newPassword: string): Promise<void> =>
    apiClient.patch(`/superadmin/users/${userId}/reset-password`, { newPassword }),

  changeRole: (userId: string, role: TenantUser['role']): Promise<void> =>
    apiClient.patch(`/superadmin/users/${userId}/role`, { role }),

  toggleUserActive: (userId: string, is_active: boolean): Promise<void> =>
    apiClient.patch(`/superadmin/users/${userId}/active`, { is_active }),

  getSessions: (params?: { tenantId?: string; userId?: string }): Promise<DeviceSession[]> => {
    const query = new URLSearchParams();
    if (params?.tenantId) query.append('tenantId', params.tenantId);
    if (params?.userId) query.append('userId', params.userId);
    return apiClient.get(`/superadmin/sessions?${query.toString()}`);
  },

  revokeSession: (sessionId: string): Promise<void> =>
    apiClient.patch(`/superadmin/sessions/${sessionId}/revoke`, {}),

  revokeAllUserSessions: (userId: string): Promise<void> =>
    apiClient.patch(`/superadmin/users/${userId}/revoke-sessions`, {}),
};