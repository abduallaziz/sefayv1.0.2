'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Pencil, Users as UsersIcon, CalendarClock } from 'lucide-react'
import {
  useShiftPatterns,
  useCreateShiftPattern,
  useUpdateShiftPattern,
  useDeleteShiftPattern,
  useAssignSchedule,
} from '../hooks/useHr'
import { useUsers } from '@/features/users/hooks/useUsers'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'
import type { ShiftPattern } from '../api/hr.api'

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] // 0 = Sunday

function formatDaysAndHours(t: ReturnType<typeof useTranslations>, days: number[], start: string, end: string) {
  const dayLabels = days.length === 7 ? '—' : days.map((d) => t(`weekday.${d}`)).join('، ')
  return `${dayLabels} · ${start.slice(0, 5)}–${end.slice(0, 5)}`
}

export function SchedulesPage() {
  const t = useTranslations('schedules')
  const { data: patterns = [], isLoading: patternsLoading } = useShiftPatterns()
  const { data: users = [] } = useUsers()
  const { mutate: createPattern, isPending: creating } = useCreateShiftPattern()
  const { mutate: updatePattern, isPending: updating } = useUpdateShiftPattern()
  const { mutate: deletePattern } = useDeleteShiftPattern()
  const { mutate: assignSchedule, isPending: assigning } = useAssignSchedule()

  const [showPatternForm, setShowPatternForm] = useState(false)
  const [editingPattern, setEditingPattern] = useState<ShiftPattern | null>(null)
  const [patternName, setPatternName] = useState('')
  const [patternDays, setPatternDays] = useState<number[]>([0, 1, 2, 3, 4])
  const [patternStart, setPatternStart] = useState('09:00')
  const [patternEnd, setPatternEnd] = useState('17:00')
  const [patternError, setPatternError] = useState<string | null>(null)

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [assignMode, setAssignMode] = useState<'pattern' | 'custom'>('pattern')
  const [selectedPatternId, setSelectedPatternId] = useState('')
  const [customDays, setCustomDays] = useState<number[]>([0, 1, 2, 3, 4])
  const [customStart, setCustomStart] = useState('09:00')
  const [customEnd, setCustomEnd] = useState('17:00')
  const [scheduleStartDate, setScheduleStartDate] = useState('')
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<number | null>(null)

  const toggleDay = (days: number[], setDays: (d: number[]) => void, day: number) => {
    setDays(days.includes(day) ? days.filter((d) => d !== day) : [...days, day])
  }

  const toggleUserId = (id: string) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]))
  }

  const openNewPatternForm = () => {
    setEditingPattern(null)
    setPatternName('')
    setPatternDays([0, 1, 2, 3, 4])
    setPatternStart('09:00')
    setPatternEnd('17:00')
    setShowPatternForm(true)
  }

  const openEditPatternForm = (pattern: ShiftPattern) => {
    setEditingPattern(pattern)
    setPatternName(pattern.name)
    setPatternDays(pattern.days_of_week)
    setPatternStart(pattern.start_time)
    setPatternEnd(pattern.end_time)
    setShowPatternForm(true)
  }

  const handleSavePattern = () => {
    setPatternError(null)
    if (!patternName.trim() || patternDays.length === 0) return
    const dto = { name: patternName.trim(), days_of_week: patternDays, start_time: patternStart, end_time: patternEnd }
    const onError = (e: any) => setPatternError(e?.message ?? t('error'))
    if (editingPattern) {
      updatePattern({ id: editingPattern.id, dto }, { onSuccess: () => setShowPatternForm(false), onError })
    } else {
      createPattern(dto, { onSuccess: () => setShowPatternForm(false), onError })
    }
  }

  const handleDeletePattern = (id: string) => {
    if (!confirm(t('deletePatternConfirm'))) return
    deletePattern(id)
  }

  const handleAssign = () => {
    setAssignError(null)
    setAssignSuccess(null)
    if (selectedUserIds.length === 0 || !scheduleStartDate) return
    if (assignMode === 'pattern' && !selectedPatternId) return

    assignSchedule(
      {
        user_ids: selectedUserIds,
        schedule_start_date: scheduleStartDate,
        ...(assignMode === 'pattern'
          ? { shift_pattern_id: selectedPatternId }
          : { custom: { days_of_week: customDays, start_time: customStart, end_time: customEnd } }),
      },
      {
        onSuccess: (res) => {
          setAssignSuccess(res.assigned)
          setSelectedUserIds([])
          setScheduleStartDate('')
        },
        onError: (e: any) => setAssignError(e?.message ?? t('error')),
      },
    )
  }

  const patternNameById = new Map(patterns.map((p) => [p.id, p.name]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
        </div>
      </div>

      {/* Shift Patterns library */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-slate-400" /> {t('patternsTitle')}
          </h2>
          <button
            onClick={openNewPatternForm}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('newPattern')}
          </button>
        </div>

        {showPatternForm && (
          <div className="p-4 border-b border-slate-100 dark:border-gray-800 space-y-3">
            <input
              value={patternName}
              onChange={(e) => setPatternName(e.target.value)}
              placeholder={t('patternName')}
              className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
            />
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('daysOfWeek')}</label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(patternDays, setPatternDays, d)}
                    className={`px-2.5 py-1 rounded-full text-xs border ${
                      patternDays.includes(d)
                        ? 'bg-[#0C447C] text-white border-[#0C447C]'
                        : 'bg-slate-50 dark:bg-gray-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-gray-700'
                    }`}
                  >
                    {t(`weekday.${d}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">{t('startTime')}</label>
                <input
                  type="time"
                  value={patternStart}
                  onChange={(e) => setPatternStart(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">{t('endTime')}</label>
                <input
                  type="time"
                  value={patternEnd}
                  onChange={(e) => setPatternEnd(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
                />
              </div>
            </div>
            {patternError && <p className="text-sm text-red-500">{patternError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSavePattern}
                disabled={creating || updating || !patternName.trim() || patternDays.length === 0}
                className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {creating || updating ? t('saving') : t('save')}
              </button>
              <button
                onClick={() => setShowPatternForm(false)}
                className="px-4 py-2 text-slate-500 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {patternsLoading ? (
          <div className="p-4 h-16 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
        ) : patterns.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">{t('noPatterns')}</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            {patterns.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.name}</p>
                  <p className="text-xs text-slate-400">{formatDaysAndHours(t, p.days_of_week, p.start_time, p.end_time)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEditPatternForm(p)} className="text-slate-400 hover:text-[#0C447C] p-1.5">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeletePattern(p.id)} className="text-slate-400 hover:text-red-500 p-1.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign schedule to employees */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
          <UsersIcon className="w-4 h-4 text-slate-400" /> {t('assignTitle')}
        </h2>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">{t('employees')}</label>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border border-slate-200 dark:border-gray-700 rounded-lg p-2">
            {(users as any[]).map((u) => (
              <button
                key={u.id}
                onClick={() => toggleUserId(u.id)}
                className={`px-2.5 py-1 rounded-full text-xs border ${
                  selectedUserIds.includes(u.id)
                    ? 'bg-[#0C447C] text-white border-[#0C447C]'
                    : 'bg-slate-50 dark:bg-gray-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-gray-700'
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1 bg-slate-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setAssignMode('pattern')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${assignMode === 'pattern' ? 'bg-white dark:bg-gray-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}
          >
            {t('useExistingPattern')}
          </button>
          <button
            onClick={() => setAssignMode('custom')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${assignMode === 'custom' ? 'bg-white dark:bg-gray-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}
          >
            {t('customSchedule')}
          </button>
        </div>

        {assignMode === 'pattern' ? (
          <select
            value={selectedPatternId}
            onChange={(e) => setSelectedPatternId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
          >
            <option value="">{t('selectPattern')}</option>
            {patterns.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('daysOfWeek')}</label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(customDays, setCustomDays, d)}
                    className={`px-2.5 py-1 rounded-full text-xs border ${
                      customDays.includes(d)
                        ? 'bg-[#0C447C] text-white border-[#0C447C]'
                        : 'bg-slate-50 dark:bg-gray-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-gray-700'
                    }`}
                  >
                    {t(`weekday.${d}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">{t('startTime')}</label>
                <input
                  type="time"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">{t('endTime')}</label>
                <input
                  type="time"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-500 mb-1 block">{t('scheduleStartDate')}</label>
          <SingleDatePicker value={scheduleStartDate || undefined} onChange={(v) => setScheduleStartDate(v ?? '')} />
        </div>

        {assignSuccess !== null && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('assigned', { count: assignSuccess })}</p>
        )}
        {assignError && <p className="text-sm text-red-500">{assignError}</p>}

        <button
          onClick={handleAssign}
          disabled={
            assigning ||
            selectedUserIds.length === 0 ||
            !scheduleStartDate ||
            (assignMode === 'pattern' && !selectedPatternId) ||
            (assignMode === 'custom' && customDays.length === 0)
          }
          className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {assigning ? t('applying') : t('apply')}
        </button>
      </div>

      {/* Current assignment per employee */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-800">
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('currentAssignmentTitle')}</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-gray-800">
          {(users as any[]).map((u) => {
            const hasCustom = !!u.custom_days_of_week?.length
            const patternName = u.shift_pattern_id ? patternNameById.get(u.shift_pattern_id) : null
            return (
              <div key={u.id} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{u.name}</p>
                <div className="text-end">
                  {patternName ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{patternName}</p>
                  ) : hasCustom ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {formatDaysAndHours(t, u.custom_days_of_week, u.custom_start_time, u.custom_end_time)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">{t('noAssignment')}</p>
                  )}
                  {u.schedule_start_date && (
                    <p className="text-xs text-slate-400">{t('sinceDate', { date: u.schedule_start_date })}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
