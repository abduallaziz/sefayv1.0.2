import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authControlApi } from './api';
import type { TenantUser } from './types';

export const useAuthControl = () => {
  const qc = useQueryClient();

  const tenantsQuery = useQuery({
    queryKey: ['superadmin', 'tenant-options'],
    queryFn: authControlApi.getTenants,
  });

  const useTenantUsers = (tenantId: string) =>
    useQuery({
      queryKey: ['superadmin', 'tenant-users', tenantId],
      queryFn: () => authControlApi.getTenantUsers(tenantId),
      enabled: !!tenantId,
    });

  const useSessionsQuery = (tenantId?: string, userId?: string) =>
    useQuery({
      queryKey: ['superadmin', 'sessions', tenantId, userId],
      queryFn: () => authControlApi.getSessions({ tenantId, userId }),
    });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      authControlApi.resetPassword(userId, newPassword),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: TenantUser['role'] }) =>
      authControlApi.changeRole(userId, role),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'tenant-users'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, is_active }: { userId: string; is_active: boolean }) =>
      authControlApi.toggleUserActive(userId, is_active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'tenant-users'] });
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => authControlApi.revokeSession(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'sessions'] });
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: (userId: string) => authControlApi.revokeAllUserSessions(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'sessions'] });
    },
  });

  return {
    tenantsQuery,
    useTenantUsers,
    useSessionsQuery,
    resetPasswordMutation,
    changeRoleMutation,
    toggleActiveMutation,
    revokeSessionMutation,
    revokeAllMutation,
  };
}; 
