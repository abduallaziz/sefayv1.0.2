'use client';

import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/core/auth/stores/auth.store';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login`);
    } else if (user?.role !== 'superadmin') {
      router.replace(`/${locale}/dashboard`);
    }
  }, [hydrated, isAuthenticated, user, router, locale]);

  if (!hydrated || !isAuthenticated) return null;
  if (user?.role !== 'superadmin') return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}