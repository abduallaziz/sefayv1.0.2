'use client';

import { useAuthStore } from '@/core/auth/stores/auth.store';

export function usePermission(permission: string): boolean {
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);
  return permissions.includes(permission);
}

export function useFeature(featureKey: string): boolean {
  const features = useAuthStore((s) => s.user?.features ?? []);
  return features.includes(featureKey);
}

export function useRole() {
  return useAuthStore((s) => s.user?.role);
}