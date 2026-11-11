import { ApiError } from '@/lib/api'

const API_BASE = '/api/v1'

// New Expenses' core/recurring/quick-entry endpoints require Branch to be
// resolved server-side from the `x-branch-id` request header (TenantGuard) —
// Branch is deliberately never a client-selectable field on any Expense DTO.
// The shared `apiClient` has no header-passthrough, and no app-wide "current
// branch" session context exists yet anywhere in this frontend (a disclosed,
// pre-existing gap — see the Step 10 report). This is a small, scoped
// request helper used only by expenses-v2 API calls that need the header;
// it does not touch or replace the shared apiClient.
async function branchScopedRequest<T>(
  path: string,
  branchId: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { method = 'GET', body } = options
  const { useAuthStore } = await import('@/core/auth/stores/auth.store')
  const { accessToken } = useAuthStore.getState()

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'x-branch-id': branchId,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new ApiError(res.status, error.message ?? 'Request failed')
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return null as T
  return JSON.parse(text) as T
}

async function branchScopedUpload<T>(
  path: string,
  branchId: string,
  file: File,
): Promise<T> {
  const { useAuthStore } = await import('@/core/auth/stores/auth.store')
  const { accessToken } = useAuthStore.getState()

  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'x-branch-id': branchId,
    },
    body: form,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new ApiError(res.status, error.message ?? 'Request failed')
  }
  return res.json() as Promise<T>
}

export const branchScopedApi = {
  get: <T>(path: string, branchId: string) => branchScopedRequest<T>(path, branchId),
  post: <T>(path: string, branchId: string, body: unknown) =>
    branchScopedRequest<T>(path, branchId, { method: 'POST', body }),
  patch: <T>(path: string, branchId: string, body: unknown = {}) =>
    branchScopedRequest<T>(path, branchId, { method: 'PATCH', body }),
  upload: <T>(path: string, branchId: string, file: File) =>
    branchScopedUpload<T>(path, branchId, file),
}
