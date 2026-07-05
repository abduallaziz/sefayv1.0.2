import { useAuthStore } from '@/core/auth/stores/auth.store';
import {
  ACTIVITY_CONFIG,
  ALL_ACTIVITIES_SIDEBAR,
  DEFAULT_ACTIVITY,
  BUSINESS_TYPE_TO_ACTIVITY,
  type ActivityKey,
  type BusinessTypeKey,
  type BusinessTypeConfig,
} from '@/shared/config/business-type.config';

export function useBusinessType(): {
  activity: ActivityKey | 'all';
  config: BusinessTypeConfig;
} {
  const user = useAuthStore((s) => s.user);

  if (user?.activity === 'all') {
    return { activity: 'all', config: ALL_ACTIVITIES_SIDEBAR };
  }

  // Tenants registered before the `activity` column existed only have business_type —
  // derive a representative activity from it so they still get a working sidebar.
  const activity =
    (user?.activity as ActivityKey) ??
    BUSINESS_TYPE_TO_ACTIVITY[(user?.business_type as BusinessTypeKey) ?? 'other'] ??
    DEFAULT_ACTIVITY;

  const config = ACTIVITY_CONFIG[activity] ?? ACTIVITY_CONFIG[DEFAULT_ACTIVITY];

  return { activity, config };
}