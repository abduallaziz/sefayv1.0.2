import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi, UpdateProfileDto } from '../api/settings.api'

export function useProfile() {
  return useQuery({
    queryKey: ['tenant', 'profile'],
    queryFn: settingsApi.getProfile,
  })
}

export function useSubscription() {
  return useQuery({
    queryKey: ['tenant', 'subscription'],
    queryFn: settingsApi.getSubscription,
  })
}

export function useUsage() {
  return useQuery({
    queryKey: ['tenant', 'usage'],
    queryFn: settingsApi.getUsage,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateProfileDto) => settingsApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'profile'] })
    },
  })
}