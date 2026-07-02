'use client';

import { useEffect } from 'react';
import { useAuthStore, type UserRole, type BusinessType } from './stores/auth.store';

interface AuthProviderProps {
  children: React.ReactNode;
}

const API_BASE = '/api/v1';

export function AuthProvider({ children }: AuthProviderProps) {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const tryAutoRefresh = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!res.ok) {
          clearAuth();
          return;
        }

        const data = await res.json();

        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
          credentials: 'include',
        });

        if (meRes.ok) {
          const user = await meRes.json();
          setAuth(
            {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role as UserRole,
              tenantId: user.tenant_id,
              sessionId: user.session_id,
              permissions: user.permissions ?? [],
              features: user.features ?? [],
              business_type: (user.business_type as BusinessType) ?? null,
              activity: user.activity ?? null,
            },
            data.access_token,
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