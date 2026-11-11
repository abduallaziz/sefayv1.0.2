import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/core/auth/stores/auth.store';

/** Server-resolved activity profile (GET /activity-profile). */
export interface ActivityProfile {
  source: 'branch' | 'tenant' | 'legacy' | 'none';
  tables_available: boolean;
  primary: string | null;
  activities: Array<{ code: string; section: string; name_en: string; is_primary: boolean }>;
  workflow: 'instant' | 'table_kitchen' | 'queue' | 'work_order' | 'appointment';
  stock_mode: 'none' | 'qty' | 'batch_expiry' | 'serial' | 'recipe';
  capabilities: string[];
  payment_modes: string[];
  pricing_dimensions: unknown[];
  customer_fields: unknown[];
}

/**
 * The profile only decides what the UI shows or enables — it is never a
 * permission check (authorisation stays on the server). A failed or slow
 * request must never block the app: callers fall back to the legacy,
 * activity-keyed behaviour when `data` is undefined.
 */
export function useActivityProfile() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['activity-profile', userId],
    queryFn: () => apiClient.get<ActivityProfile>('/activity-profile'),
    enabled: !!userId,
    staleTime: 10 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
