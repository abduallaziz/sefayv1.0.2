'use client';

import { useState } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { cn } from '@/lib/utils';

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-[#080c12] flex overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed inset-y-0 start-0 z-30 lg:relative lg:translate-x-0 transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SuperAdminSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}