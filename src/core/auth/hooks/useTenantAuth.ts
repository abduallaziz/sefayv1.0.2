'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/auth/stores/auth.store';

export function useTenantAuth() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
    if (!isLoading && isAuthenticated && user?.role === 'superadmin') {
      router.replace('/superadmin');
    }
  }, [isLoading, isAuthenticated, user, router]);

  return { user, isLoading, isAuthenticated };
}