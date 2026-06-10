import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionsApi } from '../api/subscriptions.api'
import type { CreatePlanDto, Subscription } from '../types/subscription.types'

export const PLANS_KEY = ['superadmin', 'plans']
export const SUBSCRIPTIONS_KEY = ['superadmin', 'subscriptions']

// No backend endpoint for superadmin subscriptions list yet — returns empty array
export function useSubscriptions(_filters?: { status?: string; search?: string }) {
  return useQuery<Subscription[]>({
    queryKey: [...SUBSCRIPTIONS_KEY, _filters],
    queryFn: async (): Promise<Subscription[]> => [],
    staleTime: Infinity,
  })
}

export function usePlans() {
  return useQuery({
    queryKey: PLANS_KEY,
    queryFn: () => subscriptionsApi.getPlans(),
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePlanDto) => subscriptionsApi.createPlan(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLANS_KEY }),
  })
}

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePlanDto> }) =>
      subscriptionsApi.updatePlan(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLANS_KEY }),
  })
}

export function useTogglePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      subscriptionsApi.togglePlan(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLANS_KEY }),
  })
}

// No superadmin cancel endpoint — stub
export function useCancelSubscription() {
  return useMutation({
    mutationFn: (_id: string): Promise<void> =>
      Promise.reject(new Error('Cancel subscription: no superadmin endpoint available')),
  })
}

// No manual payment endpoint — stub
export function useManualPayment() {
  return useMutation({
    mutationFn: (_data: unknown): Promise<void> =>
      Promise.reject(new Error('Manual payment: no endpoint available')),
  })
}