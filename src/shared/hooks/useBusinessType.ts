import { useAuthStore } from '@/core/auth/stores/auth.store';
import {
  ACTIVITY_CONFIG,
  DEFAULT_ACTIVITY,
  BUSINESS_TYPE_TO_ACTIVITY,
  type ActivityKey,
  type BusinessTypeKey,
  type BusinessTypeConfig,
} from '@/shared/config/business-type.config';

export function useBusinessType(): {
  activity: ActivityKey;
  config: BusinessTypeConfig;
} {
  const user = useAuthStore((s) => s.user);

  // Tenants registered before the `activity` column existed only have business_type —
  // derive a representative activity from it so they still get a working sidebar.
  const activity =
    (user?.activity as ActivityKey) ??
    BUSINESS_TYPE_TO_ACTIVITY[(user?.business_type as BusinessTypeKey) ?? 'other'] ??
    DEFAULT_ACTIVITY;

  const config = ACTIVITY_CONFIG[activity] ?? ACTIVITY_CONFIG[DEFAULT_ACTIVITY];

  return { activity, config };
}