'use client';

import { useState } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';

// SuperAdmin page content (cards, tables, charts) is built with fixed white-on-dark
// styling throughout, so this shell stays permanently dark regardless of the
// tenant-dashboard theme toggle — only the chrome (header/sidebar) shares that
// theme system's visual language, not the actual light/dark switch.
export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(1400px 700px at 88% -8%, rgba(37,99,235,0.10), transparent 52%), radial-gradient(1000px 600px at 6% 12%, rgba(12,68,124,0.10), transparent 48%), #0D1117',
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
    </>
  );
}
