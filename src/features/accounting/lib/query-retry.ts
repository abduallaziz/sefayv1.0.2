import { ApiError } from '@/lib/api'

// A 4xx answer (bad filter, no permission, not found) will not change on retry:
// never retry it, and retry anything else at most once.
export function retryUnlessClientError(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return failureCount < 1
}
