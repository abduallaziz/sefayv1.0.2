'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Pencil } from 'lucide-react'
import {
  useCustomerFieldDefinitions,
  useCreateFieldDefinition,
  useUpdateFieldDefinition,
  useDeleteFieldDefinition,
} from '../hooks/useCustomers'
import { useProfile, useUpdateProfile } from '@/features/settings/hooks/useSettings'
import type { ContactRole, CustomFieldType, CustomerFieldDefinition } from '../types/customer.types'

const inputClass = 'w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]'
const labelClass = 'text-xs text-slate-500 mb-1 block'

function optionsToText(options: CustomerFieldDefinition['options']) {
  return (options ?? []).map(o => o.value).join(', ')
}

function parseOptionsText(text: string) {
  return text.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ value: v, label_ar: v, label_en: v }))
}

function useFieldTypeOptions(): { value: CustomFieldType; label: string }[] {
  const t = useTranslations('customers')
  return [
    { value: 'text', label: t('fields.types.text') },
    { value: 'number', label: t('fields.types.number') },
    { value: 'date', label: t('fields.types.date') },
    { value: 'select', label: t('fields.types.select') },
    { value: 'boolean', label: t('fields.types.boolean') },
  ]
}

function AddFieldForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('customers')
  const fieldTypeOptions = useFieldTypeOptions()
  const createMutation = useCreateFieldDefinition()
  const [form, setForm] = useState({
    field_key: '',
    label_ar: '',
    label_en: '',
    field_type: 'text' as CustomFieldType,
    options: '',
    required: false,
    contact_role: '' as ContactRole | '',
  })

  function handleSubmit() {
    if (!form.field_key.trim() || !form.label_ar.trim() || !form.label_en.trim()) return

    const options = form.field_type === 'select' ? parseOptionsText(form.options) : undefined

    if (form.field_type === 'select' && (!options || options.length === 0)) return

    createMutation.mutate({
      field_key: form.field_key.trim(),
      label_ar: form.label_ar.trim(),
      label_en: form.label_en.trim(),
      field_type: form.field_type,
      options,
      required: form.required,
      contact_role: form.contact_role || undefined,
    }, { onSuccess: onClose })
  }

  return (
    <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-slate-50/50 dark:bg-gray-950/50">
      <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-2.5">
        {t('fields.key_hint')}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{t('fields.key_label')}</label>
          <input
            value={form.field_key}
            onChange={e => setForm(p => ({ ...p, field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
            placeholder={t('fields.key_placeholder')}
            dir="ltr"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t('fields.type_label')}</label>
          <select
            value={form.field_type}
            onChange={e => setForm(p => ({ ...p, field_type: e.target.value as CustomFieldType }))}
            className={inputClass}
          >
            {fieldTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t('fields.label_ar_label')}</label>
          <input
            value={form.label_ar}
            onChange={e => setForm(p => ({ ...p, label_ar: e.target.value }))}
            placeholder={t('fields.label_ar_placeholder')}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t('fields.label_en_label')}</label>
          <input
            value={form.label_en}
            onChange={e => setForm(p => ({ ...p, label_en: e.target.value }))}
            placeholder={t('fields.label_en_placeholder')}
            dir="ltr"
            className={inputClass}
          />
        </div>
      </div>

      {form.field_type === 'select' && (
        <div>
          <label className={labelClass}>{t('fields.options_label')}</label>
          <input
            value={form.options}
            onChange={e => setForm(p => ({ ...p, options: e.target.value }))}
            placeholder={t('fields.options_placeholder')}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label className={labelClass}>{t('fields.contact_role_label')}</label>
        <select
          value={form.contact_role}
          onChange={e => setForm(p => ({ ...p, contact_role: e.target.value as ContactRole | '' }))}
          className={inputClass}
        >
          <option value="">{t('fields.contact_role_none')}</option>
          <option value="phone">{t('fields.contact_role_phone')}</option>
          <option value="email">{t('fields.contact_role_email')}</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="field_required"
          checked={form.required}
          onChange={e => setForm(p => ({ ...p, required: e.target.checked }))}
          className="w-4 h-4 accent-[#0C447C]"
        />
        <label htmlFor="field_required" className="text-sm text-slate-600 dark:text-slate-400">{t('fields.required_checkbox')}</label>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm">
          {t('fields.cancel')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending || !form.field_key.trim() || !form.label_ar.trim() || !form.label_en.trim()}
          className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {createMutation.isPending ? t('fields.saving') : t('fields.add')}
        </button>
      </div>
    </div>
  )
}

function EditFieldForm({ field, onClose }: { field: CustomerFieldDefinition; onClose: () => void }) {
  const t = useTranslations('customers')
  const fieldTypeOptions = useFieldTypeOptions()
  const updateMutation = useUpdateFieldDefinition()
  const [form, setForm] = useState({
    label_ar: field.label_ar,
    label_en: field.label_en,
    field_type: field.field_type,
    options: optionsToText(field.options),
    required: field.required,
    contact_role: (field.contact_role ?? '') as ContactRole | '',
  })

  function handleSubmit() {
    if (!form.label_ar.trim() || !form.label_en.trim()) return

    const options = form.field_type === 'select' ? parseOptionsText(form.options) : undefined
    if (form.field_type === 'select' && (!options || options.length === 0)) return

    updateMutation.mutate({
      id: field.id,
      dto: {
        label_ar: form.label_ar.trim(),
        label_en: form.label_en.trim(),
        field_type: form.field_type,
        options,
        required: form.required,
        contact_role: form.contact_role || null,
      },
    }, { onSuccess: onClose })
  }

  return (
    <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-slate-50/50 dark:bg-gray-950/50">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{t('fields.key_readonly_label')}</label>
          <input value={field.field_key} disabled dir="ltr" className={`${inputClass} opacity-60`} />
        </div>
        <div>
          <label className={labelClass}>{t('fields.type_label')}</label>
          <select
            value={form.field_type}
            onChange={e => setForm(p => ({ ...p, field_type: e.target.value as CustomFieldType }))}
            className={inputClass}
          >
            {fieldTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t('fields.label_ar_label')}</label>
          <input
            value={form.label_ar}
            onChange={e => setForm(p => ({ ...p, label_ar: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t('fields.label_en_label')}</label>
          <input
            value={form.label_en}
            onChange={e => setForm(p => ({ ...p, label_en: e.target.value }))}
            dir="ltr"
            className={inputClass}
          />
        </div>
      </div>

      {form.field_type === 'select' && (
        <div>
          <label className={labelClass}>{t('fields.options_label')}</label>
          <input
            value={form.options}
            onChange={e => setForm(p => ({ ...p, options: e.target.value }))}
            placeholder={t('fields.options_placeholder')}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label className={labelClass}>{t('fields.contact_role_label')}</label>
        <select
          value={form.contact_role}
          onChange={e => setForm(p => ({ ...p, contact_role: e.target.value as ContactRole | '' }))}
          className={inputClass}
        >
          <option value="">{t('fields.contact_role_none')}</option>
          <option value="phone">{t('fields.contact_role_phone')}</option>
          <option value="email">{t('fields.contact_role_email')}</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`field_required_${field.id}`}
          checked={form.required}
          onChange={e => setForm(p => ({ ...p, required: e.target.checked }))}
          className="w-4 h-4 accent-[#0C447C]"
        />
        <label htmlFor={`field_required_${field.id}`} className="text-sm text-slate-600 dark:text-slate-400">{t('fields.required_checkbox')}</label>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm">
          {t('fields.cancel')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={updateMutation.isPending || !form.label_ar.trim() || !form.label_en.trim()}
          className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {updateMutation.isPending ? t('fields.saving') : t('fields.save_edit')}
        </button>
      </div>
    </div>
  )
}

export function CustomFieldsManager() {
  const t = useTranslations('customers')
  const { data: fields, isLoading } = useCustomerFieldDefinitions()
  const { data: profile } = useProfile()
  const updateProfileMutation = useUpdateProfile()
  const updateMutation = useUpdateFieldDefinition()
  const deleteMutation = useDeleteFieldDefinition()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-gray-800">
          <div className="flex items-center justify-between py-2.5 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-white">
                {t('fields.name_row.label')} <span className="text-slate-400 text-xs">({t('fields.name_row.label_en')})</span>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {profile?.name_field_enabled
                  ? t('fields.name_row.hint_enabled')
                  : t('fields.name_row.hint_disabled')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => updateProfileMutation.mutate({ name_field_enabled: !profile?.name_field_enabled })}
                disabled={updateProfileMutation.isPending}
                className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                  profile?.name_field_enabled
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                {profile?.name_field_enabled ? t('fields.status.active') : t('fields.status.inactive')}
              </button>
            </div>
          </div>

          {(fields ?? []).length === 0 && !showAdd && (
            <p className="text-sm text-slate-400 py-2">{t('fields.empty')}</p>
          )}
          {(fields ?? []).map(field => (
            editingId === field.id ? (
              <div key={field.id} className="py-2.5">
                <EditFieldForm field={field} onClose={() => setEditingId(null)} />
              </div>
            ) : (
              <div key={field.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">
                    {field.label_ar} <span className="text-slate-400 text-xs">({field.label_en})</span>
                    {field.required && <span className="text-red-500 text-xs ms-1">*</span>}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500" dir="ltr">
                    {field.field_key} · {field.field_type}
                    {field.contact_role && ` · ${field.contact_role === 'phone' ? t('fields.contact_role_phone') : t('fields.contact_role_email')}`}
                  </p>
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
                    {field.required ? t('fields.status.required') : t('fields.status.optional')}
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
                    {field.is_active ? t('fields.status.active') : t('fields.status.inactive')}
                  </button>
                  <button onClick={() => setEditingId(field.id)} className="text-slate-400 hover:text-[#0C447C]">
                    <Pencil className="w-4 h-4" />
                  </button>
                  {confirmDeleteId === field.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteMutation.mutate(field.id, { onSuccess: () => setConfirmDeleteId(null) })} className="text-xs text-red-500 hover:text-red-600">{t('fields.delete_confirm')}</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-slate-400">{t('fields.cancel')}</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(field.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {showAdd ? (
        <AddFieldForm onClose={() => setShowAdd(false)} />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-sm text-[#0C447C] dark:text-[#5B9BD5] hover:text-[#0a3a6b] dark:hover:text-blue-300"
        >
          <Plus className="w-4 h-4" /> {t('fields.add_field')}
        </button>
      )}
    </div>
  )
}
