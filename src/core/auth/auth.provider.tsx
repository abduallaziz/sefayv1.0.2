'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore, type UserRole, type BusinessType } from './stores/auth.store';
import { refreshSession, wasLastRefreshTransient } from '@/lib/api';

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
        // A passing failure (network drop, rate limit, server restart) is not
        // a lost session: retry a couple of times before signing the user out.
        const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
        let refreshed = await refreshSession();
        for (const delay of [1000, 2500]) {
          if (refreshed || !wasLastRefreshTransient()) break;
          await wait(delay);
          refreshed = await refreshSession();
        }

        if (!refreshed) {
          clearAuth();
          return;
        }

        const fetchMe = () =>
          fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${refreshed.access_token}` },
            credentials: 'include',
          });
        let meRes: Response | null = null;
        for (const delay of [0, 1000, 2500]) {
          if (delay) await wait(delay);
          try {
            meRes = await fetchMe();
          } catch {
            meRes = null; // network drop: try again
            continue;
          }
          if (meRes.status !== 429 && meRes.status < 500) break;
        }

        if (meRes?.ok) {
          const user = await meRes.json();
          setAuth(
            {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role as UserRole,
              tenantId: user.tenant_id,
              branchId: user.branch_id ?? null,
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
    // clearAuth/setAuth/setLoading are stable Zustand action references (never
    // change identity) — listing them doesn't change when this runs; the
    // `hasAttemptedRefresh` ref above is what actually guarantees "once".
  }, [clearAuth, setAuth, setLoading]);

  return <>{children}</>;
}