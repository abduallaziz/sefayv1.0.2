// Granular onboarding activity (37 sub-activities across 8 sections — see
// OnboardingWizard.tsx ACTIVITY_SECTIONS). Labels live in i18n under
// `onboarding.activity.<ActivityKey>` — reuse those, don't duplicate strings here.
export type ActivityKey =
  | 'restaurant' | 'cafe' | 'fastFood' | 'bakery' | 'juice' | 'foodTruck'
  | 'grocery' | 'supermarket' | 'perfume' | 'stationery' | 'gifts'
  | 'menClothing' | 'womenClothing' | 'shoes' | 'accessories' | 'tailoring'
  | 'pharmacy' | 'medical' | 'clinic' | 'optics' | 'supplements'
  | 'barber' | 'womenSalon' | 'spa' | 'cosmetics'
  | 'carWash' | 'laundry' | 'phoneFix' | 'carWorkshop' | 'homeServices'
  | 'phones' | 'gadgets' | 'gaming'
  | 'furniture' | 'homeware' | 'flowers' | 'pets';

// Legacy broad category, kept for tenants registered before activity existed
// and for features still keyed on it (e.g. vehicle customer fields).
export type BusinessTypeKey = 'restaurant' | 'cafe' | 'retail' | 'services' | 'workshop' | 'other';

export type NavKey =
  | 'dashboard'
  | 'pos'
  | 'orders'
  | 'items'
  | 'customers'
  | 'expenses'
  | 'shifts'
  | 'reports'
  | 'users'
  | 'settings'
  | 'suppliers'
  | 'warehouses'
  | 'locations'
  | 'purchaseOrders'
  | 'goodsReceipts'
  | 'stock'
  | 'adjustments'
  | 'inventoryDashboard'
  | 'movements'
  | 'inventoryReports'
  | 'transfers'
  | 'stockCounts'
  | 'planning'
  | 'inventoryAnalytics'
  | 'quality'
  | 'wms'
  | 'tables'
  | 'kitchen'
  | 'attendance'
  | 'schedules'
  | 'payroll'
  | 'leaves'
  | 'employees'
  | 'coupons'
  | 'notePresets'
  | 'accounting';

export interface BusinessTypeConfig {
  sidebar: NavKey[];
}

// POS is available to every activity without exception — it's the system's core
// selling point, never hide it. (A §28 note from June 23, 2026 had proposed hiding
// POS for pure-service activities; the user explicitly overruled that on June 26,
// 2026 — POS stays in the sidebar for all 37 activities.)
const FULL_SIDEBAR: NavKey[] = ['dashboard', 'pos', 'orders', 'items', 'customers', 'expenses', 'accounting', 'shifts', 'reports', 'users', 'settings', 'suppliers', 'warehouses', 'locations', 'purchaseOrders', 'goodsReceipts', 'stock', 'adjustments', 'inventoryDashboard', 'movements', 'inventoryReports', 'transfers', 'stockCounts', 'planning', 'inventoryAnalytics', 'quality', 'wms', 'attendance', 'schedules', 'payroll', 'leaves', 'employees', 'coupons', 'notePresets'];

// Food-service activities get the Tables/Dine-in + Kitchen Display sidebar entries
// on top of the full base sidebar. This is the first real sidebar differentiation
// by activity (Phase 10F was explicitly flagged as the trigger for it — see TASKS.md
// "Dynamic platform" entry and STATUS.md §46).
const FOOD_SERVICE_SIDEBAR: NavKey[] = [...FULL_SIDEBAR, 'tables', 'kitchen'];

const FOOD_SERVICE_ACTIVITIES: ActivityKey[] = ['restaurant', 'cafe', 'fastFood', 'bakery', 'juice', 'foodTruck'];

export const ACTIVITY_CONFIG: Record<ActivityKey, BusinessTypeConfig> = Object.fromEntries(
  ([
    'restaurant', 'cafe', 'fastFood', 'bakery', 'juice', 'foodTruck',
    'grocery', 'supermarket', 'perfume', 'stationery', 'gifts',
    'menClothing', 'womenClothing', 'shoes', 'accessories', 'tailoring',
    'pharmacy', 'medical', 'clinic', 'optics', 'supplements',
    'barber', 'womenSalon', 'spa', 'cosmetics',
    'carWash', 'laundry', 'phoneFix', 'carWorkshop', 'homeServices',
    'phones', 'gadgets', 'gaming',
    'furniture', 'homeware', 'flowers', 'pets',
  ] as ActivityKey[]).map((key) => [
    key,
    { sidebar: FOOD_SERVICE_ACTIVITIES.includes(key) ? FOOD_SERVICE_SIDEBAR : FULL_SIDEBAR },
  ]),
) as Record<ActivityKey, BusinessTypeConfig>;

export const DEFAULT_ACTIVITY: ActivityKey = 'grocery';

// Special-case value for internal test/demo tenants only — grants the full
// sidebar (every nav entry, including food-service-only ones) regardless of
// activity, so QA accounts can exercise every feature without per-activity
// gating getting in the way.
export const ALL_ACTIVITIES_SIDEBAR: BusinessTypeConfig = { sidebar: FOOD_SERVICE_SIDEBAR };

// Fallback for tenants registered before the `activity` column existed —
// derives a representative activity from the legacy broad business_type.
export const BUSINESS_TYPE_TO_ACTIVITY: Record<BusinessTypeKey, ActivityKey> = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  retail: 'grocery',
  services: 'homeServices',
  workshop: 'carWorkshop',
  other: 'grocery',
};
