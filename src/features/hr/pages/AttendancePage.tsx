'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { CalendarClock, LogIn, LogOut, Circle, History, X, Search, Download, ChevronRight, ChevronLeft } from 'lucide-react'
import { useMyAttendance, useAllAttendance, useSchedules } from '../hooks/useHr'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { DateRangePicker, SingleDatePicker } from '@/shared/ui/date-range-picker'

type Status = 'present' | 'out' | 'away' | 'not_logged'

const STATUS_STYLE: Record<Status, { dot: string; text: string }> = {
  present: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  out: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  away: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  not_logged: { dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400' },
}

function todayStr() {
  return new Date().toISOString().substring(0, 10)
}

export function AttendancePage() {
  const t = useTranslations('attendance')
  const { user } = useAuthStore()
  const canViewAll = !!user?.permissions?.includes('attendance.view.all')
  const { data: records = [], isLoading } = useMyAttendance()
  const [showMyHistory, setShowMyHistory] = useState(false)

  const latestRecord = records[0] ?? null

  const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
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

const AVATAR_COLORS = ['#0C447C', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2']

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
  }
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
      style={{ backgroundColor: avatarColor(name) }}
    >
      {initials(name)}
    </div>
  )
}

const PAGE_SIZE = 5

function AllEmployeesAttendance({
  t,
  fmtDateTime,
}: {
  t: ReturnType<typeof useTranslations>
  fmtDateTime: (iso: string) => string
}) {
  const [refDate, setRefDate] = useState(todayStr())
  const { data: records = [], isLoading } = useAllAttendance()
  const { data: dateSchedules = [] } = useSchedules({ from: refDate, to: refDate })
  const { data: users = [] } = useUsers()
  const [historyUser, setHistoryUser] = useState<{ id: string; name: string; jobTitle?: string | null; avatarUrl?: string | null } | null>(null)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [page, setPage] = useState(1)

  const usersById = useMemo(() => new Map((users as any[]).map((u) => [u.id, u])), [users])
  const departments = useMemo(
    () => Array.from(new Set((users as any[]).map((u) => u.department).filter(Boolean))) as string[],
    [users],
  )
  const scheduledUserIdsOnDate = useMemo(() => new Set(dateSchedules.map((s: any) => s.user_id)), [dateSchedules])

  const latestPerEmployee = useMemo(() => {
    const byUser = new Map<string, (typeof records)[number]>()
    for (const r of records) {
      if (!byUser.has(r.user_id)) byUser.set(r.user_id, r)
    }
    return Array.from(byUser.values())
  }, [records])

  const filtered = useMemo(() => {
    return latestPerEmployee.filter((r) => {
      if (search && !r.user_name?.toLowerCase().includes(search.toLowerCase())) return false
      if (departmentFilter && usersById.get(r.user_id)?.department !== departmentFilter) return false
      return true
    })
  }, [latestPerEmployee, search, departmentFilter, usersById])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function getStatus(r: (typeof records)[number]): Status {
    const isRefDate = r.check_in_at.substring(0, 10) === refDate
    if (isRefDate) return r.check_out_at ? 'out' : 'present'
    return scheduledUserIdsOnDate.has(r.user_id) ? 'away' : 'not_logged'
  }

  function exportCsv() {
    const header = [t('employee'), t('department'), t('status'), t('workHours'), t('lastCheckIn'), t('lastCheckOut')]
    const rows = filtered.map((r) => {
      const status = getStatus(r)
      return [
        r.user_name ?? '',
        usersById.get(r.user_id)?.department ?? '',
        t(`statusValues.${status}`),
        r.hours_worked !== null && r.check_in_at.substring(0, 10) === refDate ? String(r.hours_worked) : '',
        fmtDateTime(r.check_in_at),
        r.check_out_at ? fmtDateTime(r.check_out_at) : '',
      ]
    })
    const csv = [header, ...rows].map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${refDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <div className="p-4 h-20 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />

  return (
    <>
      <div className="p-4 border-b border-slate-100 dark:border-gray-800 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            {t('export')}
          </button>
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1) }}
              className="bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
            >
              <option value="">{t('allDepartments')}</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
          <SingleDatePicker value={refDate} onChange={(v) => setRefDate(v ?? todayStr())} />
        </div>
        <div className="relative min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder={t('searchEmployee')}
            className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg ps-8 pe-3 py-2 text-sm text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">{t('noRecords')}</p>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-gray-800">
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('employee')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('department')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('status')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('workHours')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('lastCheckIn')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('lastCheckOut')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {paginated.map((r) => {
                const status = getStatus(r)
                const style = STATUS_STYLE[status]
                const employeeUser = usersById.get(r.user_id)
                const name = r.user_name ?? ''
                return (
                  <tr key={r.user_id}>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={name} avatarUrl={employeeUser?.avatar_url} />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{name}</p>
                          {employeeUser?.job_title && (
                            <p className="text-xs text-slate-400">{employeeUser.job_title}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-middle text-slate-600 dark:text-slate-300">
                      {employeeUser?.department || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
                        <span className={`w-2 h-2 rounded-full ${style.dot} inline-block`} />
                        {t(`statusValues.${status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center align-middle text-slate-700 dark:text-slate-300">
                      {r.hours_worked !== null && r.check_in_at.substring(0, 10) === refDate
                        ? t('hoursWorked', { hours: r.hours_worked })
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <div className="inline-block bg-emerald-50 dark:bg-emerald-500/10 rounded-lg px-3 py-1.5">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          {new Date(r.check_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(r.check_in_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <div className="inline-block bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-1.5">
                        {r.check_out_at ? (
                          <>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                              {new Date(r.check_out_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(r.check_out_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-slate-400">--</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <button
                        onClick={() => setHistoryUser({ id: r.user_id, name, jobTitle: employeeUser?.job_title, avatarUrl: employeeUser?.avatar_url })}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700 text-[#0C447C] dark:text-[#5B9BD5] hover:bg-slate-50 dark:hover:bg-gray-800"
                      >
                        <History className="w-3.5 h-3.5" />
                        {t('viewHistory')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-gray-800">
            <p className="text-xs text-slate-400">
              {t('paginationSummary', {
                from: (currentPage - 1) * PAGE_SIZE + 1,
                to: Math.min(currentPage * PAGE_SIZE, filtered.length),
                total: filtered.length,
              })}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-500 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-500 px-2">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-500 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
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
  user: { id: string; name: string; jobTitle?: string | null; avatarUrl?: string | null }
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
  const { data: schedules = [] } = useSchedules({ userId: user.id, from: range.from, to: range.to })

  const stats = useMemo(() => {
    const totalHours = records.reduce((sum, r) => sum + (r.hours_worked ?? 0), 0)
    const workDays = new Set(records.map((r) => r.check_in_at.substring(0, 10))).size
    const scheduledDaysWithEarliestStart = new Map<string, string>()
    for (const s of schedules as any[]) {
      const existing = scheduledDaysWithEarliestStart.get(s.scheduled_date)
      if (!existing || s.start_time < existing) scheduledDaysWithEarliestStart.set(s.scheduled_date, s.start_time)
    }
    let lateHours = 0
    for (const r of records) {
      const date = r.check_in_at.substring(0, 10)
      const start = scheduledDaysWithEarliestStart.get(date)
      if (!start) continue
      const scheduledStart = new Date(`${date}T${start}Z`)
      const actualStart = new Date(r.check_in_at)
      const diffHours = (actualStart.getTime() - scheduledStart.getTime()) / 3600000
      if (diffHours > 0) lateHours += diffHours
    }
    const scheduledDayCount = scheduledDaysWithEarliestStart.size
    const attendancePercentage = scheduledDayCount > 0 ? Math.min(100, Math.round((workDays / scheduledDayCount) * 100)) : 0

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      workDays,
      lateHours: Math.round(lateHours * 100) / 100,
      attendancePercentage,
    }
  }, [records, schedules])

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="text-end">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{user.name}</h2>
              {user.jobTitle && <p className="text-xs text-slate-400">{user.jobTitle}</p>}
            </div>
            <Avatar name={user.name} avatarUrl={user.avatarUrl} />
          </div>
        </div>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-800">
          <DateRangePicker className="w-full" value={range} onChange={setRange} />
        </div>

        <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-slate-100 dark:border-gray-800">
          <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-slate-800 dark:text-white">{stats.totalHours}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('totalHours')}</p>
          </div>
          <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-slate-800 dark:text-white">{stats.workDays}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('workDays')}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-500/10 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.lateHours}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('lateHours')}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.attendancePercentage}%</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('attendancePercentage')}</p>
          </div>
        </div>

        <div className="overflow-y-auto">
          <AttendanceTimeline records={records} isLoading={isLoading} t={t} />
        </div>
      </div>
    </div>
  )
}

function AttendanceTimeline({
  records,
  isLoading,
  t,
}: {
  records: { id: string; check_in_at: string; check_out_at: string | null; hours_worked: number | null }[]
  isLoading: boolean
  t: ReturnType<typeof useTranslations>
}) {
  if (isLoading) return <div className="p-4 h-20 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
  if (records.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">{t('noRecords')}</p>
  }
  return (
    <div className="px-4 py-3 divide-y divide-slate-100 dark:divide-gray-800">
      {records.map((r) => {
        const d = new Date(r.check_in_at)
        return (
          <div key={r.id} className="py-3 first:pt-0 flex items-start justify-between gap-3">
            <p className="text-xs text-slate-400 pt-1 shrink-0">
              {r.hours_worked !== null && t('hoursWorked', { hours: r.hours_worked })}
            </p>

            <div className="relative pe-6 flex-1">
              <div className="absolute end-[7px] top-1.5 bottom-1.5 w-px bg-slate-200 dark:bg-gray-700" />
              <div className="relative flex items-center justify-end gap-2 mb-2">
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {t('checkIn')}
                </span>
                <span className="absolute end-[-24px] w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white z-10">
                  <LogIn className="w-2.5 h-2.5" />
                </span>
              </div>
              <div className="relative flex items-center justify-end gap-2">
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                  {r.check_out_at ? t('checkOut') : t('stillOpen')}
                </span>
                <span className="absolute end-[-24px] w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white z-10">
                  <LogOut className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
              <div className="text-end">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {d.toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <p className="text-[10px] text-slate-400">
                  {d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
          </div>
        )
      })}
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
        <div key={r.id} className="flex items-center justify-between gap-2 px-4 py-3 flex-wrap">
          <div>
            {showName && r.user_name && (
              <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1.5">{r.user_name}</p>
            )}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-md px-1.5 py-1">
                <div className="w-4 h-4 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <Circle className="w-2 h-2 fill-current" />
                </div>
                <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 leading-tight">{fmtDateTime(r.check_in_at)}</p>
              </div>
              <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md px-1.5 py-1">
                <div className="w-4 h-4 shrink-0 rounded-full bg-red-500 flex items-center justify-center text-white">
                  <Circle className="w-2 h-2 fill-current" />
                </div>
                <p className="text-[10px] font-medium text-red-700 dark:text-red-400 leading-tight">
                  {r.check_out_at ? fmtDateTime(r.check_out_at) : t('stillOpen')}
                </p>
              </div>
            </div>
          </div>
          <div className="inline-flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {r.hours_worked !== null ? (
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('hoursWorked', { hours: r.hours_worked })}
              </span>
            ) : (
              <span className="text-xs text-amber-500">{t('stillOpen')}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
