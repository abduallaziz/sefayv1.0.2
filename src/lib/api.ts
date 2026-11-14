import { localizeServerMessage } from './server-messages';

const API_BASE = '/api/v1';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

// Module-level singleton, shared with AuthProvider (see refreshSession below) —
// this is the ONLY place a /auth/refresh request is allowed to originate from.
// Refresh tokens rotate single-use on the backend (auth.service.ts refresh()):
// a second concurrent call with the same still-valid-looking cookie is treated
// as token reuse and actively revokes the session. Two independent callers
// (AuthProvider's own mount-time refresh and apiClient's 401-triggered refresh)
// racing on page load reproduced exactly that — every load logged the user
// back out. Funneling both through this one deduped promise is what actually
// prevents the race (a StrictMode double-invoke guard on AuthProvider alone
// was not sufficient, since apiClient could independently trigger a second
// concurrent call).
let refreshPromise: Promise<{ access_token: string; realtime_token?: string | null } | null> | null = null;

// Why the last refresh failed: 'invalid' = the server answered and the session
// is really gone (401/403 etc.); 'transient' = network down, rate limit or a
// server error — the session may still be fine, so the user must NOT be logged out.
let lastRefreshFailure: 'invalid' | 'transient' | null = null;

/** True when the last refresh failed for a passing reason (network, 429, 5xx)
 *  rather than because the session is really gone. */
export function wasLastRefreshTransient(): boolean {
  return lastRefreshFailure === 'transient';
}

// Set when an active session ends because it expired, so the login page can say so.
export const SESSION_EXPIRED_KEY = 'sefay.sessionExpired';

async function doRefresh(): Promise<{ access_token: string; realtime_token?: string | null } | null> {
  lastRefreshFailure = null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      lastRefreshFailure = res.status === 429 || res.status >= 500 ? 'transient' : 'invalid';
      return null;
    }
    return await res.json();
  } catch {
    lastRefreshFailure = 'transient';
    return null;
  }
}

export async function refreshSession(): Promise<{ access_token: string; realtime_token?: string | null } | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const { useAuthStore } = await import('@/core/auth/stores/auth.store');
  const { accessToken } = useAuthStore.getState();

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      if (lastRefreshFailure === 'transient') {
        // Could not reach the server to renew the session: keep the user signed
        // in and let the caller's retry try again, instead of logging them out.
        throw new ApiError(503, localizeServerMessage('Service temporarily unavailable'));
      }
      // The session really ended: remember why, then sign out (the app then
      // redirects to the login page, which shows the "session expired" note).
      try {
        window.sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
      } catch {
        /* storage blocked: the redirect still happens, just without the note */
      }
      useAuthStore.getState().clearAuth();
      throw new ApiError(401, 'Unauthorized');
    }
    const { setAccessToken } = useAuthStore.getState();
    setAccessToken(refreshed.access_token, refreshed.realtime_token);
    return request<T>(path, options);
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, localizeServerMessage(error.message ?? 'Request failed'));
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string, options?: { data?: unknown }) =>
    request<T>(path, { method: 'DELETE', body: options?.data }),
};