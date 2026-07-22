import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi, UpdateProfileDto } from '../api/settings.api'
import { useAuthStore } from '@/core/auth/stores/auth.store'

// AuthProvider's token refresh/hydration on mount is async — without gating on it, these
// queries fired immediately with no access token yet, sending an unauthenticated request
// that fell through to the throttler's IP-fallback bucket on every page load. Waiting for
// isLoading to clear means we only ever call these once we know whether we're authenticated.
export function useProfile() {
  const authReady = useAuthStore((s) => !s.isLoading)
  return useQuery({
    queryKey: ['tenant', 'profile'],
    queryFn: settingsApi.getProfile,
    enabled: authReady,
  })
}

export function useSubscription() {
  const authReady = useAuthStore((s) => !s.isLoading)
  return useQuery({
    queryKey: ['tenant', 'subscription'],
    queryFn: settingsApi.getSubscription,
    enabled: authReady,
  })
}

export function useUsage() {
  const authReady = useAuthStore((s) => !s.isLoading)
  return useQuery({
    queryKey: ['tenant', 'usage'],
    queryFn: settingsApi.getUsage,
    enabled: authReady,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateProfileDto) => settingsApi.updateProfile(data),
    // Write the server's response straight into the cache instead of just
    // invalidating: invalidate+refetch is async, so a second save fired right
    // after the first (e.g. toggling two notification switches back to back)
    // could read stale profile data before the refetch landed and clobber the
    // first change when merging fields like notification_preferences.
    onSuccess: (updated) => {
      queryClient.setQueryData(['tenant', 'profile'], updated)
    },
  })
}