'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superadminApi } from '../api/superadmin.api'

export function useStats() {
  return useQuery({
    queryKey: ['superadmin', 'stats'],
    queryFn: superadminApi.getStats,
  })
}

export function useTenants() {
  return useQuery({
    queryKey: ['superadmin', 'tenants'],
    queryFn: superadminApi.getTenants,
  })
}

export function useRevenue() {
  return useQuery({
    queryKey: ['superadmin', 'revenue'],
    queryFn: superadminApi.getRevenue,
  })
}

export function useActivateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => superadminApi.activateTenant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin'] }),
  })
}

export function useDeactivateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => superadminApi.deactivateTenant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin'] }),
  })
}

export function useExtendTrial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      superadminApi.extendTrial(id, days),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin'] }),
  })
}