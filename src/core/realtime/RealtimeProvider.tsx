'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabaseRealtime } from '@/lib/supabase-realtime'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useRealtimeStatusStore } from './realtime-status.store'

/**
 * Mounted once per authenticated session (DashboardLayout) — subscribes to Postgres
 * Changes on tables/orders/order_items for the current tenant and invalidates the
 * matching React Query caches, so every screen showing that data (Tables, the open
 * table's current order, Kitchen Display) updates the instant a change commits,
 * without any component needing to poll.
 *
 * order_items has no tenant_id column, so its subscription can't be narrowed by a
 * client-side `filter` the way tables/orders can — RLS (see migrations 073/074) is
 * what actually restricts which rows this connection ever receives; the client-side
 * filters on tables/orders are just a narrowing optimization on top of that, not the
 * security boundary.
 */
export function RealtimeProvider() {
  const qc = useQueryClient()
  const tenantId = useAuthStore((s) => s.user?.tenantId)
  const setConnected = useRealtimeStatusStore((s) => s.setConnected)

  useEffect(() => {
    if (!tenantId) {
      setConnected(false)
      return
    }

    const invalidateOrderQueries = () => {
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'tables' && q.queryKey[2] === 'order' })
    }

    const channel = supabaseRealtime
      .channel(`tenant-${tenantId}-pos`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables', filter: `tenant_id=eq.${tenantId}` },
        () => qc.invalidateQueries({ queryKey: ['tables'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
        () => {
          qc.invalidateQueries({ queryKey: ['tables'] })
          qc.invalidateQueries({ queryKey: ['kitchen'] })
          invalidateOrderQueries()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          qc.invalidateQueries({ queryKey: ['kitchen'] })
          invalidateOrderQueries()
        },
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabaseRealtime.removeChannel(channel)
      setConnected(false)
    }
  }, [tenantId, qc, setConnected])

  return null
}
