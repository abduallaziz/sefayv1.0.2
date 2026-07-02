'use client';

import { SuperAdminLayout } from '@/features/superadmin/components/SuperAdminLayout';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/core/auth/stores/auth.store';

export default function SuperAdminLayoutPage({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const [hydrated, setHydrated] = useState(false);
  const isLoading = !hydrated || authLoading;

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login`);
    } else if (user?.role !== 'superadmin') {
      router.replace(`/${locale}/dashboard`);
    }
  }, [isLoading, isAuthenticated, user, router, locale]);

  if (isLoading || !isAuthenticated) return null;
  if (user?.role !== 'superadmin') return null;

  return <SuperAdminLayout>{children}</SuperAdminLayout>;
}