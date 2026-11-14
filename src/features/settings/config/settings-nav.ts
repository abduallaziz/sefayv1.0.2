import {
  Building2, Receipt, ShoppingCart, Users, Award, Bell, CreditCard, FileText, ShieldCheck, FileCheck2, GitBranch,
  type LucideIcon,
} from 'lucide-react'

export type SettingsNavGroup = 'workspace' | 'commerce' | 'customers' | 'system'

export interface SettingsNavItem {
  key: string
  /** path without locale prefix */
  href: string
  icon: LucideIcon
  group: SettingsNavGroup
  /** owner/superadmin only (as the old link cards were) */
  ownerOnly?: boolean
  /** needs the backend documents flag */
  needsDocuments?: boolean
  /** extra paths that keep this entry highlighted and inside the shell */
  alsoMatches?: string[]
}

export const SETTINGS_BASE = '/dashboard/settings'

export const SETTINGS_NAV: SettingsNavItem[] = [
  { key: 'general', href: `${SETTINGS_BASE}/general`, icon: Building2, group: 'workspace' },
  { key: 'subscription', href: `${SETTINGS_BASE}/subscription`, icon: CreditCard, group: 'workspace' },
  { key: 'tax', href: `${SETTINGS_BASE}/tax`, icon: Receipt, group: 'commerce' },
  { key: 'zatca', href: `${SETTINGS_BASE}/zatca`, icon: FileCheck2, group: 'commerce', ownerOnly: true },
  { key: 'sales', href: `${SETTINGS_BASE}/sales`, icon: ShoppingCart, group: 'commerce' },
  {
    key: 'documents', href: `${SETTINGS_BASE}/documents`, icon: FileText, group: 'commerce',
    ownerOnly: true, needsDocuments: true,
    alsoMatches: [`${SETTINGS_BASE}/documents/assets`, `${SETTINGS_BASE}/documents/generated`],
  },
  { key: 'customers', href: `${SETTINGS_BASE}/customers`, icon: Users, group: 'customers' },
  { key: 'loyalty', href: `${SETTINGS_BASE}/loyalty`, icon: Award, group: 'customers' },
  { key: 'notifications', href: `${SETTINGS_BASE}/notifications`, icon: Bell, group: 'system' },
  { key: 'accessControl', href: `${SETTINGS_BASE}/access-control`, icon: ShieldCheck, group: 'system', ownerOnly: true },
]

/** Shortcut out of settings (not a settings route). */
export const BRANCHES_SHORTCUT = { key: 'branches', href: '/dashboard/branches', icon: GitBranch }

export const SETTINGS_GROUPS: SettingsNavGroup[] = ['workspace', 'commerce', 'customers', 'system']
