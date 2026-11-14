'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus, CalendarCheck, Pencil, Trash2, LogIn, X, UserX, RotateCcw } from 'lucide-react'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'
import { formatDateTime } from '@/lib/format'
import { useReservations, useUpdateReservation, useDeleteReservation } from '../hooks/useTables'
import type { RestaurantTable, Reservation } from '../api/tables.api'
import { ReservationDialog } from './ReservationDialog'
import { SimpleSelect } from './SimpleSelect'

type Pending = { kind: 'cancelled' | 'no_show' | 'delete'; r: Reservation }
type SortMode = 'upcoming' | 'asc' | 'desc'

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  seated: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
  no_show: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
}

function dayBounds(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number)
  return {
    from: new Date(y, m - 1, d, 0, 0, 0, 0).toISOString(),
    to: new Date(y, m - 1, d, 23, 59, 59, 999).toISOString(),
  }
}

const ICON_BTN =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'

export function ReservationsTab({ tables }: { tables: RestaurantTable[] }) {
  const t = useTranslations('tables')
  const locale = useLocale()
  const [statusFilter, setStatusFilter] = useState('all')
  const [tableFilter, setTableFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [sort, setSort] = useState<SortMode>('upcoming')
  const [dialog, setDialog] = useState<{ reservation?: Reservation } | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [now] = useState(() => Date.now())

  const filters = useMemo(
    () => ({
      status: statusFilter === 'all' ? undefined : statusFilter,
      tableId: tableFilter === 'all' ? undefined : tableFilter,
      ...(dateFilter ? dayBounds(dateFilter) : {}),
    }),
    [statusFilter, tableFilter, dateFilter],
  )
  const { data = [], isLoading } = useReservations(filters)
  const { mutate: update, isPending: updating } = useUpdateReservation()
  const { mutate: remove, isPending: deleting } = useDeleteReservation()

  const rows = useMemo(() => {
    const list = [...data]
    const ts = (r: Reservation) => new Date(r.reservation_time).getTime()
    if (sort === 'asc') return list.sort((a, b) => ts(a) - ts(b))
    if (sort === 'desc') return list.sort((a, b) => ts(b) - ts(a))
    const future = list.filter((r) => ts(r) >= now).sort((a, b) => ts(a) - ts(b))
    const past = list.filter((r) => ts(r) < now).sort((a, b) => ts(b) - ts(a))
    return [...future, ...past]
  }, [data, sort, now])

  const setStatus = (r: Reservation, status: string, okMessage?: string) =>
    update(
      { id: r.id, data: { status } },
      { onSuccess: () => okMessage && toast.success(okMessage), onSettled: () => setPending(null) },
    )

  const runPending = () => {
    if (!pending) return
    if (pending.kind === 'delete') {
      remove(pending.r.id, { onSettled: () => setPending(null) })
    } else {
      setStatus(pending.r, pending.kind)
    }
  }

  const statusOptions = [
    { value: 'all', label: t('res.allStatuses') },
    ...(['confirmed', 'seated', 'cancelled', 'no_show'] as const).map((s) => ({ value: s, label: t(`reservationStatus.${s}`) })),
  ]
  const tableOptions = [{ value: 'all', label: t('res.allTables') }, ...tables.map((tb) => ({ value: tb.id, label: tb.name }))]
  const sortOptions = (['upcoming', 'asc', 'desc'] as const).map((s) => ({ value: s, label: t(`res.sort.${s}`) }))
  const hasFilters = statusFilter !== 'all' || tableFilter !== 'all' || !!dateFilter

  const confirmCopy = pending
    ? {
        title: t(`res.confirm.${pending.kind}Title`),
        message: t(`res.confirm.${pending.kind}Message`, { name: pending.r.customer_name }),
        label: t(`res.confirm.${pending.kind}Label`),
      }
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <button
          onClick={() => setDialog({})}
          className="flex items-center gap-2 rounded-lg bg-[#0C447C] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3a6b]"
        >
          <Plus className="h-4 w-4" />
          {t('newReservation')}
        </button>
        <div className="w-40">
          <SimpleSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} ariaLabel={t('res.filterStatus')} />
        </div>
        <div className="w-40">
          <SimpleSelect value={tableFilter} onChange={setTableFilter} options={tableOptions} ariaLabel={t('res.filterTable')} />
        </div>
        <div className="w-48">
          <SingleDatePicker value={dateFilter || undefined} onChange={(v) => setDateFilter(v ?? '')} placeholder={t('res.filterDate')} />
        </div>
        <div className="w-44">
          <SimpleSelect value={sort} onChange={(v) => setSort(v as SortMode)} options={sortOptions} ariaLabel={t('res.sortLabel')} />
        </div>
        {hasFilters && (
          <button
            onClick={() => { setStatusFilter('all'); setTableFilter('all'); setDateFilter('') }}
            className="px-2 py-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            {t('res.clearFilters')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="h-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">{hasFilters ? t('res.noResults') : t('noReservations')}</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <CalendarCheck className="h-4 w-4 shrink-0 text-gray-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
                    {r.customer_name} — {r.table_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDateTime(r.reservation_time, locale)} · {r.party_size} {t('guests')}
                    {r.customer_phone ? <span dir="ltr"> · {r.customer_phone}</span> : null}
                  </p>
                  {r.notes && <p className="truncate text-xs text-gray-400">{r.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`rounded-full px-2 py-1 text-xs ${STATUS_STYLES[r.status] ?? ''}`}>{t(`reservationStatus.${r.status}`)}</span>
                {r.status === 'confirmed' && (
                  <>
                    <button className={ICON_BTN} disabled={updating} onClick={() => setStatus(r, 'seated', t('res.seatedOk'))} aria-label={t('res.seat')} title={t('res.seat')}>
                      <LogIn className="h-4 w-4" />
                    </button>
                    <button className={ICON_BTN} onClick={() => setDialog({ reservation: r })} aria-label={t('res.edit')} title={t('res.edit')}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className={ICON_BTN} onClick={() => setPending({ kind: 'cancelled', r })} aria-label={t('res.cancel')} title={t('res.cancel')}>
                      <X className="h-4 w-4" />
                    </button>
                    <button className={ICON_BTN} onClick={() => setPending({ kind: 'no_show', r })} aria-label={t('res.noShow')} title={t('res.noShow')}>
                      <UserX className="h-4 w-4" />
                    </button>
                  </>
                )}
                {(r.status === 'cancelled' || r.status === 'no_show') && (
                  <button className={ICON_BTN} disabled={updating} onClick={() => setStatus(r, 'confirmed')} aria-label={t('res.reconfirm')} title={t('res.reconfirm')}>
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                {r.status !== 'seated' && (
                  <button className={`${ICON_BTN} hover:text-red-600`} onClick={() => setPending({ kind: 'delete', r })} aria-label={t('res.delete')} title={t('res.delete')}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {dialog && <ReservationDialog tables={tables} reservation={dialog.reservation} onClose={() => setDialog(null)} />}
      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={runPending}
        isLoading={updating || deleting}
        title={confirmCopy?.title ?? ''}
        message={confirmCopy?.message ?? ''}
        confirmLabel={confirmCopy?.label ?? ''}
        cancelLabel={t('back')}
      />
    </div>
  )
}
