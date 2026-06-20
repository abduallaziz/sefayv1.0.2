import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { featureFlagsApi } from '../api/feature-flags.api'
import type { UpsertOverrideDto } from '../types/feature-flags.types'

export function useFeatures() {
  return useQuery({
    queryKey: ['features'],
    queryFn: featureFlagsApi.getFeatures,
  })
}

export function useTenantFeatures(tenantId: string) {
  return useQuery({
    queryKey: ['tenant-features', tenantId],
    queryFn: () => featureFlagsApi.getTenantFeatures(tenantId),
    enabled: !!tenantId,
  })
}

export function useUpsertOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpsertOverrideDto) => featureFlagsApi.upsertOverride(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tenant-features', variables.tenant_id],
      })
    },
  })
}