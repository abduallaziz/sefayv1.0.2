import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  TrendingDown,
  Clock,
  BarChart3,
  Settings,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  permission?: string;
  feature?: string;
  roles?: string[];
  badge?: string;
}

export interface NavSection {
  titleKey: string;
  items: NavItem[];
}

export const NAV_CONFIG: NavSection[] = [
  {
    titleKey: 'nav.general',
    items: [
      {
        key: 'overview',
        href: '/dashboard',
        icon: LayoutDashboard,
        labelKey: 'nav.overview',
      },
    ],
  },
  {
    titleKey: 'nav.sales',
    items: [
      {
        key: 'pos',
        href: '/dashboard/pos',
        icon: ShoppingCart,
        labelKey: 'nav.pos',
        permission: 'invoice.create.own',
        feature: 'pos',
      },
      {
        key: 'invoices',
        href: '/dashboard/invoices',
        icon: ShoppingCart,
        labelKey: 'nav.invoices',
        permission: 'invoice.view.own',
      },
      {
        key: 'customers',
        href: '/dashboard/customers',
        icon: UserCircle,
        labelKey: 'nav.customers',
      },
    ],
  },
  {
    titleKey: 'nav.operations',
    items: [
      {
        key: 'items',
        href: '/dashboard/items',
        icon: Package,
        labelKey: 'nav.items',
        permission: 'items.manage',
      },
      {
        key: 'shifts',
        href: '/dashboard/shifts',
        icon: Clock,
        labelKey: 'nav.shifts',
        permission: 'shift.view.own',
      },
      {
        key: 'expenses',
        href: '/dashboard/expenses',
        icon: TrendingDown,
        labelKey: 'nav.expenses',
        permission: 'expense.request',
      },
    ],
  },
  {
    titleKey: 'nav.management',
    items: [
      {
        key: 'users',
        href: '/dashboard/users',
        icon: Users,
        labelKey: 'nav.users',
        permission: 'users.manage',
        roles: ['owner', 'manager'],
      },
      {
        key: 'reports',
        href: '/dashboard/reports',
        icon: BarChart3,
        labelKey: 'nav.reports',
        permission: 'reports.view.branch',
      },
      {
        key: 'settings',
        href: '/dashboard/settings',
        icon: Settings,
        labelKey: 'nav.settings',
        roles: ['owner'],
      },
    ],
  },
];