import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionsApi } from '../api/subscriptions.api'
import type { CreatePlanDto, ManualPaymentDto } from '../types/subscription.types'

export const SUBSCRIPTIONS_KEY = ['superadmin', 'subscriptions']
export const PLANS_KEY = ['superadmin', 'plans']

export function useSubscriptions(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: [...SUBSCRIPTIONS_KEY, filters],
    queryFn: () => subscriptionsApi.getSubscriptions(filters),
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

export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subscriptionsApi.cancelSubscription(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY }),
  })
}

export function useManualPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ManualPaymentDto) => subscriptionsApi.manualPayment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY }),
  })
}
