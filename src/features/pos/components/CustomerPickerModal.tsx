'use client'

import { useState } from 'react'
import { Search, UserPlus, X } from 'lucide-react'
import { useCustomerSearch, useCustomerFieldDefinitions, useCreateCustomer } from '@/features/customers/hooks/useCustomers'
import type { Customer } from '@/features/customers/types/customer.types'

interface Props {
  onSelect: (customer: Customer) => void
  onClose: () => void
}

const inputClass = 'w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-[#0C447C]'

const BUILTIN_FIELD_KEYS = new Set(['full_name', 'phone'])

function QuickAddCustomerForm({ onCreated, onCancel }: { onCreated: (c: Customer) => void; onCancel: () => void }) {
  const { data: fieldDefs } = useCustomerFieldDefinitions()
  const createMutation = useCreateCustomer()
  const [values, setValues] = useState<Record<string, string>>({})

  const activeFields = (fieldDefs ?? [])
    .filter(f => f.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)

  const missingRequired = activeFields.some(f => f.required && !values[f.field_key]?.trim())

  function handleSubmit() {
    if (missingRequired) return

    const custom_fields: Record<string, string | number | boolean> = {}
    let full_name: string | undefined
    let phone: string | undefined

    for (const field of activeFields) {
      const raw = values[field.field_key]
      if (raw === undefined || raw === '') continue

      if (field.field_key === 'full_name') { full_name = raw; continue }
      if (field.field_key === 'phone') { phone = raw; continue }

      if (field.field_type === 'number') custom_fields[field.field_key] = Number(raw)
      else if (field.field_type === 'boolean') custom_fields[field.field_key] = raw === 'true'
      else custom_fields[field.field_key] = raw
    }

    createMutation.mutate(
      { full_name, phone, custom_fields },
      { onSuccess: (customer) => onCreated(customer) },
    )
  }

  return (
    <div className="space-y-3">
      {activeFields.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-2">لا توجد حقول مفعّلة لتسجيل عميل</p>
      )}

      {activeFields.map(field => (
        <div key={field.field_key}>
          <label className="text-xs text-slate-400 mb-1 block">
            {field.label_ar} {field.required && <span className="text-red-400">*</span>}
          </label>
          {field.field_type === 'select' ? (
            <select
              value={values[field.field_key] ?? ''}
              onChange={e => setValues(p => ({ ...p, [field.field_key]: e.target.value }))}
              className={inputClass}
            >
              <option value="">—</option>
              {(field.options ?? []).map(o => <option key={o.value} value={o.value}>{o.label_ar}</option>)}
            </select>
          ) : field.field_type === 'boolean' ? (
            <select
              value={values[field.field_key] ?? ''}
              onChange={e => setValues(p => ({ ...p, [field.field_key]: e.target.value }))}
              className={inputClass}
            >
              <option value="">—</option>
              <option value="true">نعم</option>
              <option value="false">لا</option>
            </select>
          ) : (
            <input
              type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
              dir={BUILTIN_FIELD_KEYS.has(field.field_key) && field.field_key === 'phone' ? 'ltr' : undefined}
              value={values[field.field_key] ?? ''}
              onChange={e => setValues(p => ({ ...p, [field.field_key]: e.target.value }))}
              className={inputClass}
              autoFocus={field.sort_order === activeFields[0]?.sort_order}
            />
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-2 border border-[#1e2130] text-slate-400 hover:text-white rounded-lg text-sm">
          إلغاء
        </button>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending || missingRequired}
          className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {createMutation.isPending ? '...' : 'حفظ وتحديد'}
        </button>
      </div>
    </div>
  )
}

export function CustomerPickerModal({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'search' | 'add'>('search')
  const { data: results, isLoading } = useCustomerSearch(search)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-2xl w-full max-w-md shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#1e2130]">
          <h3 className="font-bold text-lg text-white">{mode === 'search' ? 'اختيار عميل' : 'عميل جديد'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {mode === 'search' ? (
            <>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="بحث بالاسم / الجوال / أي حقل..."
                  className={`${inputClass} pe-9`}
                  autoFocus
                />
              </div>

              {isLoading && <p className="text-sm text-slate-500 text-center py-4">جارٍ البحث...</p>}

              {!isLoading && search.trim().length >= 2 && (results ?? []).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">لا يوجد عميل مطابق</p>
              )}

              <div className="space-y-1.5">
                {(results ?? []).map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => onSelect(customer)}
                    className="w-full text-start p-3 rounded-lg bg-[#141720] hover:bg-[#1a1f2e] border border-[#1e2130] transition-colors"
                  >
                    <p className="text-sm font-medium text-white">{customer.full_name || '—'}</p>
                    {customer.phone && <p className="text-xs text-slate-400" dir="ltr">{customer.phone}</p>}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setMode('add')}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#1e2130] text-[#5B9BD5] hover:border-[#0C447C] rounded-lg text-sm"
              >
                <UserPlus className="w-4 h-4" /> تسجيل عميل جديد
              </button>
            </>
          ) : (
            <QuickAddCustomerForm onCreated={onSelect} onCancel={() => setMode('search')} />
          )}
        </div>
      </div>
    </div>
  )
}
