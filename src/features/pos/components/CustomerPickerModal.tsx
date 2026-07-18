'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, UserPlus } from 'lucide-react'
import { useCustomerSearch, useCustomerFieldDefinitions, useCreateCustomer } from '@/features/customers/hooks/useCustomers'
import { useProfile } from '@/features/settings/hooks/useSettings'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'
import { NumberInput } from '@/shared/ui/number-input'
import { Button } from '@/shared/ui/button'
import type { Customer } from '@/features/customers/types/customer.types'

interface Props {
  onSelect: (customer: Customer) => void
  onClose: () => void
}

const inputClass = 'w-full px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary'

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
          <label className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mb-1 block">
            {t('name')} <span className="text-posCloud-danger">*</span>
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
        <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-center py-2">{t('noActiveFields')}</p>
      )}

      {activeFields.map(field => (
        <div key={field.field_key}>
          <label className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mb-1 block">
            {field.label_ar} {field.required && <span className="text-posCloud-danger">*</span>}
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
          ) : field.field_type === 'number' ? (
            <NumberInput
              value={values[field.field_key] ?? ''}
              onChange={v => setValues(p => ({ ...p, [field.field_key]: v }))}
              className={inputClass}
              autoFocus={field.sort_order === activeFields[0]?.sort_order}
            />
          ) : (
            <input
              type="text"
              value={values[field.field_key] ?? ''}
              onChange={e => setValues(p => ({ ...p, [field.field_key]: e.target.value }))}
              className={inputClass}
              autoFocus={field.sort_order === activeFields[0]?.sort_order}
            />
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending || missingRequired}
          className="flex-1"
        >
          {createMutation.isPending ? t('saving') : t('save')}
        </Button>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-2xl w-full max-w-md shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-posCloud-border dark:border-posCloudDark-border">
          <h3 className="font-bold text-lg text-posCloud-text-primary dark:text-posCloudDark-text-primary">{mode === 'search' ? t('selectTitle') : t('newTitle')}</h3>
          <button onClick={onClose} className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {mode === 'search' ? (
            <>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className={`${inputClass} pe-9`}
                  autoFocus
                />
              </div>

              {isLoading && <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-center py-4">{t('searching')}</p>}

              {!isLoading && search.trim().length >= 2 && (results ?? []).length === 0 && (
                <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-center py-4">{t('noMatch')}</p>
              )}

              <div className="space-y-1.5">
                {(results ?? []).map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => onSelect(customer)}
                    className="w-full text-start p-3 rounded-lg bg-posCloud-background dark:bg-posCloudDark-background hover:bg-slate-100 dark:hover:bg-white/10 border border-posCloud-border dark:border-posCloudDark-border transition-colors"
                  >
                    <p className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{customer.full_name || '—'}</p>
                    {customer.phone && <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" dir="ltr">{customer.phone}</p>}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setMode('add')}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-posCloud-border dark:border-posCloudDark-border text-posCloud-primary hover:border-posCloud-primary rounded-lg text-sm"
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
