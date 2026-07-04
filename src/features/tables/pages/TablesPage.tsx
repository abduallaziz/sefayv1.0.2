'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Plus, CalendarCheck, Users as UsersIcon } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { TableCard } from '../components/TableCard'
import { CreateTableModal } from '../components/CreateTableModal'
import { DineInModal } from '../components/DineInModal'
import { useTablesList, useReservations, useWaitlist, useCreateWaitlistEntry, useSeatWaitlistEntry, useCancelWaitlistEntry, useCreateReservation } from '../hooks/useTables'
import type { RestaurantTable } from '../api/tables.api'

export function TablesPage() {
  const t = useTranslations('tables')
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'tables' | 'reservations' | 'waitlist'>('tables')
  const [showCreate, setShowCreate] = useState(false)
  const [activeTable, setActiveTable] = useState<RestaurantTable | null>(null)

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.get('/branches') as any,
    enabled: !!user,
  })
  const branchId = user?.branchId ?? (branches as any)?.[0]?.id ?? ''

  const { data: tables = [], isLoading: tablesLoading } = useTablesList(branchId)
  const { data: reservations = [], isLoading: reservationsLoading } = useReservations()
  const { data: waitlist = [], isLoading: waitlistLoading } = useWaitlist(branchId, 'waiting')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
        </div>
        {tab === 'tables' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('newTable')}
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['tables', 'reservations', 'waitlist'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === tb
                ? 'border-[#0C447C] text-[#0C447C] dark:text-[#5B9BD5]'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            }`}
          >
            {t(`tabs.${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'tables' && (
        tablesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : tables.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-12 text-center">{t('noTables')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {tables.map((table) => (
              <TableCard key={table.id} table={table} onClick={() => setActiveTable(table)} />
            ))}
          </div>
        )
      )}

      {tab === 'reservations' && (
        <ReservationsTab reservations={reservations} isLoading={reservationsLoading} tables={tables} />
      )}

      {tab === 'waitlist' && (
        <WaitlistTab entries={waitlist} isLoading={waitlistLoading} branchId={branchId} tables={tables} />
      )}

      {showCreate && <CreateTableModal branchId={branchId} onClose={() => setShowCreate(false)} />}
      {activeTable && <DineInModal table={activeTable} onClose={() => setActiveTable(null)} />}
    </div>
  )
}

function ReservationsTab({ reservations, isLoading, tables }: { reservations: any[]; isLoading: boolean; tables: RestaurantTable[] }) {
  const t = useTranslations('tables')
  const [showAdd, setShowAdd] = useState(false)
  const [tableId, setTableId] = useState('')
  const [name, setName] = useState('')
  const [partySize, setPartySize] = useState('2')
  const [dateTime, setDateTime] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { mutate: create, isPending: creating } = useCreateReservation()

  const handleAdd = () => {
    if (!name.trim() || !tableId || !dateTime) return
    setError(null)
    create(
      {
        table_id: tableId,
        customer_name: name.trim(),
        party_size: parseInt(partySize, 10) || 1,
        reservation_time: new Date(dateTime).toISOString(),
      },
      {
        onSuccess: () => { setName(''); setTableId(''); setDateTime(''); setShowAdd(false) },
        onError: (e: any) => setError(e?.message ?? t('error')),
      },
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        {t('newReservation')}
      </button>

      {showAdd && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="">{t('selectTable')}</option>
              {tables.map((tb) => (
                <option key={tb.id} value={tb.id}>{tb.name}</option>
              ))}
            </select>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('customerName')}
              className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
            <input
              type="number"
              min={1}
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={handleAdd}
            disabled={creating || !name.trim() || !tableId || !dateTime}
            className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {creating ? t('saving') : t('save')}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      ) : reservations.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-12 text-center">{t('noReservations')}</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
          {reservations.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <CalendarCheck className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{r.customer_name} — {r.table_name}</p>
                  <p className="text-xs text-gray-400">{new Date(r.reservation_time).toLocaleString('en-US')} · {r.party_size} {t('guests')}</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{t(`reservationStatus.${r.status}`)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WaitlistTab({ entries, isLoading, branchId, tables }: { entries: any[]; isLoading: boolean; branchId: string; tables: RestaurantTable[] }) {
  const t = useTranslations('tables')
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [partySize, setPartySize] = useState('2')
  const { mutate: create, isPending: creating } = useCreateWaitlistEntry()
  const { mutate: seat } = useSeatWaitlistEntry()
  const { mutate: cancel } = useCancelWaitlistEntry()

  const availableTables = tables.filter((tb) => tb.status === 'available')

  const handleAdd = () => {
    if (!name.trim()) return
    create(
      { branch_id: branchId, customer_name: name.trim(), party_size: parseInt(partySize, 10) || 1 },
      { onSuccess: () => { setName(''); setShowAdd(false) } },
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        {t('addToWaitlist')}
      </button>

      {showAdd && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex gap-2 flex-wrap">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('customerName')}
            className="flex-1 min-w-[160px] bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
          />
          <input
            type="number"
            min={1}
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            className="w-20 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
          />
          <button
            onClick={handleAdd}
            disabled={creating || !name.trim()}
            className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {creating ? t('saving') : t('save')}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">{t('waitlistEmpty')}</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <UsersIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{e.customer_name}</p>
                  <p className="text-xs text-gray-400">{e.party_size} {t('guests')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {availableTables.length > 0 && (
                  <select
                    onChange={(ev) => { if (ev.target.value) seat({ id: e.id, tableId: ev.target.value }) }}
                    defaultValue=""
                    className="text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300"
                  >
                    <option value="" disabled>{t('seatAt')}</option>
                    {availableTables.map((tb) => (
                      <option key={tb.id} value={tb.id}>{tb.name}</option>
                    ))}
                  </select>
                )}
                <button onClick={() => cancel(e.id)} className="text-xs text-red-500 hover:text-red-600">{t('cancel')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
