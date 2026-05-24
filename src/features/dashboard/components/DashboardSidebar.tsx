'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { NAV_CONFIG } from '../config/nav.config';
import { usePermission, useFeature, useRole } from '@/core/permissions/hooks/usePermission';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import { Building2, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';

function NavItemComponent({ item }: { item: (typeof NAV_CONFIG)[0]['items'][0] }) {
  const t = useTranslations('shell.nav');
  const pathname = usePathname();
  const locale = useLocale();
  const hasPermission = usePermission(item.permission ?? '');
  const hasFeature = useFeature(item.feature ?? '');
  const role = useRole();

  if (item.permission && !hasPermission) return null;
  if (item.feature && !hasFeature) return null;
  if (item.roles && role && !item.roles.includes(role)) return null;

  const fullHref = `/${locale}${item.href}`;
  const isActive = pathname === fullHref || pathname.startsWith(fullHref + '/');
  const Icon = item.icon;

  return (
    <Link
      href={fullHref}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
        isActive
          ? 'bg-blue-500/10 text-blue-400 font-medium'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{t(item.labelKey)}</span>
      {item.badge && (
        <span className="ms-auto text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function DashboardSidebar() {
  const t = useTranslations('shell.nav');
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [branchOpen, setBranchOpen] = useState(false);

  return (
    <aside className="flex flex-col w-64 h-full bg-[#0d1117] border-e border-white/[0.06]">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Sefay</p>
            <p className="text-slate-500 text-xs">{user?.role}</p>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-white/[0.06]">
        <button
          onClick={() => setBranchOpen(!branchOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-sm text-slate-300"
        >
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="flex-1 text-start truncate">{t('mainBranch')}</span>
          <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', branchOpen && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_CONFIG.map((section) => (
          <div key={section.titleKey}>
            <p className="px-3 mb-1 text-xs font-medium text-slate-600 uppercase tracking-wider">
              {t(section.titleKey)}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemComponent key={item.key} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400 text-xs font-medium">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
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