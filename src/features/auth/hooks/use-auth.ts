import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { authApi, LoginDto } from '../api/auth.api';
import { useAuthStore, type UserRole, type BusinessType } from '@/core/auth/stores/auth.store';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();

  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess: (data) => {
      setAuth(
        {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role as UserRole,
          tenantId: data.user.tenant_id,
          sessionId: data.user.session_id,
          permissions: data.user.permissions ?? [],
          features: data.user.features ?? [],
          business_type: (data.user.business_type as BusinessType) ?? null,
        },
        data.access_token,
      );

      const isSuperAdmin = data.user.role === 'superadmin';
      router.push(isSuperAdmin ? `/${locale}/superadmin` : `/${locale}/dashboard`);
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth();
      router.push(`/${locale}/login`);
    },
  });
}