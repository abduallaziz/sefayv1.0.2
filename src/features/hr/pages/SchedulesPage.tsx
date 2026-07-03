'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { useSchedules, useCreateSchedule, useDeleteSchedule } from '../hooks/useHr'
import { useUsers } from '@/features/users/hooks/useUsers'

export function SchedulesPage() {
  const t = useTranslations('schedules')
  const { data: schedules = [], isLoading } = useSchedules()
  const { data: users = [] } = useUsers()
  const { mutate: createSchedule, isPending: creating } = useCreateSchedule()
  const { mutate: deleteSchedule } = useDeleteSchedule()

  const [showForm, setShowForm] = useState(false)
  const [userId, setUserId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [error, setError] = useState<string | null>(null)

  const handleCreate = () => {
    if (!userId || !date) return
    setError(null)
    createSchedule(
      { user_id: userId, scheduled_date: date, start_time: startTime, end_time: endTime },
      {
        onSuccess: () => {
          setShowForm(false)
          setUserId('')
          setDate('')
        },
        onError: (e: any) => setError(e?.message ?? t('error')),
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('addSchedule')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('employee')}</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
              >
                <option value="">{t('selectEmployee')}</option>
                {(users as any[]).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('date')}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('startTime')}</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('endTime')}</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={creating || !userId || !date}
            className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {creating ? t('saving') : t('save')}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-800 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('upcoming')}</h2>
        </div>
        {isLoading ? (
          <div className="p-4 h-20 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
        ) : schedules.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">{t('noSchedules')}</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.user_name}</p>
                  <p className="text-xs text-slate-400">
                    {s.scheduled_date} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  </p>
                </div>
                <button
                  onClick={() => deleteSchedule(s.id)}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
