'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, UserPlus } from 'lucide-react'
import { useCustomerSearch, useCustomerFieldDefinitions, useCreateCustomer } from '@/features/customers/hooks/useCustomers'
import { useProfile } from '@/features/settings/hooks/useSettings'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'
import type { Customer } from '@/features/customers/types/customer.types'

interface Props {
  onSelect: (customer: Customer) => void
  onClose: () => void
}

const inputClass = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]'

function QuickAddCustomerForm({ onCreated, onCancel }: { onCreated: (c: Customer) => void; onCancel: () => void }) {
  const t = useTranslations('pos.customerPicker')
  const { data: fieldDefs } = useCustomerFieldDefinitions()
  const { data: profile } = useProfile()
  const nameFieldEnabled = profile?.name_field_enabled ?? false
  const createMutation = useCreateCustomer()
  const [values, setValues] = useState<Record<string, string>>({})
  const [fullName, setFullName] = useState('')

  const activeFields = (fieldDefs ?? [])
    .filter(f => f.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)

  const missingRequired =
    (nameFieldEnabled && !fullName.trim()) ||
    activeFields.some(f => f.required && !values[f.field_key]?.trim())

  function handleSubmit() {
    if (missingRequired) return

    const custom_fields: Record<string, string | number | boolean> = {}

    for (const field of activeFields) {
      const raw = values[field.field_key]
      if (raw === undefined || raw === '') continue

      if (field.field_type === 'number') custom_fields[field.field_key] = Number(raw)
      else if (field.field_type === 'boolean') custom_fields[field.field_key] = raw === 'true'
      else custom_fields[field.field_key] = raw
    }

    createMutation.mutate(
      { ...(nameFieldEnabled ? { full_name: fullName.trim() } : {}), custom_fields },
      { onSuccess: (customer) => onCreated(customer) },
    )
  }

  return (
    <div className="space-y-3">
      {nameFieldEnabled && (
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
            {t('name')} <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className={inputClass}
            autoFocus
          />
        </div>
      )}

      {activeFields.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">{t('noActiveFields')}</p>
      )}

      {activeFields.map(field => (
        <div key={field.field_key}>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
            {field.label_ar} {field.required && <span className="text-red-500 dark:text-red-400">*</span>}
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
              <option value="true">{t('yes')}</option>
              <option value="false">{t('no')}</option>
            </select>
          ) : field.field_type === 'date' ? (
            <SingleDatePicker
              value={values[field.field_key] || undefined}
              onChange={v => setValues(p => ({ ...p, [field.field_key]: v ?? '' }))}
            />
          ) : (
            <input
              type={field.field_type === 'number' ? 'number' : 'text'}
              value={values[field.field_key] ?? ''}
              onChange={e => setValues(p => ({ ...p, [field.field_key]: e.target.value }))}
              className={inputClass}
              autoFocus={field.sort_order === activeFields[0]?.sort_order}
            />
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg text-sm">
          {t('cancel')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending || missingRequired}
          className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {createMutation.isPending ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  )
}

export function CustomerPickerModal({ onSelect, onClose }: Props) {
  const t = useTranslations('pos.customerPicker')
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'search' | 'add'>('search')
  const { data: results, isLoading } = useCustomerSearch(search)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{mode === 'search' ? t('selectTitle') : t('newTitle')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {mode === 'search' ? (
            <>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className={`${inputClass} pe-9`}
                  autoFocus
                />
              </div>

              {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('searching')}</p>}

              {!isLoading && search.trim().length >= 2 && (results ?? []).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('noMatch')}</p>
              )}

              <div className="space-y-1.5">
                {(results ?? []).map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => onSelect(customer)}
                    className="w-full text-start p-3 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.full_name || '—'}</p>
                    {customer.phone && <p className="text-xs text-gray-500 dark:text-gray-400" dir="ltr">{customer.phone}</p>}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setMode('add')}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 text-[#0C447C] dark:text-[#5B9BD5] hover:border-[#0C447C] rounded-lg text-sm"
              >
                <UserPlus className="w-4 h-4" /> {t('addNew')}
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
