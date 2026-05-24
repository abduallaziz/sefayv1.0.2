'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/core/auth/stores/auth.store';

export function useTenantAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  const locale = pathname.split('/')[1] || 'ar';

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login`);
    }
    if (isAuthenticated && user?.role === 'superadmin') {
      router.replace(`/${locale}/superadmin`);
    }
  }, [hydrated, isAuthenticated, user, router, locale]);

  return { user, isLoading: !hydrated, isAuthenticated };
}