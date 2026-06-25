'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  useCustomerFieldDefinitions,
  useCreateFieldDefinition,
  useUpdateFieldDefinition,
  useDeleteFieldDefinition,
} from '../hooks/useCustomers'
import type { CustomFieldType } from '../types/customer.types'

const BUILTIN_FIELD_KEYS = new Set(['full_name', 'phone'])

const FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'نص' },
  { value: 'number', label: 'رقم' },
  { value: 'date', label: 'تاريخ' },
  { value: 'select', label: 'قائمة اختيار' },
  { value: 'boolean', label: 'نعم/لا' },
]

const inputClass = 'w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]'
const labelClass = 'text-xs text-slate-500 mb-1 block'

function AddFieldForm({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateFieldDefinition()
  const [form, setForm] = useState({
    field_key: '',
    label_ar: '',
    label_en: '',
    field_type: 'text' as CustomFieldType,
    options: '',
    required: false,
  })

  function handleSubmit() {
    if (!form.field_key.trim() || !form.label_ar.trim() || !form.label_en.trim()) return

    const options = form.field_type === 'select'
      ? form.options.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ value: v, label_ar: v, label_en: v }))
      : undefined

    if (form.field_type === 'select' && (!options || options.length === 0)) return

    createMutation.mutate({
      field_key: form.field_key.trim(),
      label_ar: form.label_ar.trim(),
      label_en: form.label_en.trim(),
      field_type: form.field_type,
      options,
      required: form.required,
    }, { onSuccess: onClose })
  }

  return (
    <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-slate-50/50 dark:bg-gray-950/50">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>المفتاح (إنجليزي، بدون مسافات) *</label>
          <input
            value={form.field_key}
            onChange={e => setForm(p => ({ ...p, field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
            placeholder="national_id"
            dir="ltr"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>النوع</label>
          <select
            value={form.field_type}
            onChange={e => setForm(p => ({ ...p, field_type: e.target.value as CustomFieldType }))}
            className={inputClass}
          >
            {FIELD_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>التسمية بالعربي *</label>
          <input
            value={form.label_ar}
            onChange={e => setForm(p => ({ ...p, label_ar: e.target.value }))}
            placeholder="رقم الهوية"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>التسمية بالإنجليزي *</label>
          <input
            value={form.label_en}
            onChange={e => setForm(p => ({ ...p, label_en: e.target.value }))}
            placeholder="National ID"
            dir="ltr"
            className={inputClass}
          />
        </div>
      </div>

      {form.field_type === 'select' && (
        <div>
          <label className={labelClass}>الخيارات (مفصولة بفاصلة)</label>
          <input
            value={form.options}
            onChange={e => setForm(p => ({ ...p, options: e.target.value }))}
            placeholder="ذكر, أنثى"
            className={inputClass}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="field_required"
          checked={form.required}
          onChange={e => setForm(p => ({ ...p, required: e.target.checked }))}
          className="w-4 h-4 accent-[#0C447C]"
        />
        <label htmlFor="field_required" className="text-sm text-slate-600 dark:text-slate-400">حقل إلزامي</label>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm">
          إلغاء
        </button>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending || !form.field_key.trim() || !form.label_ar.trim() || !form.label_en.trim()}
          className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {createMutation.isPending ? '...' : 'إضافة'}
        </button>
      </div>
    </div>
  )
}

export function CustomFieldsManager() {
  const { data: fields, isLoading } = useCustomerFieldDefinitions()
  const updateMutation = useUpdateFieldDefinition()
  const deleteMutation = useDeleteFieldDefinition()
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-gray-800">
          {(fields ?? []).length === 0 && !showAdd && (
            <p className="text-sm text-slate-400 py-2">لا توجد حقول مخصصة بعد</p>
          )}
          {(fields ?? []).map(field => {
            const isBuiltin = BUILTIN_FIELD_KEYS.has(field.field_key)
            return (
              <div key={field.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">
                    {field.label_ar} <span className="text-slate-400 text-xs">({field.label_en})</span>
                    {isBuiltin && <span className="text-slate-400 text-xs ms-1">(أساسي)</span>}
                    {field.required && <span className="text-red-500 text-xs ms-1">*</span>}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500" dir="ltr">{field.field_key} · {field.field_type}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateMutation.mutate({ id: field.id, dto: { required: !field.required } })}
                    disabled={updateMutation.isPending}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                      field.required
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {field.required ? 'إلزامي' : 'اختياري'}
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ id: field.id, dto: { is_active: !field.is_active } })}
                    disabled={updateMutation.isPending}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                      field.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {field.is_active ? 'نشط' : 'معطّل'}
                  </button>
                  {!isBuiltin && (
                    confirmDeleteId === field.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteMutation.mutate(field.id, { onSuccess: () => setConfirmDeleteId(null) })} className="text-xs text-red-500 hover:text-red-600">تأكيد</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-slate-400">إلغاء</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(field.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd ? (
        <AddFieldForm onClose={() => setShowAdd(false)} />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-sm text-[#0C447C] dark:text-[#5B9BD5] hover:text-[#0a3a6b] dark:hover:text-blue-300"
        >
          <Plus className="w-4 h-4" /> إضافة حقل مخصص
        </button>
      )}
    </div>
  )
}
