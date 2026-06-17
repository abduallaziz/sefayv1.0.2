'use client';

import { useState, useEffect } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { ThemeProvider } from '@/core/theme/components/ThemeProvider';
import { useTenantAuth } from '@/core/auth/hooks/useTenantAuth';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { settingsApi } from '@/features/settings/api/settings.api';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading, isAuthenticated } = useTenantAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations('common');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const setCurrency = useTenantStore((s) => s.setCurrency);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || profileLoaded) return;
    settingsApi.getProfile().then((profile) => {
      if (profile.currency_code && profile.currency_symbol) {
        setCurrency(profile.currency_code, profile.currency_symbol);
      }
      setProfileLoaded(true);
    }).catch(() => {
      setProfileLoaded(true);
    });
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0C447C] flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-sm">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const sidebarTranslate = sidebarOpen
    ? 'translate-x-0'
    : isRTL
      ? 'translate-x-full lg:translate-x-0'
      : '-translate-x-full lg:translate-x-0';

  return (
    <ThemeProvider>
      <div className="h-screen bg-slate-50 dark:bg-gray-950 flex overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div
          className={cn(
            'fixed inset-y-0 z-30 lg:relative lg:translate-x-0 transition-transform duration-200',
            isRTL ? 'right-0' : 'left-0',
            sidebarTranslate
          )}
        >
          <DashboardSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}