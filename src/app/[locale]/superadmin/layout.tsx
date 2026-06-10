'use client';

import { MainLayout } from '@/shared/layout/main-layout';
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
    }
  }, [hydrated, isAuthenticated, router, locale]);

  if (!hydrated || !isAuthenticated) return null;

  return <MainLayout>{children}</MainLayout>;
}