import { useAuthStore } from '@/core/auth/stores/auth.store';
import {
  BUSINESS_TYPE_CONFIG,
  DEFAULT_BUSINESS_TYPE,
  type BusinessTypeKey,
  type BusinessTypeConfig,
} from '@/shared/config/business-type.config';

export function useBusinessType(): {
  businessType: BusinessTypeKey;
  config: BusinessTypeConfig;
} {
  const user = useAuthStore((s) => s.user);
  const businessType = (user?.business_type as BusinessTypeKey) ?? DEFAULT_BUSINESS_TYPE;
  const config = BUSINESS_TYPE_CONFIG[businessType] ?? BUSINESS_TYPE_CONFIG[DEFAULT_BUSINESS_TYPE];

  return { businessType, config };
}