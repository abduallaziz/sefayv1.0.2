'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import { useHasHydrated } from '@/shared/hooks/useHasHydrated';

export function useTenantAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const hydrated = useHasHydrated();

  const locale = pathname.split('/')[1] || 'ar';
  const isLoading = !hydrated || authLoading;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login`);
    }
    if (isAuthenticated && user?.role === 'superadmin') {
      router.replace(`/${locale}/superadmin`);
    }
  }, [isLoading, isAuthenticated, user, router, locale]);

  return { user, isLoading, isAuthenticated };
}