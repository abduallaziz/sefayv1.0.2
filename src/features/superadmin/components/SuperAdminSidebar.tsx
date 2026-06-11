'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import {
  LayoutDashboard, Building2, CreditCard,
  ToggleLeft, Shield, BarChart3, LogOut, Settings,
} from 'lucide-react';

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('superadmin.sidebar');
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const NAV = [
    {
      titleKey: t('general'),
      items: [
        { key: 'overview', href: '/superadmin', label: t('overview'), icon: LayoutDashboard },
      ],
    },
    {
      titleKey: t('management'),
      items: [
        { key: 'tenants', href: '/superadmin/tenants', label: t('tenants'), icon: Building2 },
        { key: 'subscriptions', href: '/superadmin/subscriptions', label: t('subscriptions'), icon: CreditCard },
        { key: 'feature-flags', href: '/superadmin/feature-flags', label: t('featureFlags'), icon: ToggleLeft },
        { key: 'auth-control', href: '/superadmin/auth-control', label: t('authControl'), icon: Shield },
        { key: 'settings', href: '/superadmin/settings', label: t('settings'), icon: Settings },
      ],
    },
    {
      titleKey: t('reportsSection'),
      items: [
        { key: 'reports', href: '/superadmin/reports', label: t('reports'), icon: BarChart3 },
      ],
    },
  ];

  return (
    <aside className="flex flex-col w-64 h-full bg-[#0d1117] border-e border-white/[0.06]">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Sefay</p>
            <p className="text-violet-400 text-xs">Super Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV.map((section) => (
          <div key={section.titleKey}>
            <p className="px-3 mb-1 text-xs font-medium text-slate-600 uppercase tracking-wider">
              {section.titleKey}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const fullHref = `/${locale}${item.href}`;
                const isActive = pathname === fullHref || pathname.startsWith(fullHref + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={fullHref}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                      isActive
                        ? 'bg-violet-500/10 text-violet-400 font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-violet-400 text-xs font-medium">
              {user?.name?.[0]?.toUpperCase() ?? 'S'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
          <button onClick={clearAuth} className="text-slate-600 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}