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
  FileText,
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
        permission: 'invoice.view.own',
      },
      {
        key: 'customers',
        href: '/dashboard/customers',
        icon: UserCircle,
        labelKey: 'customers',
      },
    ],
  },
  {
    titleKey: 'operations',
    items: [
      {
        key: 'items',
        href: '/dashboard/items',
        icon: Package,
        labelKey: 'items',
        permission: 'items.manage',
      },
      {
        key: 'shifts',
        href: '/dashboard/shifts',
        icon: Clock,
        labelKey: 'shifts',
        permission: 'shift.view.own',
      },
      {
        key: 'expenses',
        href: '/dashboard/expenses',
        icon: TrendingDown,
        labelKey: 'expenses',
        permission: 'expense.request',
      },
    ],
  },
  {
    titleKey: 'management',
    items: [
      {
        key: 'users',
        href: '/dashboard/users',
        icon: Users,
        labelKey: 'users',
        permission: 'users.manage',
        roles: ['owner', 'manager'],
      },
      {
        key: 'reports',
        href: '/dashboard/reports',
        icon: BarChart3,
        labelKey: 'reports',
        permission: 'reports.view.branch',
      },
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