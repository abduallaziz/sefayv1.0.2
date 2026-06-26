'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superadminApi } from '../api/superadmin.api';
import { tenantsApi } from '../tenants/api';

export function useStats() {
  return useQuery({
    queryKey: ['superadmin', 'stats'],
    queryFn: superadminApi.getStats,
  });
}

export function useRevenue(range?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['superadmin', 'analytics', 'mrr-history', range?.from, range?.to],
    queryFn: () => superadminApi.getMRRHistory(undefined, range?.from, range?.to),
    enabled: !!range?.from && !!range?.to,
  });
}

export function useActivateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin'] }),
  });
}

export function useDeactivateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin'] }),
  });
}

export function useExtendTrial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      tenantsApi.extendTrial(id, days),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin'] }),
  });
}