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
  | 'stockCounts';

export interface BusinessTypeConfig {
  sidebar: NavKey[];
}

// POS is available to every activity without exception — it's the system's core
// selling point, never hide it. (A §28 note from June 23, 2026 had proposed hiding
// POS for pure-service activities; the user explicitly overruled that on June 26,
// 2026 — POS stays in the sidebar for all 37 activities.)
const FULL_SIDEBAR: NavKey[] = ['dashboard', 'pos', 'orders', 'items', 'customers', 'expenses', 'shifts', 'reports', 'users', 'settings', 'suppliers', 'warehouses', 'locations', 'purchaseOrders', 'goodsReceipts', 'stock', 'adjustments', 'inventoryDashboard', 'movements', 'inventoryReports', 'transfers', 'stockCounts'];

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
  ] as ActivityKey[]).map((key) => [key, { sidebar: FULL_SIDEBAR }]),
) as Record<ActivityKey, BusinessTypeConfig>;

export const DEFAULT_ACTIVITY: ActivityKey = 'grocery';

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
