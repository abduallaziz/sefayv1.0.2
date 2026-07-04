'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { CalendarClock, LogIn, LogOut } from 'lucide-react'
import { useMyAttendance, useCheckIn, useCheckOut } from '../hooks/useHr'
import { useAuthStore } from '@/core/auth/stores/auth.store'

export function AttendancePage() {
  const t = useTranslations('attendance')
  const { user } = useAuthStore()
  const { data: records = [], isLoading } = useMyAttendance()
  const { mutate: checkIn, isPending: checkingIn } = useCheckIn()
  const { mutate: checkOut, isPending: checkingOut } = useCheckOut()
  const [error, setError] = useState<string | null>(null)

  const openRecord = useMemo(() => records.find((r) => r.check_out_at === null) ?? null, [records])

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
        {isLoading ? (
          <div className="p-4 h-20 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
        ) : records.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">{t('noRecords')}</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{fmtDateTime(r.check_in_at)}</p>
                  <p className="text-xs text-slate-400">
                    {r.check_out_at ? t('checkedOutAt', { time: fmtDateTime(r.check_out_at) }) : t('stillOpen')}
                  </p>
                </div>
                {r.hours_worked !== null && (
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('hoursWorked', { hours: r.hours_worked })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
