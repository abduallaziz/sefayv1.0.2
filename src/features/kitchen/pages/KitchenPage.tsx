'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChefHat, ArrowRight, RefreshCw } from 'lucide-react'
import { useBranchContext } from '@/core/branch/useBranchContext'
import { formatTime } from '@/lib/format'
import { useKitchenOrders, useUpdateKitchenItemStatus } from '../hooks/useKitchen'

const FILTERS = ['all', 'pending', 'preparing', 'ready'] as const
type Filter = (typeof FILTERS)[number]
const NEXT_STATUS: Record<string, string> = { pending: 'preparing', preparing: 'ready', ready: 'served' }
const LATE_AFTER_MINUTES = 15

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  preparing: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  ready: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
}

export function KitchenPage() {
  const t = useTranslations('kitchen')
  const locale = useLocale()

  // The branch the user actually selected (shared branch context), not just
  // the newest branch in the list. Wait for it so the board is fetched once, already filtered.
  const { currentBranchId, isLoading: branchLoading } = useBranchContext()
  const branchId = currentBranchId ?? ''

  const { data: orders = [], isLoading, isFetching, dataUpdatedAt, refetch } = useKitchenOrders(branchId || undefined, !branchLoading)
  const { mutate: updateStatus, isPending: updating } = useUpdateKitchenItemStatus()
  const [filter, setFilter] = useState<Filter>('all')

  // live elapsed time: re-render every 15s
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(id)
  }, [])

  const tickets = useMemo(
    () =>
      orders
        .map((o) => {
          const items = o.items.filter((i) => i.kitchen_status !== ('served' as string))
          const oldest = items.reduce((min, i) => Math.min(min, new Date(i.created_at).getTime()), Number.POSITIVE_INFINITY)
          return { order: o, items, since: Number.isFinite(oldest) ? oldest : new Date(o.created_at).getTime() }
        })
        .filter((x) => x.items.length > 0)
        .map((x) => ({ ...x, visible: filter === 'all' ? x.items : x.items.filter((i) => i.kitchen_status === filter) }))
        .filter((x) => x.visible.length > 0)
        .sort((a, b) => a.since - b.since),
    [orders, filter],
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, pending: 0, preparing: 0, ready: 0 }
    for (const o of orders) {
      for (const i of o.items) {
        if (c[i.kitchen_status] !== undefined) {
          c[i.kitchen_status] += 1
          c.all += 1
        }
      }
    }
    return c
  }, [orders])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-gray-400" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dataUpdatedAt > 0 && (
            <span className="text-xs text-gray-400">{t('updatedAt', { time: formatTime(new Date(dataUpdatedAt).toISOString(), locale) })}</span>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label={t('refresh')}
            title={t('refresh')}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t('filterLabel')}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              filter === f
                ? 'border-[#0C447C] bg-[#0C447C] text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {f === 'all' ? t('filterAll') : t(`status.${f}`)} ({counts[f]})
          </button>
        ))}
      </div>

      {isLoading || branchLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : tickets.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          {filter === 'all' ? t('emptyAll') : t('emptyFiltered')}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map(({ order, visible, since }) => {
            const minutes = Math.max(0, Math.floor((now - since) / 60000))
            const late = minutes >= LATE_AFTER_MINUTES
            return (
              <div
                key={order.order_id}
                className={`rounded-xl border-2 bg-white p-4 dark:bg-gray-800 ${late ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-gray-700'}`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">{order.table_name ?? t('noTable')}</h2>
                    <p className="text-xs text-gray-400">{formatTime(new Date(since).toISOString(), locale)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${late ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {minutes === 0 ? t('justNow') : t('elapsed', { minutes })}
                  </span>
                </div>
                <div className="space-y-2">
                  {visible.map((item) => (
                    <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-700 dark:text-gray-200">{item.item_name} × {item.qty}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[item.kitchen_status] ?? ''}`}>
                          {t(`itemStatus.${item.kitchen_status}`)}
                        </span>
                      </div>
                      <button
                        onClick={() => updateStatus({ itemId: item.id, status: NEXT_STATUS[item.kitchen_status] })}
                        disabled={updating}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-[#0C447C] py-1.5 text-xs font-medium text-white hover:bg-[#0a3a6b] disabled:opacity-60"
                      >
                        {t(`advanceTo.${NEXT_STATUS[item.kitchen_status]}`)}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
