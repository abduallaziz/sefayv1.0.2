'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { CalendarClock, LogIn, LogOut, Circle, History, X } from 'lucide-react'
import { useMyAttendance, useCheckIn, useCheckOut, useAllAttendance } from '../hooks/useHr'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { DateRangePicker } from '@/shared/ui/date-range-picker'

export function AttendancePage() {
  const t = useTranslations('attendance')
  const { user } = useAuthStore()
  const canViewAll = !!user?.permissions?.includes('attendance.view.all')
  const { data: records = [], isLoading } = useMyAttendance()
  const { mutate: checkIn, isPending: checkingIn } = useCheckIn()
  const { mutate: checkOut, isPending: checkingOut } = useCheckOut()
  const [error, setError] = useState<string | null>(null)
  const [showMyHistory, setShowMyHistory] = useState(false)

  const openRecord = useMemo(() => records.find((r) => r.check_out_at === null) ?? null, [records])
  const latestRecord = records[0] ?? null

  const handleCheckIn = () => {
    setError(null)
    checkIn(user?.branchId, { onError: (e: any) => setError(e?.message ?? t('error')) })
  }

  const handleCheckOut = () => {
    setError(null)
    checkOut(undefined, { onError: (e: any) => setError(e?.message ?? t('error')) })
  }

  const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 text-center">
        {openRecord ? (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('checkedInAt')}</p>
            <p className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{fmtDateTime(openRecord.check_in_at)}</p>
            <button
              onClick={handleCheckOut}
              disabled={checkingOut}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {checkingOut ? t('processing') : t('checkOut')}
            </button>
          </>
        ) : (
          <>
            <CalendarClock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('notCheckedIn')}</p>
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-xl font-bold transition-colors"
            >
              <LogIn className="w-5 h-5" />
              {checkingIn ? t('processing') : t('checkIn')}
            </button>
          </>
        )}
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-800">
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('history')}</h2>
        </div>
        {canViewAll ? (
          <AllEmployeesAttendance t={t} fmtDateTime={fmtDateTime} />
        ) : (
          <>
            <AttendanceList
              records={latestRecord ? [latestRecord] : []}
              isLoading={isLoading}
              showName={false}
              t={t}
              fmtDateTime={fmtDateTime}
            />
            {records.length > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-gray-800 text-center">
                <button
                  onClick={() => setShowMyHistory(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700 text-[#0C447C] dark:text-[#5B9BD5] hover:bg-slate-50 dark:hover:bg-gray-800 mx-auto"
                >
                  <History className="w-3.5 h-3.5" />
                  {t('viewHistory')}
                </button>
              </div>
            )}
            {showMyHistory && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowMyHistory(false)}>
                <div
                  className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{t('history')}</h2>
                    <button onClick={() => setShowMyHistory(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="overflow-y-auto">
                    <AttendanceList records={records} isLoading={isLoading} showName={false} t={t} fmtDateTime={fmtDateTime} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AllEmployeesAttendance({
  t,
  fmtDateTime,
}: {
  t: ReturnType<typeof useTranslations>
  fmtDateTime: (iso: string) => string
}) {
  const { data: records = [], isLoading } = useAllAttendance()
  const [historyUser, setHistoryUser] = useState<{ id: string; name: string } | null>(null)

  const latestPerEmployee = useMemo(() => {
    const byUser = new Map<string, (typeof records)[number]>()
    for (const r of records) {
      if (!byUser.has(r.user_id)) byUser.set(r.user_id, r)
    }
    return Array.from(byUser.values())
  }, [records])

  if (isLoading) return <div className="p-4 h-20 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
  if (latestPerEmployee.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">{t('noRecords')}</p>
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-gray-800">
            <th className="w-1/3 text-right px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('employee')}</th>
            <th className="w-1/3 text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('workHours')}</th>
            <th className="w-1/3 text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('history')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
          {latestPerEmployee.map((r) => (
            <tr key={r.user_id}>
              <td className="px-4 py-3 align-middle">
                <p className="font-semibold text-slate-800 dark:text-white mb-1.5">{r.user_name}</p>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-md px-1.5 py-1">
                    <div className="w-4 h-4 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <LogIn className="w-2.5 h-2.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 leading-tight">{t('checkIn')}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">{fmtDateTime(r.check_in_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md px-1.5 py-1">
                    <div className="w-4 h-4 shrink-0 rounded-full bg-red-500 flex items-center justify-center text-white">
                      <LogOut className="w-2.5 h-2.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-red-700 dark:text-red-400 leading-tight">{t('checkOut')}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                        {r.check_out_at ? fmtDateTime(r.check_out_at) : t('stillOpen')}
                      </p>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-center align-middle">
                <div className="inline-flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 min-w-[90px]">
                  <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {r.hours_worked !== null ? (
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('hoursWorked', { hours: r.hours_worked })}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-500">{t('stillOpen')}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-center align-middle">
                <button
                  onClick={() => setHistoryUser({ id: r.user_id, name: r.user_name ?? '' })}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700 text-[#0C447C] dark:text-[#5B9BD5] hover:bg-slate-50 dark:hover:bg-gray-800"
                >
                  <History className="w-3.5 h-3.5" />
                  {t('viewHistory')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {historyUser && (
        <EmployeeHistoryModal user={historyUser} onClose={() => setHistoryUser(null)} t={t} fmtDateTime={fmtDateTime} />
      )}
    </>
  )
}

function EmployeeHistoryModal({
  user,
  onClose,
  t,
  fmtDateTime,
}: {
  user: { id: string; name: string }
  onClose: () => void
  t: ReturnType<typeof useTranslations>
  fmtDateTime: (iso: string) => string
}) {
  const [range, setRange] = useState<{ from: string | undefined; to: string | undefined }>({ from: undefined, to: undefined })
  const { data: records = [], isLoading } = useAllAttendance({
    userId: user.id,
    from: range.from,
    to: range.to ? `${range.to}T23:59:59` : undefined,
  })
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{user.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-800">
          <DateRangePicker className="w-full" value={range} onChange={setRange} />
        </div>
        <div className="overflow-y-auto">
          <AttendanceList records={records} isLoading={isLoading} showName={false} t={t} fmtDateTime={fmtDateTime} />
        </div>
      </div>
    </div>
  )
}

function AttendanceList({
  records,
  isLoading,
  showName,
  t,
  fmtDateTime,
}: {
  records: { id: string; user_name?: string | null; check_in_at: string; check_out_at: string | null; hours_worked: number | null }[]
  isLoading: boolean
  showName: boolean
  t: ReturnType<typeof useTranslations>
  fmtDateTime: (iso: string) => string
}) {
  if (isLoading) return <div className="p-4 h-20 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
  if (records.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">{t('noRecords')}</p>
  }
  return (
    <div className="divide-y divide-slate-100 dark:divide-gray-800">
      {records.map((r) => (
        <div key={r.id} className="flex items-center justify-between px-4 py-3">
          <div className="space-y-1">
            {showName && r.user_name && (
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{r.user_name}</p>
            )}
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Circle className="w-2 h-2 fill-current" />
              {fmtDateTime(r.check_in_at)}
            </p>
            {r.check_out_at ? (
              <p className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
                <Circle className="w-2 h-2 fill-current" />
                {fmtDateTime(r.check_out_at)}
              </p>
            ) : (
              <p className="text-xs text-amber-500">{t('stillOpen')}</p>
            )}
          </div>
          {r.hours_worked !== null && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('hoursWorked', { hours: r.hours_worked })}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
