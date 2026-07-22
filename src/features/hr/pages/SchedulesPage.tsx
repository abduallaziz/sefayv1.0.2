'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Pencil, Users as UsersIcon, CalendarClock, X } from 'lucide-react'
import {
  useShiftPatterns,
  useCreateShiftPattern,
  useUpdateShiftPattern,
  useDeleteShiftPattern,
  useAssignSchedule,
} from '../hooks/useHr'
import { useUsers } from '@/features/users/hooks/useUsers'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'
import type { ShiftPattern, Shift, DayOverride } from '../api/hr.api'

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] // 0 = Sunday

function formatShifts(shifts: Shift[]) {
  return shifts.map((s) => `${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`).join(' + ')
}

function formatDaysAndShifts(t: ReturnType<typeof useTranslations>, days: number[], shifts: Shift[]) {
  const dayLabels = days.map((d) => t(`weekday.${d}`)).join('، ')
  return `${dayLabels} · ${formatShifts(shifts)}`
}

function ShiftsEditor({ shifts, onChange }: { shifts: Shift[]; onChange: (shifts: Shift[]) => void }) {
  const t = useTranslations('schedules')

  const updateShift = (i: number, field: 'start_time' | 'end_time', value: string) => {
    onChange(shifts.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  }
  const removeShift = (i: number) => onChange(shifts.filter((_, idx) => idx !== i))
  const addShift = () => onChange([...shifts, { start_time: '09:00', end_time: '17:00' }])

  return (
    <div className="space-y-2">
      {shifts.map((s, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 items-center">
          <input
            type="time"
            value={s.start_time}
            onChange={(e) => updateShift(i, 'start_time', e.target.value)}
            className="bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
          />
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={s.end_time}
              onChange={(e) => updateShift(i, 'end_time', e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white"
            />
            {shifts.length > 1 && (
              <button onClick={() => removeShift(i)} className="text-slate-400 hover:text-red-500 shrink-0">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
      <button onClick={addShift} className="flex items-center gap-1 text-xs text-[#0C447C] dark:text-[#5B9BD5]">
        <Plus className="w-3.5 h-3.5" /> {t('addShift')}
      </button>
    </div>
  )
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
  const [patternShifts, setPatternShifts] = useState<Shift[]>([{ start_time: '09:00', end_time: '17:00' }])
  const [patternDayOverrides, setPatternDayOverrides] = useState<DayOverride[]>([])
  const [patternError, setPatternError] = useState<string | null>(null)

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [assignMode, setAssignMode] = useState<'pattern' | 'custom'>('pattern')
  const [selectedPatternId, setSelectedPatternId] = useState('')
  const [customDays, setCustomDays] = useState<number[]>([0, 1, 2, 3, 4])
  const [customShifts, setCustomShifts] = useState<Shift[]>([{ start_time: '09:00', end_time: '17:00' }])
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
    setPatternShifts([{ start_time: '09:00', end_time: '17:00' }])
    setPatternDayOverrides([])
    setShowPatternForm(true)
  }

  const openEditPatternForm = (pattern: ShiftPattern) => {
    setEditingPattern(pattern)
    setPatternName(pattern.name)
    setPatternDays(pattern.days_of_week)
    setPatternShifts(pattern.shifts)
    setPatternDayOverrides(pattern.day_overrides ?? [])
    setShowPatternForm(true)
  }

  const overriddenDays = new Set(patternDayOverrides.map((o) => o.day))
  const addDayOverride = (day: number) => {
    setPatternDayOverrides((prev) => [...prev, { day, shifts: [{ start_time: '14:00', end_time: '00:00' }] }])
  }
  const removeDayOverride = (day: number) => {
    setPatternDayOverrides((prev) => prev.filter((o) => o.day !== day))
  }
  const updateDayOverrideShifts = (day: number, shifts: Shift[]) => {
    setPatternDayOverrides((prev) => prev.map((o) => (o.day === day ? { ...o, shifts } : o)))
  }

  const handleSavePattern = () => {
    setPatternError(null)
    if (!patternName.trim() || patternDays.length === 0 || patternShifts.length === 0) return
    const dto = {
      name: patternName.trim(),
      days_of_week: patternDays,
      shifts: patternShifts,
      day_overrides: patternDayOverrides,
    }
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
          : { custom: { days_of_week: customDays, shifts: customShifts } }),
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
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('shifts')}</label>
              <ShiftsEditor shifts={patternShifts} onChange={setPatternShifts} />
            </div>

            {patternDays.length > 0 && (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">{t('dayOverridesHint')}</label>
                <div className="space-y-2">
                  {patternDayOverrides.map((o) => (
                    <div key={o.day} className="border border-slate-200 dark:border-gray-700 rounded-lg p-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t(`weekday.${o.day}`)}</span>
                        <button onClick={() => removeDayOverride(o.day)} className="text-slate-400 hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <ShiftsEditor shifts={o.shifts} onChange={(shifts) => updateDayOverrideShifts(o.day, shifts)} />
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-1.5">
                    {patternDays.filter((d) => !overriddenDays.has(d)).map((d) => (
                      <button
                        key={d}
                        onClick={() => addDayOverride(d)}
                        className="px-2.5 py-1 rounded-full text-xs border border-dashed border-slate-300 dark:border-gray-600 text-slate-500 dark:text-slate-400"
                      >
                        + {t(`weekday.${d}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {patternError && <p className="text-sm text-red-500">{patternError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSavePattern}
                disabled={creating || updating || !patternName.trim() || patternDays.length === 0 || patternShifts.length === 0}
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
                  <p className="text-xs text-slate-400">{formatDaysAndShifts(t, p.days_of_week, p.shifts)}</p>
                  {p.day_overrides?.length > 0 && (
                    <p className="text-xs text-slate-400">
                      {p.day_overrides.map((o) => `${t(`weekday.${o.day}`)}: ${formatShifts(o.shifts)}`).join(' · ')}
                    </p>
                  )}
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
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('shifts')}</label>
              <ShiftsEditor shifts={customShifts} onChange={setCustomShifts} />
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
            (assignMode === 'custom' && (customDays.length === 0 || customShifts.length === 0))
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
                      {formatDaysAndShifts(t, u.custom_days_of_week, u.custom_shifts ?? [])}
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
