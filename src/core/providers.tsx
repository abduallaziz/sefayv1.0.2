'use client'

import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        console.error(`[Query Error] ${query.queryKey.join('/')}:`, error)
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* dir="auto" (not a fixed locale) — this sits above the [locale]
          segment in app/layout.tsx, so next-intl's locale context isn't
          available here to read directly. */}
      <Toaster richColors position="top-center" dir="auto" />
    </QueryClientProvider>
  )
}