'use client'

import { RefreshCw } from 'lucide-react'
import { useExpenseTemplates, useUpdateExpenseTemplate } from '../hooks/useExpenses'
import type { ExpenseTemplate, RecurrenceScheduleType } from '../api/expenses.api'

const RECURRENCE_LABELS: Record<RecurrenceScheduleType, string> = {
  none: 'بدون تكرار',
  daily: 'يومي',
  weekly: 'أسبوعي',
  monthly: 'شهري',
}

const RECURRENCE_OPTIONS: { value: RecurrenceScheduleType; label: string }[] = [
  { value: 'none', label: 'بدون تكرار' },
  { value: 'daily', label: 'يومي' },
  { value: 'weekly', label: 'أسبوعي' },
  { value: 'monthly', label: 'شهري' },
]

const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

function calculateNextRun(type: RecurrenceScheduleType, day: number | null): string {
  if (type === 'none') return '—'
  const now = new Date()
  if (type === 'daily') {
    const next = new Date(now)
    next.setDate(next.getDate() + 1)
    next.setHours(0, 0, 0, 0)
    return next.toLocaleDateString('ar-SA')
  }
  if (type === 'weekly') {
    const targetDay = day ?? 0
    const next = new Date(now)
    const currentDay = next.getDay()
    const daysUntil = (targetDay - currentDay + 7) % 7 || 7
    next.setDate(next.getDate() + daysUntil)
    next.setHours(0, 0, 0, 0)
    return next.toLocaleDateString('ar-SA')
  }
  if (type === 'monthly') {
    const targetDay = day ?? 1
    const next = new Date(now)
    next.setMonth(next.getMonth() + 1)
    next.setDate(Math.min(targetDay, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
    next.setHours(0, 0, 0, 0)
    return next.toLocaleDateString('ar-SA')
  }
  return '—'
}

function TemplateRow({ template }: { template: ExpenseTemplate }) {
  const updateMutation = useUpdateExpenseTemplate()

  function handleRecurrenceChange(value: RecurrenceScheduleType) {
    const dto: Parameters<typeof updateMutation.mutate>[0]['dto'] = { recurrence_type: value }
    if (value === 'none') {
      dto.recurrence_day = null
      dto.next_run_at = null
    } else if (value === 'daily') {
      dto.recurrence_day = null
      const next = new Date()
      next.setDate(next.getDate() + 1)
      next.setHours(0, 0, 0, 0)
      dto.next_run_at = next.toISOString()
    } else {
      // weekly/monthly — يبقى recurrence_day كما هو أو يُعيّن لاحقاً
      if (template.next_run_at === null) {
        dto.next_run_at = calculateNextRunIso(value, template.recurrence_day)
      }
    }
    updateMutation.mutate({ id: template.id, dto })
  }

  function handleDayChange(value: number) {
    const next = calculateNextRunIso(template.recurrence_type, value)
    updateMutation.mutate({
      id: template.id,
      dto: { recurrence_day: value, next_run_at: next },
    })
  }

  const isPending = updateMutation.isPending

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
      <td className="px-4 py-3">
        <span className="text-slate-800 dark:text-white font-medium">{template.name}</span>
        {template.default_amount != null && (
          <span className="text-xs text-slate-400 ms-2">{template.default_amount}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <select
          value={template.recurrence_type}
          onChange={e => handleRecurrenceChange(e.target.value as RecurrenceScheduleType)}
          disabled={isPending}
          className="px-2 py-1.5 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] disabled:opacity-50"
        >
          {RECURRENCE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        {template.recurrence_type === 'weekly' && (
          <select
            value={template.recurrence_day ?? 0}
            onChange={e => handleDayChange(Number(e.target.value))}
            disabled={isPending}
            className="px-2 py-1.5 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] disabled:opacity-50"
          >
            {WEEKDAYS.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        )}
        {template.recurrence_type === 'monthly' && (
          <select
            value={template.recurrence_day ?? 1}
            onChange={e => handleDayChange(Number(e.target.value))}
            disabled={isPending}
            className="px-2 py-1.5 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] disabled:opacity-50"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>يوم {d}</option>
            ))}
          </select>
        )}
        {(template.recurrence_type === 'daily' || template.recurrence_type === 'none') && (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
        {template.recurrence_type !== 'none'
          ? (template.next_run_at
              ? new Date(template.next_run_at).toLocaleDateString('ar-SA')
              : calculateNextRun(template.recurrence_type, template.recurrence_day))
          : '—'}
      </td>
      <td className="px-4 py-3 text-center">
        {isPending
          ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400 mx-auto" />
          : template.recurrence_type !== 'none'
            ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">نشط</span>
            : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">معطّل</span>
        }
      </td>
    </tr>
  )
}

function calculateNextRunIso(type: RecurrenceScheduleType, day: number | null): string {
  const now = new Date()
  if (type === 'daily') {
    const next = new Date(now)
    next.setDate(next.getDate() + 1)
    next.setHours(0, 0, 0, 0)
    return next.toISOString()
  }
  if (type === 'weekly') {
    const targetDay = day ?? 0
    const next = new Date(now)
    const currentDay = next.getDay()
    const daysUntil = (targetDay - currentDay + 7) % 7 || 7
    next.setDate(next.getDate() + daysUntil)
    next.setHours(0, 0, 0, 0)
    return next.toISOString()
  }
  if (type === 'monthly') {
    const targetDay = day ?? 1
    const next = new Date(now)
    next.setMonth(next.getMonth() + 1)
    next.setDate(Math.min(targetDay, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
    next.setHours(0, 0, 0, 0)
    return next.toISOString()
  }
  return new Date().toISOString()
}

export function TemplatesList() {
  const { data: templates = [], isLoading } = useExpenseTemplates()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p>لا توجد قوالب — أضف قوالب من إعدادات المصاريف</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-gray-800">
              <th className="text-start px-4 py-3 text-xs font-medium text-slate-500">القالب</th>
              <th className="text-start px-4 py-3 text-xs font-medium text-slate-500">التكرار</th>
              <th className="text-start px-4 py-3 text-xs font-medium text-slate-500">اليوم</th>
              <th className="text-start px-4 py-3 text-xs font-medium text-slate-500">التشغيل التالي</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {templates.map(t => (
              <TemplateRow key={t.id} template={t} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}