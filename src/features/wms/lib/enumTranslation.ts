import { useTranslations } from 'next-intl';

// Inventory #7 / F1 residual localization (Owner-approved) — extracted from
// WmsOverviewDashboard.tsx so F2 (PickListsList) can reuse the same
// known-value + safe-fallback + audit-warning behavior instead of
// duplicating it. Looks up `${keyPrefix}.${value}` against the caller's
// `wms` translations; any value outside `knownKeys` falls back to the raw
// value (never a blank/crashed badge) and is reported via console.warn so
// unmapped backend values are never silently dropped or invented.
export function translateEnum(
  t: ReturnType<typeof useTranslations>,
  keyPrefix: string,
  knownKeys: readonly string[],
  value: string,
): string {
  if (!knownKeys.includes(value)) {
    console.warn(`[wms] unmapped ${keyPrefix} value from backend: "${value}"`);
    return value;
  }
  return t(`${keyPrefix}.${value}`);
}
