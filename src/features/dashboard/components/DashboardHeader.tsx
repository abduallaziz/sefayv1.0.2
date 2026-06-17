'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Bell, Menu, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import { useThemeStore } from '@/core/theme/stores/theme.store';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const { theme, toggle } = useThemeStore();
  const [notifCount] = useState(3);
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const otherLocale = currentLocale === 'ar' ? 'en' : 'ar';
  const otherLabel = currentLocale === 'ar' ? 'EN' : 'عربي';

  const switchLocale = () => {
    const newPath = pathname.replace(`/${currentLocale}`, `/${otherLocale}`);
    router.push(newPath);
  };

  return (
    <header className="h-14 bg-[#0C447C] px-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">

      {/* User — start (يسار في LTR، يمين في RTL) */}
      <div className="flex items-center gap-2 pe-3 border-e border-white/20">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-semibold">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </span>
        </div>
        <span className="hidden sm:block text-white text-sm font-medium">
          {user?.name}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions — end */}
      <div className="flex items-center gap-2">
        {/* Language */}
        <button
          onClick={switchLocale}
          className="px-2.5 py-1 rounded-lg border border-white/20 text-xs text-white/70 hover:text-white hover:border-white/40 transition-colors"
        >
          {otherLabel}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10">
          <Bell className="w-4 h-4" />
          {notifCount > 0 && (
            <span className="absolute top-1 end-1 w-3.5 h-3.5 bg-white text-[#0C447C] text-[9px] rounded-full flex items-center justify-center font-bold leading-none">
              {notifCount}
            </span>
          )}
        </button>

        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

    </header>
  );
}