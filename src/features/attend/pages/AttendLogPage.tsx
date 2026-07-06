'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarDays, LogIn, LogOut, ChevronRight, ChevronLeft } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'

type Range = 'day' | 'week' | 'month'

interface Record_ {
  id: string
  check_in_at: string
  check_out_at: string | null
  hours_worked: number | null
}

function todayStr() {
  return new Date().toISOString().substring(0, 10)
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().substring(0, 10)
}

export function AttendLogPage({ token }: { token: string }) {
  const t = useTranslations('attend')
  const [range, setRange] = useState<Range>('week')
  const [date, setDate] = useState(todayStr())
  const [data, setData] = useState<{ from: string; to: string; records: Record_[] } | null>(null)

  useEffect(() => {
    fetch(`/api/v1/attend/${token}/log?range=${range}&date=${date}`)
      .then(async (res) => {
        if (res.ok) setData(await res.json())
      })
      .catch(() => {})
  }, [token, range, date])

  const step = range === 'day' ? 1 : range === 'week' ? 7 : 30

  const byDate = useMemo(() => {
    const map = new Map<string, Record_[]>()
    for (const r of data?.records ?? []) {
      const day = r.check_in_at.substring(0, 10)
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(r)
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [data])

  const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--')

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-slate-400" />
          <h1 className="text-base font-semibold text-slate-800 dark:text-white">{t('logTitle')}</h1>
        </div>

        <div className="flex bg-slate-100 dark:bg-gray-800 rounded-lg p-1 mb-3">
          {(['day', 'week', 'month'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium ${range === r ? 'bg-white dark:bg-gray-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >
              {t(`logRange${r.charAt(0).toUpperCase()}${r.slice(1)}`)}
            </button>
          ))}
        </div>

        {data && (
          <div className="flex items-center justify-between mb-4 text-sm text-slate-600 dark:text-slate-300">
            <button onClick={() => setDate(addDays(date, -step))}>
              <ChevronRight className="w-4 h-4" />
            </button>
            <span>{data.from} – {data.to}</span>
            <button onClick={() => setDate(addDays(date, step))}>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {byDate.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{t('logNoRecords')}</p>
          ) : (
            byDate.map(([day, records]) => {
              const totalHours = records.reduce((sum, r) => sum + (r.hours_worked ?? 0), 0)
              const d = new Date(`${day}T00:00:00.000Z`)
              return (
                <div key={day} className="flex items-start gap-3">
                  <div className="text-center shrink-0 w-12">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mb-1" />
                    <p className="text-lg font-bold text-slate-800 dark:text-white leading-none">{d.getUTCDate()}</p>
                    <p className="text-[10px] text-slate-400">{d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</p>
                  </div>
                  <div className="flex-1 border-s border-slate-100 dark:border-gray-800 ps-3 space-y-2">
                    {records.map((r) => (
                      <div key={r.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <LogIn className="w-3 h-3" />
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{fmtTime(r.check_in_at)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm text-slate-700 dark:text-slate-300">{fmtTime(r.check_out_at)}</p>
                          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white">
                            <LogOut className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-slate-400">{t('totalHoursForDay', { hours: totalHours.toFixed(2) })}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <BottomNav token={token} />
      </div>
    </div>
  )
}
