'use client';

import { useEffect } from 'react';
import { useAuthStore } from './stores/auth.store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { refreshToken, setTokens, setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const tryAutoRefresh = async () => {
      if (!refreshToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/auth/refresh`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          },
        );

        if (!res.ok) {
          clearAuth();
          return;
        }

        const data = await res.json();
        setTokens(data.access_token, data.refresh_token);

        const meRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/auth/me`,
          { headers: { Authorization: `Bearer ${data.access_token}` } },
        );

        if (meRes.ok) {
          const user = await meRes.json();
          setAuth(
            {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              tenantId: user.tenant_id,
              sessionId: user.session_id,
              permissions: user.permissions ?? [],
              features: user.features ?? [],
            },
            data.access_token,
            data.refresh_token,
          );
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    tryAutoRefresh();
  }, []);

  return <>{children}</>;
}