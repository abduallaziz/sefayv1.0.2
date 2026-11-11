import { useAuthStore } from '@/core/auth/stores/auth.store';
import { useActivityProfile } from '@/shared/hooks/useActivityProfile';
import { useActivityPreviewStore } from '@/shared/stores/activity-preview.store';
import {
  ACTIVITY_CONFIG,
  ALL_ACTIVITIES_SIDEBAR,
  DEFAULT_ACTIVITY,
  BUSINESS_TYPE_TO_ACTIVITY,
  type ActivityKey,
  type BusinessTypeKey,
  type BusinessTypeConfig,
  type NavKey,
} from '@/shared/config/business-type.config';

// Server capabilities that switch on extra sidebar entries. Additive only: the
// legacy per-activity entries stay, so existing tenants lose nothing, and new
// activities / multi-activity tenants gain the entries their capabilities imply.
const CAPABILITY_NAV: Record<string, NavKey> = {
  tables: 'tables',
  kitchen: 'kitchen',
  queue: 'washQueue',
};

function withProfileEntries(config: BusinessTypeConfig, capabilities?: string[]): BusinessTypeConfig {
  if (!capabilities?.length) return config;
  const extra = capabilities.map((c) => CAPABILITY_NAV[c]).filter((k): k is NavKey => !!k && !config.sidebar.includes(k));
  return extra.length ? { ...config, sidebar: [...config.sidebar, ...extra] } : config;
}

export function useBusinessType(): {
  activity: ActivityKey | 'all';
  config: BusinessTypeConfig;
} {
  const user = useAuthStore((s) => s.user);
  const preview = useActivityPreviewStore((s) => s.override);
  const { data: profile } = useActivityProfile();
  const capabilities = profile?.capabilities;

  if (user?.activity === 'all') {
    // Internal test tenant only: an optional "preview as" activity (dev switcher).
    if (preview && ACTIVITY_CONFIG[preview]) {
      return { activity: preview, config: ACTIVITY_CONFIG[preview] };
    }
    return { activity: 'all', config: ALL_ACTIVITIES_SIDEBAR };
  }

  // Tenants registered before the `activity` column existed only have business_type —
  // derive a representative activity from it so they still get a working sidebar.
  const activity =
    (user?.activity as ActivityKey) ??
    BUSINESS_TYPE_TO_ACTIVITY[(user?.business_type as BusinessTypeKey) ?? 'other'] ??
    DEFAULT_ACTIVITY;

  const baseConfig = ACTIVITY_CONFIG[activity] ?? ACTIVITY_CONFIG[DEFAULT_ACTIVITY];
  const config = withProfileEntries(baseConfig, capabilities);

  return { activity, config };
}