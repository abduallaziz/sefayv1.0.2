'use client';

import { useState } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { ThemeProvider } from '@/core/theme/components/ThemeProvider';
import { useThemeStore } from '@/core/theme/stores/theme.store';

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDark = useThemeStore((s) => s.theme === 'dark');

  return (
    <ThemeProvider>
      <div
        style={{
          minHeight: '100vh',
          backgroundImage: isDark
            ? 'radial-gradient(1400px 700px at 88% -8%, rgba(37,99,235,0.10), transparent 52%), radial-gradient(1000px 600px at 6% 12%, rgba(12,68,124,0.10), transparent 48%)'
            : 'radial-gradient(1400px 700px at 88% -8%, rgba(37,99,235,0.07), transparent 52%), radial-gradient(1000px 600px at 6% 12%, rgba(12,68,124,0.055), transparent 48%)',
          backgroundColor: isDark ? '#0D1117' : '#E9EEF5',
          backgroundAttachment: 'fixed',
        }}
      >
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <div style={{ display: 'flex', height: 'calc(100vh - 66px)', position: 'relative' }}>
          <SuperAdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main
            className="p-4 lg:p-6 lg:ms-[264px]"
            style={{ flex: 1, minWidth: 0, overflowX: 'hidden', overflowY: 'auto' }}
          >
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
