export type BusinessTypeKey =
  | 'restaurant'
  | 'cafe'
  | 'retail'
  | 'services'
  | 'workshop'
  | 'other';

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
  | 'settings';

export interface BusinessTypeConfig {
  sidebar: NavKey[];
  label: { ar: string; en: string };
}

export const BUSINESS_TYPE_CONFIG: Record<BusinessTypeKey, BusinessTypeConfig> = {
  restaurant: {
    sidebar: ['dashboard', 'pos', 'orders', 'items', 'customers', 'expenses', 'shifts', 'reports', 'users', 'settings'],
    label: { ar: 'مطعم', en: 'Restaurant' },
  },
  cafe: {
    sidebar: ['dashboard', 'pos', 'orders', 'items', 'customers', 'expenses', 'shifts', 'reports', 'users', 'settings'],
    label: { ar: 'كافيه', en: 'Cafe' },
  },
  retail: {
    sidebar: ['dashboard', 'pos', 'orders', 'items', 'customers', 'expenses', 'shifts', 'reports', 'users', 'settings'],
    label: { ar: 'متجر تجزئة', en: 'Retail' },
  },
  services: {
    sidebar: ['dashboard', 'orders', 'items', 'customers', 'expenses', 'shifts', 'reports', 'users', 'settings'],
    label: { ar: 'خدمات', en: 'Services' },
  },
  workshop: {
    sidebar: ['dashboard', 'orders', 'items', 'customers', 'expenses', 'shifts', 'reports', 'users', 'settings'],
    label: { ar: 'ورشة', en: 'Workshop' },
  },
  other: {
    sidebar: ['dashboard', 'pos', 'orders', 'items', 'customers', 'expenses', 'shifts', 'reports', 'users', 'settings'],
    label: { ar: 'أخرى', en: 'Other' },
  },
};

export const DEFAULT_BUSINESS_TYPE: BusinessTypeKey = 'retail';