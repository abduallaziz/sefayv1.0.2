'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { FileText, Package, Search, User, CornerDownLeft } from 'lucide-react'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useBusinessType } from '@/shared/hooks/useBusinessType'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { customersApi } from '@/features/customers/api/customers.api'
import { itemsApi } from '@/features/items/api/items.api'
import { fetchOrders } from '@/features/orders/api/orders.api'
import { ALL_NAV_ITEMS, INVENTORY_GROUP_ITEMS } from './DashboardSidebar'

interface Result {
  key: string
  kind: 'page' | 'order' | 'customer' | 'item'
  label: string
  hint?: string
  href: string
}

const norm = (s: string) => s.toLowerCase().trim()

/** Header search box + Ctrl/Cmd+K palette: pages, orders (invoice no), customers, items. */
export function GlobalSearch({ variant }: { variant: 'icon' | 'bar' }) {
  const t = useTranslations('header')
  const ts = useTranslations('sidebar')
  const locale = useLocale()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { config } = useBusinessType()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [isMac] = useState(() => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform))
  const dq = useDebouncedValue(q, 300)

  useEffect(() => {
    if (variant !== 'bar') return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setQ('')
        setActive(0)
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [variant])

  const openPalette = () => {
    setQ('')
    setActive(0)
    setOpen(true)
  }

  const role = user?.role ?? 'cashier'
  const pages = useMemo<Result[]>(
    () =>
      [...ALL_NAV_ITEMS, ...INVENTORY_GROUP_ITEMS]
        .filter((i) => config.sidebar.includes(i.key) && (!i.roles || i.roles.includes(role)))
        .map((i) => ({ key: `p-${i.key}`, kind: 'page' as const, label: ts(i.key), href: i.href })),
    [config.sidebar, role, ts],
  )

  const term = norm(dq)
  const enabled = open && term.length >= 2
  const customers = useQuery({
    queryKey: ['global-search', 'customers', term],
    queryFn: () => customersApi.getAll(term),
    enabled,
    staleTime: 30_000,
  })
  const items = useQuery({
    queryKey: ['global-search', 'items', term],
    queryFn: () => itemsApi.getPaged({ search: term, perPage: 5 }),
    enabled,
    staleTime: 30_000,
  })
  const orders = useQuery({
    queryKey: ['global-search', 'orders'],
    queryFn: () => fetchOrders({}, { maxPages: 1 }),
    enabled,
    staleTime: 60_000,
  })

  const results = useMemo<Result[]>(() => {
    const tq = norm(q)
    const out: Result[] = pages.filter((p) => !tq || norm(p.label).includes(tq)).slice(0, 8)
    if (term.length >= 2) {
      let orderCount = 0
      for (const o of orders.data ?? []) {
        const no = o.invoice_no ?? ''
        if (no && norm(no).includes(term)) {
          out.push({ key: `o-${o.id}`, kind: 'order', label: no, hint: o.customer_name ?? undefined, href: '/dashboard/orders' })
          if (++orderCount >= 5) break
        }
      }
      for (const c of customers.data ?? []) {
        out.push({
          key: `c-${c.id}`,
          kind: 'customer',
          label: c.full_name || c.phone || c.plate_number || '-',
          hint: c.phone ?? c.plate_number ?? undefined,
          href: '/dashboard/customers',
        })
      }
      for (const it of items.data?.data ?? []) {
        out.push({ key: `i-${it.id}`, kind: 'item', label: it.name, hint: it.sku ?? undefined, href: '/dashboard/items' })
      }
    }
    return out
  }, [pages, q, term, orders.data, customers.data, items.data])

  const go = (r: Result) => {
    setOpen(false)
    router.push(`/${locale}${r.href}`)
  }

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      go(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const Icon = { page: CornerDownLeft, order: FileText, customer: User, item: Package }
  const kindLabel = { page: t('searchPages'), order: t('searchOrders'), customer: t('searchCustomers'), item: t('searchItems') }

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={openPalette}
          className="flex shrink-0 items-center justify-center rounded-lg border border-posCloud-border p-2 text-posCloud-text-tertiary hover:bg-slate-100 dark:border-posCloudDark-border dark:hover:bg-posCloudDark-border/40 lg:hidden"
          aria-label={t('search')}
        >
          <Search size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={openPalette}
          aria-label={t('search')}
          className="relative hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-posCloud-border bg-posCloud-background px-3 py-2 text-start md:flex md:max-w-xs lg:max-w-sm dark:border-posCloudDark-border dark:bg-posCloudDark-background"
        >
          <Search size={16} className="shrink-0 text-posCloud-text-tertiary" />
          <span className="flex-1 truncate text-sm text-posCloud-text-tertiary">{t('search')}</span>
          <kbd suppressHydrationWarning className="shrink-0 rounded-md border border-posCloud-border bg-posCloud-surface px-1.5 py-0.5 text-[10px] text-posCloud-text-tertiary dark:border-posCloudDark-border dark:bg-posCloudDark-surface">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>
      )}
      {open && (
        <div
          className="fixed inset-0 z-[1100] flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('search')}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-posCloud-border bg-posCloud-surface shadow-2xl dark:border-posCloudDark-border dark:bg-posCloudDark-surface"
          >
            <div className="flex items-center gap-2 border-b border-posCloud-border px-3 dark:border-posCloudDark-border">
              <Search size={16} className="shrink-0 text-posCloud-text-tertiary" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setActive(0)
                }}
                onKeyDown={onInputKey}
                placeholder={t('searchPlaceholder')}
                className="h-12 flex-1 bg-transparent text-sm text-posCloud-text-primary outline-none dark:text-posCloudDark-text-primary"
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-1.5">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-posCloud-text-tertiary">{t('searchNoResults')}</p>
              ) : (
                results.map((r, i) => {
                  const K = Icon[r.kind]
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(r)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm ${
                        i === active ? 'bg-slate-100 dark:bg-posCloudDark-border/40' : ''
                      }`}
                    >
                      <K size={15} className="shrink-0 text-posCloud-text-tertiary" />
                      <span className="flex-1 truncate text-posCloud-text-primary dark:text-posCloudDark-text-primary">{r.label}</span>
                      {r.hint && <span className="truncate text-xs text-posCloud-text-tertiary" dir="ltr">{r.hint}</span>}
                      <span className="shrink-0 text-[11px] text-posCloud-text-tertiary">{kindLabel[r.kind]}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
