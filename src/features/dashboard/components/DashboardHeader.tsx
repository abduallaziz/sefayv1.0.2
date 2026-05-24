'use client';

import { useTranslations } from 'next-intl';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const t = useTranslations('dashboard');
  const user = useAuthStore((s) => s.user);
  const [notifCount] = useState(3);
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = pathname.startsWith('/ar') ? 'ar' : 'en'
  const otherLocale = currentLocale === 'ar' ? 'en' : 'ar'
  const otherLabel = currentLocale === 'ar' ? 'EN' : 'عربي'

  const switchLocale = () => {
    const newPath = pathname.replace(`/${currentLocale}`, `/${otherLocale}`)
    router.push(newPath)
  }

  return (
    <header className="h-14 bg-[#0d1117]/80 backdrop-blur border-b border-white/[0.06] px-4 flex items-center gap-4 sticky top-0 z-10">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-400 hover:text-white transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={t('search')}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg ps-9 pe-3 py-1.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="ms-auto flex items-center gap-3">
        {/* Language switcher */}
        <button
          onClick={switchLocale}
          className="px-2.5 py-1 rounded-lg border border-white/[0.08] text-xs text-slate-400 hover:text-white hover:border-white/20 transition-colors"
        >
          {otherLabel}
        </button>

        {/* Notifications */}
        <button className="relative text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          {notifCount > 0 && (
            <span className="absolute -top-1 -end-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
              {notifCount}
            </span>
          )}
        </button>

        {/* Shift indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">{t('openShift')}</span>
        </div>
      </div>
    </header>
  );
}