import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantsApi, type TenantsFilters } from './api';

const TENANTS_KEY = 'superadmin-tenants';

export const useTenants = (filters: TenantsFilters) => {
  return useQuery({
    queryKey: [TENANTS_KEY, filters],
    queryFn: () => tenantsApi.getAll(filters),
  });
};

export const useTenant = (id: string) => {
  return useQuery({
    queryKey: [TENANTS_KEY, id],
    queryFn: () => tenantsApi.getById(id),
    enabled: !!id,
  });
};

export const useActivateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tenantsApi.activate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TENANTS_KEY] }),
  });
};

export const useDeactivateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tenantsApi.deactivate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TENANTS_KEY] }),
  });
};

export const useSoftDeleteTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tenantsApi.softDelete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TENANTS_KEY] }),
  });
};

export const useExtendTrial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      tenantsApi.extendTrial(id, days),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TENANTS_KEY] }),
  });
};