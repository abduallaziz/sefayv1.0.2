'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { subscriptionGateApi } from './api'

export const ENTITLEMENTS_KEY = ['subscription', 'entitlements'] as const
/** Fired by the API client when any request answers 402 SUBSCRIPTION_LOCKED. */
export const SUBSCRIPTION_LOCKED_EVENT = 'sefay:subscription-locked'

export function useEntitlements() {
  const user = useAuthStore((s) => s.user)
  const ready = useAuthStore((s) => !s.isLoading && s.isAuthenticated)
  const qc = useQueryClient()
  const enabled = ready && !!user && user.role !== 'superadmin'

  useEffect(() => {
    const refetch = () => qc.invalidateQueries({ queryKey: ENTITLEMENTS_KEY })
    window.addEventListener(SUBSCRIPTION_LOCKED_EVENT, refetch)
    return () => window.removeEventListener(SUBSCRIPTION_LOCKED_EVENT, refetch)
  }, [qc])

  return useQuery({
    queryKey: ENTITLEMENTS_KEY,
    queryFn: subscriptionGateApi.getEntitlements,
    enabled,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
  })
}
