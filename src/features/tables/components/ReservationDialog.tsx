'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ApiError } from '@/lib/api'
import { parseIntStrict, toEnglishDigits } from '@/lib/digits'
import { NumberInput } from '@/shared/ui/number-input/NumberInput'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'
import { useCreateReservation, useUpdateReservation } from '../hooks/useTables'
import type { RestaurantTable, Reservation } from '../api/tables.api'
import { DialogShell } from './DialogShell'
import { SimpleSelect } from './SimpleSelect'
import { TimeSelect } from './TimeSelect'

const MAX_PARTY = 1000
const FIELD =
  'w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white'

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function hm(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface Props {
  tables: RestaurantTable[]
  /** When set the dialog edits this (confirmed) reservation. */
  reservation?: Reservation
  onClose: () => void
}

export function ReservationDialog({ tables, reservation, onClose }: Props) {
  const t = useTranslations('tables')
  const create = useCreateReservation()
  const update = useUpdateReservation()
  const pending = create.isPending || update.isPending
  const [openedAt] = useState(() => Date.now())

  const initial = reservation ? new Date(reservation.reservation_time) : null
  const [tableId, setTableId] = useState(reservation?.table_id ?? '')
  const [name, setName] = useState(reservation?.customer_name ?? '')
  const [phone, setPhone] = useState(reservation?.customer_phone ?? '')
  const [notes, setNotes] = useState(reservation?.notes ?? '')
  const [partySize, setPartySize] = useState(String(reservation?.party_size ?? 2))
  const [date, setDate] = useState(initial ? ymd(initial) : '')
  const [time, setTime] = useState(initial ? hm(initial) : '19:00')
  const [error, setError] = useState<string | null>(null)

  const table = tables.find((x) => x.id === tableId)
  const party = parseIntStrict(partySize)
  const capacity = table?.capacity ?? MAX_PARTY
  const partyError =
    partySize === '' || party === null || party < 1 || party > MAX_PARTY
      ? t('res.partyRange', { max: MAX_PARTY })
      : party > capacity
        ? t('res.partyExceeds', { cap: capacity })
        : null
  const when = date ? new Date(`${date}T${time}`) : null
  const timeChanged = !reservation || !initial || !when || when.getTime() !== initial.getTime()
  const pastError = when && timeChanged && when.getTime() < openedAt ? t('res.pastTime') : null
  const valid = !!name.trim() && !!tableId && !!when && !partyError && !pastError

  const submit = () => {
    if (pending || !valid || !when) return
    if (timeChanged && when.getTime() < Date.now()) {
      setError(t('res.pastTime'))
      return
    }
    setError(null)
    const done = {
      onSuccess: () => onClose(),
      onError: (e: unknown) => setError(e instanceof ApiError ? e.message : t('error')),
    }
    const common = {
      customer_name: name.trim(),
      customer_phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      party_size: party as number,
    }
    if (reservation) {
      update.mutate(
        { id: reservation.id, data: { ...common, ...(timeChanged ? { reservation_time: when.toISOString() } : {}) } },
        done,
      )
    } else {
      create.mutate({ table_id: tableId, ...common, reservation_time: when.toISOString() }, done)
    }
  }

  return (
    <DialogShell title={reservation ? t('res.edit') : t('newReservation')} onClose={onClose} busy={pending} maxWidth="max-w-lg">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t('res.table')}</label>
          {reservation ? (
            <p className={FIELD}>{reservation.table_name}</p>
          ) : (
            <SimpleSelect
              value={tableId}
              onChange={setTableId}
              placeholder={t('selectTable')}
              ariaLabel={t('res.table')}
              options={tables.map((tb) => ({ value: tb.id, label: `${tb.name} (${tb.capacity})` }))}
            />
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">{t('customerName')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={FIELD} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">{t('res.phone')}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(toEnglishDigits(e.target.value))}
              maxLength={30}
              inputMode="tel"
              dir="ltr"
              className={FIELD}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">{t('res.date')}</label>
            <SingleDatePicker value={date || undefined} onChange={(v) => setDate(v ?? '')} min={ymd(new Date())} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">{t('res.time')}</label>
            <TimeSelect value={time} onChange={setTime} hourLabel={t('res.hour')} minuteLabel={t('res.minute')} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">{t('res.party')}</label>
            <NumberInput
              allowDecimal={false}
              value={partySize}
              onChange={setPartySize}
              maxLength={4}
              aria-invalid={!!partyError}
              className={FIELD}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t('res.notes')}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} className={FIELD} />
        </div>
        {partyError && <p className="text-xs text-red-500">{partyError}</p>}
        {pastError && <p className="text-xs text-red-500">{pastError}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <div className="flex gap-2 border-t border-gray-200 p-5 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300"
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !valid}
          className="flex-[2] rounded-xl bg-[#0C447C] py-2.5 text-sm font-bold text-white hover:bg-[#0a3a6b] disabled:opacity-50"
        >
          {pending ? t('saving') : t('save')}
        </button>
      </div>
    </DialogShell>
  )
}
