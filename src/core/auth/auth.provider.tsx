'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore, type UserRole, type BusinessType } from './stores/auth.store';
import { refreshSession } from '@/lib/api';

interface AuthProviderProps {
  children: React.ReactNode;
}

const API_BASE = '/api/v1';

export function AuthProvider({ children }: AuthProviderProps) {
  const { setAuth, clearAuth, setLoading } = useAuthStore();
  // React StrictMode (dev only) double-invokes this effect on mount. That
  // alone isn't the real hazard — the actual bug was two INDEPENDENT refresh
  // callers (this effect, and apiClient's own 401-triggered refresh in
  // lib/api.ts) racing on the same refresh-token cookie. The backend enforces
  // single-use rotation (auth.service.ts refresh()): the first caller to land
  // rotates the token and succeeds, the second sees it already used and
  // treats it as reuse — actively revoking the session. Net effect: every
  // page load logged the user straight back out. Fixed by (1) guarding this
  // effect against StrictMode's double-invoke, AND (2) routing through the
  // same deduped `refreshSession()` singleton that apiClient uses, so no
  // matter which caller fires first, there is only ever one /auth/refresh
  // request in flight at a time — not two separate ones that happen to both
  // be deduped internally.
  const hasAttemptedRefresh = useRef(false);

  useEffect(() => {
    if (hasAttemptedRefresh.current) return;
    hasAttemptedRefresh.current = true;

    const tryAutoRefresh = async () => {
      try {
        const refreshed = await refreshSession();

        if (!refreshed) {
          clearAuth();
          return;
        }

        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${refreshed.access_token}` },
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
            refreshed.access_token,
            refreshed.realtime_token,
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