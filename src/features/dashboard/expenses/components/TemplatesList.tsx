'use client'

import { useState } from 'react'
import { RefreshCw, ShieldCheck, Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { useExpenseTemplates, useUpdateExpenseTemplate, useDeleteExpenseTemplate, useCreateExpenseTemplate } from '../hooks/useExpenses'
import type { ExpenseTemplate, RecurrenceScheduleType } from '../api/expenses.api'

const RECURRENCE_OPTIONS: { value: RecurrenceScheduleType; label: string }[] = [
  { value: 'none', label: 'بدون تكرار' },
  { value: 'daily', label: 'يومي' },
  { value: 'weekly', label: 'أسبوعي' },
  { value: 'monthly', label: 'شهري' },
]

const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

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
    const daysUntil = (targetDay - next.getDay() + 7) % 7 || 7
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

function AddTemplateModal({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateExpenseTemplate()
  const [form, setForm] = useState({ name: '', default_amount: '', expiry_hours: '24', requires_photo: false })

  const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]"
  const labelClass = "text-xs text-slate-500 mb-1 block"

  function handleSubmit() {
    if (!form.name.trim()) return
    createMutation.mutate({
      name: form.name.trim(),
      default_amount: form.default_amount ? Number(form.default_amount) : null,
      expiry_hours: form.expiry_hours ? Number(form.expiry_hours) : 24,
      requires_photo: form.requires_photo,
    }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-800 dark:text-white">إضافة قالب متكرر</h2>

        <div>
          <label className={labelClass}>الاسم <span className="text-red-400">*</span></label>
          <input
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="مثال: إيجار شهري"
            className={inputClass}
            autoFocus
          />
        </div>

        <div>
          <label className={labelClass}>المبلغ الافتراضي (اختياري)</label>
          <input
            value={form.default_amount}
            onChange={e => setForm(p => ({ ...p, default_amount: e.target.value }))}
            placeholder="0.00"
            inputMode="decimal"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>مدة الصلاحية (ساعات)</label>
          <input
            value={form.expiry_hours}
            onChange={e => setForm(p => ({ ...p, expiry_hours: e.target.value }))}
            inputMode="numeric"
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="requires_photo"
            checked={form.requires_photo}
            onChange={e => setForm(p => ({ ...p, requires_photo: e.target.checked }))}
            className="w-4 h-4 accent-[#0C447C]"
          />
          <label htmlFor="requires_photo" className="text-sm text-slate-600 dark:text-slate-400">يتطلب صورة</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm">
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || createMutation.isPending}
            className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {createMutation.isPending ? '...' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TemplateRow({ template }: { template: ExpenseTemplate }) {
  const updateMutation = useUpdateExpenseTemplate()
  const deleteMutation = useDeleteExpenseTemplate()
  const isPending = updateMutation.isPending || deleteMutation.isPending

  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState(template.name)
  const [editAmount, setEditAmount] = useState(String(template.default_amount ?? ''))
  const [confirmDelete, setConfirmDelete] = useState(false)

  function saveEdit() {
    if (!editName.trim()) return
    updateMutation.mutate({
      id: template.id,
      dto: {
        name: editName.trim(),
        default_amount: editAmount !== '' ? Number(editAmount) : null,
      },
    }, { onSuccess: () => setEditMode(false) })
  }

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
      if (!template.next_run_at) {
        dto.next_run_at = calculateNextRunIso(value, template.recurrence_day)
      }
    }
    updateMutation.mutate({ id: template.id, dto })
  }

  function handleDayChange(value: number) {
    updateMutation.mutate({
      id: template.id,
      dto: { recurrence_day: value, next_run_at: calculateNextRunIso(template.recurrence_type, value) },
    })
  }

  function toggleActive() {
    updateMutation.mutate({ id: template.id, dto: { is_active: !template.is_active } })
  }

  function togglePreApproved() {
    updateMutation.mutate({ id: template.id, dto: { is_pre_approved: !template.is_pre_approved } })
  }

  const inputClass = "px-2 py-1 text-sm bg-slate-50 dark:bg-gray-950 border border-[#0C447C] dark:border-[#0C447C] text-slate-800 dark:text-white rounded-lg focus:outline-none"

  return (
    <>
      <tr className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
        <td className="px-4 py-3">
          {editMode ? (
            <div className="flex items-center gap-2">
              <input value={editName} onChange={e => setEditName(e.target.value)} className={`${inputClass} w-28`} autoFocus />
              <input value={editAmount} onChange={e => setEditAmount(e.target.value)} placeholder="المبلغ" className={`${inputClass} w-20`} inputMode="decimal" />
            </div>
          ) : (
            <span className="text-slate-800 dark:text-white font-medium">
              {template.name}
              {template.default_amount != null && <span className="text-xs text-slate-400 ms-2">{template.default_amount}</span>}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <select
            value={template.recurrence_type}
            onChange={e => handleRecurrenceChange(e.target.value as RecurrenceScheduleType)}
            disabled={isPending || editMode}
            className="px-2 py-1.5 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] disabled:opacity-50"
          >
            {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </td>
        <td className="px-4 py-3">
          {template.recurrence_type === 'weekly' && (
            <select value={template.recurrence_day ?? 0} onChange={e => handleDayChange(Number(e.target.value))} disabled={isPending} className="px-2 py-1.5 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none disabled:opacity-50">
              {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          )}
          {template.recurrence_type === 'monthly' && (
            <select value={template.recurrence_day ?? 1} onChange={e => handleDayChange(Number(e.target.value))} disabled={isPending} className="px-2 py-1.5 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none disabled:opacity-50">
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>يوم {d}</option>)}
            </select>
          )}
          {(template.recurrence_type === 'daily' || template.recurrence_type === 'none') && <span className="text-sm text-slate-400">—</span>}
        </td>
        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          {template.recurrence_type !== 'none' ? (template.next_run_at ? new Date(template.next_run_at).toLocaleDateString('ar-SA') : '—') : '—'}
        </td>
        <td className="px-4 py-3 text-center">
          {isPending
            ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400 mx-auto" />
            : <button onClick={toggleActive} disabled={isPending} className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${template.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200'}`}>
                {template.is_active ? 'نشط' : 'معطّل'}
              </button>
          }
        </td>
        <td className="px-4 py-3 text-center">
          <button onClick={togglePreApproved} disabled={isPending || template.recurrence_type === 'none'} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${template.is_pre_approved ? 'bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5] border-[#0C447C]/20 hover:bg-[#E8F0FB]0/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200'}`}>
            <ShieldCheck className="w-3 h-3" />
            {template.is_pre_approved ? 'موافقة مسبقة' : 'بدون موافقة'}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 justify-end">
            {editMode ? (
              <>
                <button onClick={saveEdit} disabled={isPending} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500"><Check className="w-4 h-4" /></button>
                <button onClick={() => { setEditMode(false); setEditName(template.name); setEditAmount(String(template.default_amount ?? '')) }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <button onClick={() => setEditMode(true)} disabled={isPending} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-600 dark:hover:text-white"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirmDelete(true)} disabled={isPending} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
          </div>
        </td>
      </tr>
      {confirmDelete && (
        <tr>
          <td colSpan={7} className="px-4 py-3 bg-red-50 dark:bg-red-500/10 border-t border-red-200 dark:border-red-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600 dark:text-red-400">حذف "{template.name}"؟ لا يمكن التراجع.</span>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1 text-xs border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100">إلغاء</button>
                <button onClick={() => deleteMutation.mutate(template.id)} disabled={deleteMutation.isPending} className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">{deleteMutation.isPending ? '...' : 'حذف'}</button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function TemplatesList() {
  const { data: templates = [], isLoading } = useExpenseTemplates()
  const [showAdd, setShowAdd] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" />
          إضافة قالب
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p>لا توجد قوالب — أضف قالباً جديداً</p>
        </div>
      ) : (
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
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">الموافقة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {templates.map(t => <TemplateRow key={t.id} template={t} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && <AddTemplateModal onClose={() => setShowAdd(false)} />}
    </>
  )
}