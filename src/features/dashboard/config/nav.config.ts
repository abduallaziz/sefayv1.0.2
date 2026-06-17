import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  RotateCcw,
  Tag,
  Ticket,
  Gift,
  Star,
  Package,
  Warehouse,
  ClipboardList,
  Truck,
  ShoppingBag,
  UtensilsCrossed,
  CalendarDays,
  Users2,
  MonitorPlay,
  UserCircle,
  History,
  Award,
  TrendingDown,
  BookOpen,
  BookMarked,
  ArrowLeftRight,
  Receipt,
  FileBarChart,
  CalendarRange,
  Users,
  Clock,
  BarChart3,
  BarChart2,
  UserCog,
  TrendingUp,
  Download,
  GitBranch,
  Settings,
  Plug,
  FileBadge,
  HardDrive,
  ScrollText,
  HeadphonesIcon,
  Bell,
  CreditCard,
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
        key: 'returns',
        href: '/dashboard/returns',
        icon: RotateCcw,
        labelKey: 'returns',
      },
      {
        key: 'discounts',
        href: '/dashboard/discounts',
        icon: Tag,
        labelKey: 'discounts',
      },
      {
        key: 'coupons',
        href: '/dashboard/coupons',
        icon: Ticket,
        labelKey: 'coupons',
      },
      {
        key: 'giftCards',
        href: '/dashboard/gift-cards',
        icon: Gift,
        labelKey: 'giftCards',
      },
      {
        key: 'loyalty',
        href: '/dashboard/loyalty',
        icon: Star,
        labelKey: 'loyalty',
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
      {
        key: 'inventory',
        href: '/dashboard/inventory',
        icon: Warehouse,
        labelKey: 'inventory',
      },
      {
        key: 'stockCount',
        href: '/dashboard/stock-count',
        icon: ClipboardList,
        labelKey: 'stockCount',
      },
      {
        key: 'suppliers',
        href: '/dashboard/suppliers',
        icon: Truck,
        labelKey: 'suppliers',
      },
      {
        key: 'purchaseOrders',
        href: '/dashboard/purchase-orders',
        icon: ShoppingBag,
        labelKey: 'purchaseOrders',
      },
    ],
  },
  {
    titleKey: 'operations_section',
    items: [
      {
        key: 'tables',
        href: '/dashboard/tables',
        icon: UtensilsCrossed,
        labelKey: 'tables',
        feature: 'tables',
      },
      {
        key: 'reservations',
        href: '/dashboard/reservations',
        icon: CalendarDays,
        labelKey: 'reservations',
        feature: 'reservations',
      },
      {
        key: 'waitlist',
        href: '/dashboard/waitlist',
        icon: Users2,
        labelKey: 'waitlist',
        feature: 'waitlist',
      },
      {
        key: 'kds',
        href: '/dashboard/kds',
        icon: MonitorPlay,
        labelKey: 'kds',
        feature: 'kds',
      },
    ],
  },
  {
    titleKey: 'customers_section',
    items: [
      {
        key: 'customerList',
        href: '/dashboard/customers',
        icon: UserCircle,
        labelKey: 'customerList',
      },
      {
        key: 'purchaseHistory',
        href: '/dashboard/purchase-history',
        icon: History,
        labelKey: 'purchaseHistory',
      },
      {
        key: 'loyaltyPoints',
        href: '/dashboard/loyalty-points',
        icon: Award,
        labelKey: 'loyaltyPoints',
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
        permission: 'expense.request',
      },
      {
        key: 'chartOfAccounts',
        href: '/dashboard/chart-of-accounts',
        icon: BookOpen,
        labelKey: 'chartOfAccounts',
      },
      {
        key: 'ledger',
        href: '/dashboard/ledger',
        icon: BookMarked,
        labelKey: 'ledger',
      },
      {
        key: 'reconciliation',
        href: '/dashboard/reconciliation',
        icon: ArrowLeftRight,
        labelKey: 'reconciliation',
      },
      {
        key: 'vat',
        href: '/dashboard/vat',
        icon: Receipt,
        labelKey: 'vat',
      },
      {
        key: 'zatca',
        href: '/dashboard/zatca',
        icon: FileBadge,
        labelKey: 'zatca',
      },
      {
        key: 'financialReports',
        href: '/dashboard/financial-reports',
        icon: FileBarChart,
        labelKey: 'financialReports',
      },
      {
        key: 'fiscalYear',
        href: '/dashboard/fiscal-year',
        icon: CalendarRange,
        labelKey: 'fiscalYear',
      },
    ],
  },
  {
    titleKey: 'hr_section',
    items: [
      {
        key: 'employees',
        href: '/dashboard/employees',
        icon: Users,
        labelKey: 'employees',
        permission: 'users.manage',
      },
      {
        key: 'attendance',
        href: '/dashboard/attendance',
        icon: Clock,
        labelKey: 'attendance',
      },
      {
        key: 'shifts',
        href: '/dashboard/shifts',
        icon: BarChart3,
        labelKey: 'shifts',
        permission: 'shift.view.own',
      },
      {
        key: 'commissions',
        href: '/dashboard/commissions',
        icon: TrendingUp,
        labelKey: 'commissions',
      },
    ],
  },
  {
    titleKey: 'reports_section',
    items: [
      {
        key: 'salesReports',
        href: '/dashboard/reports/sales',
        icon: BarChart2,
        labelKey: 'salesReports',
        permission: 'reports.view.branch',
      },
      {
        key: 'inventoryReports',
        href: '/dashboard/reports/inventory',
        icon: Package,
        labelKey: 'inventoryReports',
      },
      {
        key: 'employeeReports',
        href: '/dashboard/reports/employees',
        icon: UserCog,
        labelKey: 'employeeReports',
      },
      {
        key: 'customerReports',
        href: '/dashboard/reports/customers',
        icon: UserCircle,
        labelKey: 'customerReports',
      },
      {
        key: 'taxReports',
        href: '/dashboard/reports/tax',
        icon: Receipt,
        labelKey: 'taxReports',
      },
      {
        key: 'exportReports',
        href: '/dashboard/reports/export',
        icon: Download,
        labelKey: 'exportReports',
      },
    ],
  },
  {
    titleKey: 'admin_section',
    items: [
      {
        key: 'branches',
        href: '/dashboard/branches',
        icon: GitBranch,
        labelKey: 'branches',
        roles: ['owner'],
      },
      {
        key: 'users',
        href: '/dashboard/users',
        icon: Users,
        labelKey: 'users',
        permission: 'users.manage',
        roles: ['owner', 'manager'],
      },
      {
        key: 'settings',
        href: '/dashboard/settings',
        icon: Settings,
        labelKey: 'settings',
        roles: ['owner'],
      },
      {
        key: 'integrations',
        href: '/dashboard/integrations',
        icon: Plug,
        labelKey: 'integrations',
        roles: ['owner'],
      },
      {
        key: 'eFattura',
        href: '/dashboard/e-fattura',
        icon: FileBadge,
        labelKey: 'eFattura',
        roles: ['owner'],
      },
      {
        key: 'backup',
        href: '/dashboard/backup',
        icon: HardDrive,
        labelKey: 'backup',
        roles: ['owner'],
      },
      {
        key: 'activityLog',
        href: '/dashboard/activity-log',
        icon: ScrollText,
        labelKey: 'activityLog',
        roles: ['owner', 'manager'],
      },
      {
        key: 'support',
        href: '/dashboard/support',
        icon: HeadphonesIcon,
        labelKey: 'support',
      },
    ],
  },
];

export const NAV_BOTTOM: NavItem[] = [
  {
    key: 'notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    labelKey: 'notifications',
  },
  {
    key: 'subscription',
    href: '/dashboard/subscription',
    icon: CreditCard,
    labelKey: 'subscription',
    roles: ['owner'],
  },
];