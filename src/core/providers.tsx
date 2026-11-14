'use client'

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { ApiError } from '@/lib/api'
import { localizeServerMessage } from '@/lib/server-messages'

/** A failure worth retrying: no answer from the server (fetch rejects with a
 *  TypeError), the rate limit, or a 5xx. Everything else is a real answer. */
function isTransientError(error: unknown): boolean {
  if (error instanceof ApiError) return error.status === 429 || error.status >= 500
  return error instanceof TypeError
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Keys can hold objects (e.g. a date range); join() would print them as
        // "[object Object]", so serialise those parts to keep the log readable.
        const key = query.queryKey
          .map((part) => (typeof part === 'object' && part !== null ? JSON.stringify(part) : String(part)))
          .join('/')
        console.error(`[Query Error] ${key}:`, error)
      },
    }),
    // No failed write may be silent: forms that show the error themselves still get it, and the
    // many that don't (silent 400/500s found in the UI audit) now show a toast. The message id is
    // the text itself, so the same error shown twice (inline handler + here) appears once.
    mutationCache: new MutationCache({
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) return
        const message = error instanceof ApiError
          ? error.message
          : error instanceof TypeError ? localizeServerMessage('Service temporarily unavailable') : null
        if (message) toast.error(message, { id: message })
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        // Transient failures (network drop, rate limit 429, server error / restart)
        // are retried up to 3 times with growing delays, so a short outage never
        // reaches the user. Real answers (401/403/404/validation) are not retried.
        retry: (failureCount, error) => failureCount < 3 && isTransientError(error),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* dir="auto" (not a fixed locale) — this sits above the [locale]
          segment in app/layout.tsx, so next-intl's locale context isn't
          available here to read directly. */}
      <Toaster richColors closeButton duration={5000} position="top-center" dir="auto" />
    </QueryClientProvider>
  )
}