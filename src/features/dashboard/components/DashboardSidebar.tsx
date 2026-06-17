'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { NAV_CONFIG, NAV_BOTTOM, type NavItem } from '../config/nav.config';
import { usePermission, useFeature, useRole } from '@/core/permissions/hooks/usePermission';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import { Building2, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { useState } from 'react';

function NavItemComponent({ item }: { item: NavItem }) {
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
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
        isActive
          ? 'bg-[#E8F1FB] dark:bg-[#0C447C]/30 text-[#0C447C] dark:text-[#B5D4F4] font-medium'
          : 'text-slate-600 dark:text-slate-400 hover:text-[#0C447C] dark:hover:text-[#B5D4F4] hover:bg-[#F0F7FF] dark:hover:bg-[#0C447C]/20'
      )}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-[#0C447C] dark:text-[#B5D4F4]' : 'text-slate-400 dark:text-slate-500')} />
      <span className="flex-1 truncate">{t(item.labelKey)}</span>
      {item.badge && (
        <span className="text-xs bg-[#0C447C] text-white px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function NavSection({ section }: { section: (typeof NAV_CONFIG)[0] }) {
  const t = useTranslations('shell.nav');
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 mb-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
      >
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
          {t(section.titleKey)}
        </span>
        <ChevronRight
          className={cn(
            'w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-all duration-150',
            open && 'rotate-90'
          )}
        />
      </button>
      {open && (
        <div className="space-y-0.5">
          {section.items.map((item) => (
            <NavItemComponent key={item.key} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardSidebar() {
  const t = useTranslations('shell.nav');
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [branchOpen, setBranchOpen] = useState(false);

  return (
    <aside className="flex flex-col w-72 sm:w-64 h-full bg-white dark:bg-gray-900 border-e border-slate-200 dark:border-gray-800">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0C447C] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <p className="text-[#0C447C] dark:text-[#B5D4F4] font-bold text-sm leading-tight">Sefay</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs">{t('platformSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* Branch Selector */}
      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-gray-800">
        <button
          onClick={() => setBranchOpen(!branchOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-gray-800 hover:bg-[#F0F7FF] dark:hover:bg-[#0C447C]/20 border border-slate-200 dark:border-gray-700 hover:border-[#B5D4F4] dark:hover:border-[#0C447C] transition-all text-sm text-slate-600 dark:text-slate-300"
        >
          <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <span className="flex-1 text-start truncate">{t('mainBranch')}</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-150',
              branchOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_CONFIG.map((section) => (
          <NavSection key={section.titleKey} section={section} />
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="px-3 py-2 border-t border-slate-100 dark:border-gray-800 space-y-0.5">
        {NAV_BOTTOM.map((item) => (
          <NavItemComponent key={item.key} item={item} />
        ))}
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#E8F1FB] dark:bg-[#0C447C]/30 border border-[#B5D4F4] dark:border-[#0C447C]/50 flex items-center justify-center flex-shrink-0">
            <span className="text-[#0C447C] dark:text-[#B5D4F4] text-xs font-semibold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-700 dark:text-slate-200 text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={clearAuth}
            className="text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400 transition-colors p-1 rounded"
            title={t('logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}