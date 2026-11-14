'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus, Users as UsersIcon } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { parseIntStrict, toEnglishDigits } from '@/lib/digits'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { NumberInput } from '@/shared/ui/number-input/NumberInput'
import { useWaitlist, useCreateWaitlistEntry, useSeatWaitlistEntry, useCancelWaitlistEntry } from '../hooks/useTables'
import type { RestaurantTable, WaitlistEntry } from '../api/tables.api'
import { SimpleSelect } from './SimpleSelect'

const MAX_PARTY = 1000
const FIELD =
  'bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white'

export function WaitlistTab({ branchId, tables }: { branchId: string; tables: RestaurantTable[] }) {
  const t = useTranslations('tables')
  const { data: entries = [], isLoading } = useWaitlist(branchId, 'waiting')
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [partySize, setPartySize] = useState('2')
  const [quoted, setQuoted] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<WaitlistEntry | null>(null)
  const [seatTarget, setSeatTarget] = useState<{ entry: WaitlistEntry; table: RestaurantTable } | null>(null)
  // wait-time display ticks every 30s
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  const { mutate: create, isPending: creating } = useCreateWaitlistEntry()
  const { mutate: seat, isPending: seating } = useSeatWaitlistEntry()
  const { mutate: cancel, isPending: cancelling } = useCancelWaitlistEntry()

  const party = parseIntStrict(partySize)
  const partyValid = party !== null && party >= 1 && party <= MAX_PARTY
  const quotedNum = quoted === '' ? undefined : parseIntStrict(quoted)
  const quotedValid = quoted === '' || (quotedNum !== null && quotedNum !== undefined && quotedNum <= 1440)
  const availableTables = tables.filter((tb) => tb.status === 'available')

  const handleAdd = () => {
    if (creating || !name.trim() || !partyValid || !quotedValid) return
    setError(null)
    create(
      {
        branch_id: branchId,
        customer_name: name.trim(),
        customer_phone: phone.trim() || undefined,
        party_size: party as number,
        quoted_wait_minutes: quotedNum ?? undefined,
      },
      {
        onSuccess: () => { setName(''); setPhone(''); setQuoted(''); setPartySize('2'); setShowAdd(false) },
        onError: (e: unknown) => setError(e instanceof ApiError ? e.message : t('error')),
      },
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center gap-2 rounded-lg bg-[#0C447C] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3a6b]"
      >
        <Plus className="h-4 w-4" />
        {t('addToWaitlist')}
      </button>

      {showAdd && (
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder={t('customerName')}
              aria-label={t('customerName')}
              className={`min-w-[160px] flex-1 ${FIELD}`}
            />
            <input
              value={phone}
              onChange={(e) => setPhone(toEnglishDigits(e.target.value))}
              maxLength={30}
              inputMode="tel"
              dir="ltr"
              placeholder={t('res.phone')}
              aria-label={t('res.phone')}
              className={`w-40 ${FIELD}`}
            />
            <NumberInput
              allowDecimal={false}
              value={partySize}
              onChange={setPartySize}
              maxLength={4}
              aria-label={t('res.party')}
              aria-invalid={!partyValid}
              className={`w-20 ${FIELD}`}
            />
            <NumberInput
              allowDecimal={false}
              value={quoted}
              onChange={setQuoted}
              maxLength={4}
              placeholder={t('wl.quotedWait')}
              aria-label={t('wl.quotedWait')}
              className={`w-36 ${FIELD}`}
            />
            <button
              onClick={handleAdd}
              disabled={creating || !name.trim() || !partyValid || !quotedValid}
              className="rounded-lg bg-[#0C447C] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3a6b] disabled:opacity-50"
            >
              {creating ? t('saving') : t('save')}
            </button>
          </div>
          {!partyValid && <p className="text-xs text-red-500">{t('res.partyRange', { max: MAX_PARTY })}</p>}
          {!quotedValid && <p className="text-xs text-red-500">{t('wl.quotedRange')}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}

      {isLoading ? (
        <div className="h-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{t('waitlistEmpty')}</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
          {entries.map((e) => {
            const waited = Math.max(0, Math.floor((now - new Date(e.created_at).getTime()) / 60000))
            const fitting = availableTables.filter((tb) => tb.capacity >= e.party_size)
            return (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <UsersIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{e.customer_name}</p>
                    <p className="text-xs text-gray-400">
                      {e.party_size} {t('guests')}
                      {e.customer_phone ? <span dir="ltr"> · {e.customer_phone}</span> : null}
                      {' · '}
                      {t('wl.waited', { minutes: waited })}
                      {e.quoted_wait_minutes != null ? ` · ${t('wl.quoted', { minutes: e.quoted_wait_minutes })}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {fitting.length > 0 ? (
                    <div className="w-44">
                      <SimpleSelect
                        value=""
                        onChange={(id) => {
                          const table = fitting.find((tb) => tb.id === id)
                          if (table) setSeatTarget({ entry: e, table })
                        }}
                        placeholder={t('seatAt')}
                        ariaLabel={t('seatAt')}
                        className="h-8 text-xs"
                        options={fitting.map((tb) => ({ value: tb.id, label: `${tb.name} (${tb.capacity})` }))}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">{t('wl.noFitting')}</span>
                  )}
                  <button onClick={() => setCancelTarget(e)} className="text-xs text-red-500 hover:text-red-600">
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancel(cancelTarget.id, { onSettled: () => setCancelTarget(null) })}
        isLoading={cancelling}
        title={t('wl.cancelTitle')}
        message={t('wl.cancelMessage', { name: cancelTarget?.customer_name ?? '' })}
        confirmLabel={t('wl.cancelLabel')}
        cancelLabel={t('back')}
      />
      <ConfirmDialog
        open={!!seatTarget}
        onClose={() => setSeatTarget(null)}
        onConfirm={() =>
          seatTarget &&
          seat(
            { id: seatTarget.entry.id, tableId: seatTarget.table.id },
            {
              onSuccess: () => toast.success(t('wl.seatedOk')),
              onSettled: () => setSeatTarget(null),
            },
          )
        }
        isLoading={seating}
        variant="warning"
        title={t('wl.seatTitle')}
        message={t('wl.seatMessage', {
          name: seatTarget?.entry.customer_name ?? '',
          party: seatTarget?.entry.party_size ?? 0,
          table: seatTarget?.table.name ?? '',
        })}
        confirmLabel={t('wl.seatLabel')}
        cancelLabel={t('back')}
      />
    </div>
  )
}
