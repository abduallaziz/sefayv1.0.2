import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, LoginDto } from '../api/auth.api';
import { useAuthStore } from '@/core/auth/stores/auth.store';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess: (data) => {
      setAuth(
        {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role as never,
          tenantId: data.user.tenant_id,
          sessionId: data.user.session_id,
          permissions: data.user.permissions ?? [],
          features: data.user.features ?? [],
        },
        data.access_token,
        data.refresh_token,
      );

      const isSuperAdmin = data.user.role === 'superadmin';
      router.push(isSuperAdmin ? '/en/superadmin' : '/en/dashboard');
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth();
      router.push('/en/login');
    },
  });
}