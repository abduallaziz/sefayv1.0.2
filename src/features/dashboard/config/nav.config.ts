import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  TrendingDown,
  Users,
  BarChart3,
  BarChart2,
  UserCircle,
  Settings,
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
    titleKey: 'general',
    items: [
      {
        key: 'overview',
        href: '/dashboard',
        icon: LayoutDashboard,
        labelKey: 'overview',
      },
    ],
  },
  {
    titleKey: 'sales',
    items: [
      {
        key: 'pos',
        href: '/dashboard/pos',
        icon: ShoppingCart,
        labelKey: 'pos',
        permission: 'invoice.create.own',
        feature: 'pos',
      },
      {
        key: 'invoices',
        href: '/dashboard/orders',
        icon: FileText,
        labelKey: 'invoices',
        permission: 'invoice.view',
      },
    ],
  },
  {
    titleKey: 'inventory_section',
    items: [
      {
        key: 'products',
        href: '/dashboard/items',
        icon: Package,
        labelKey: 'products',
        permission: 'items.manage',
      },
    ],
  },
  {
    titleKey: 'customers_section',
    items: [
      {
        key: 'customers',
        href: '/dashboard/customers',
        icon: UserCircle,
        labelKey: 'customerList',
        permission: 'customers.view',
      },
    ],
  },
  {
    titleKey: 'finance_section',
    items: [
      {
        key: 'expenses',
        href: '/dashboard/expenses',
        icon: TrendingDown,
        labelKey: 'expenses',
        permission: 'expenses.view',
      },
    ],
  },
  {
    titleKey: 'hr_section',
    items: [
      {
        key: 'shifts',
        href: '/dashboard/shifts',
        icon: BarChart3,
        labelKey: 'shifts',
        permission: 'shift.view.own',
      },
      {
        key: 'employees',
        href: '/dashboard/users',
        icon: Users,
        labelKey: 'employees',
        permission: 'users.manage',
        roles: ['owner', 'manager'],
      },
    ],
  },
  {
    titleKey: 'reports_section',
    items: [
      {
        key: 'salesReports',
        href: '/dashboard/reports',
        icon: BarChart2,
        labelKey: 'salesReports',
        permission: 'reports.view.branch',
      },
    ],
  },
  {
    titleKey: 'admin_section',
    items: [
      {
        key: 'settings',
        href: '/dashboard/settings',
        icon: Settings,
        labelKey: 'settings',
        roles: ['owner'],
      },
    ],
  },
];

export const NAV_BOTTOM: NavItem[] = [];