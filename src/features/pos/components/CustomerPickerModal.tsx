'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Search, UserPlus, Car, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useCustomerSearch, useCustomerFieldDefinitions } from '@/features/customers/hooks/useCustomers'
import { customersApi } from '@/features/customers/api/customers.api'
import { useProfile } from '@/features/settings/hooks/useSettings'
import { ApiError } from '@/lib/api'
import { useEscape } from '@/lib/use-escape'
import { formatDate } from '@/lib/format'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'
import { NumberInput } from '@/shared/ui/number-input'
import { Button } from '@/shared/ui/button'
import type {
  Customer,
  CustomerCapture,
  CustomerLookupResult,
} from '@/features/customers/types/customer.types'

interface Props {
  /**
   * `capture` carries the phone/plate/size the server resolves when the sale
   * is confirmed (T12): an existing customer + car is attached, a new one is
   * created there — never twice.
   */
  onSelect: (customer: Customer, capture?: CustomerCapture) => void
  onClose: () => void
}

const inputClass = 'w-full px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary'
const mutedClass = 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary'
const SIZES = ['small', 'medium', 'large', 'xlarge'] as const

function toEnglishDigits(v: string): string {
  return v
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
}

/** A box with only digits/separators and 7+ digits is a phone; anything else is a plate. */
function detectKind(raw: string): 'phone' | 'plate' {
  const v = raw.trim()
  const digits = toEnglishDigits(v).replace(/\D/g, '')
  return /^[+\d\s\-()٠-٩۰-۹]+$/.test(v) && digits.length >= 7 ? 'phone' : 'plate'
}

function placeholderCustomer(name: string, phone?: string): Customer {
  return {
    id: '',
    full_name: name || phone || '',
    phone: phone ?? null,
    loyalty_points: 0,
  } as unknown as Customer
}

type View =
  | { name: 'smart' }
  | { name: 'create' }
  | { name: 'conflict'; plateCustomer: Customer | null; phoneCustomer: Customer | null; plate?: string }

function CreateForm({
  initialPhone, initialPlate, onCancel, onDone, onConflict,
}: {
  initialPhone: string
  initialPlate: string
  onCancel: () => void
  onDone: (customer: Customer, capture: CustomerCapture) => void
  onConflict: (phone?: string, plate?: string) => void
}) {
  const t = useTranslations('pos.customerPicker')
  const { data: fieldDefs, isLoading: fieldsLoading } = useCustomerFieldDefinitions()
  const { data: profile } = useProfile()
  const nameFieldEnabled = profile?.name_field_enabled ?? false
  const [values, setValues] = useState<Record<string, string>>({})
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState(initialPhone)
  const [plate, setPlate] = useState(initialPlate)
  const [size, setSize] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active = (fieldDefs ?? []).filter((f) => f.is_active).sort((a, b) => a.sort_order - b.sort_order)
  // Phone and plate are the smart box's own fields — never drawn twice.
  const extraFields = active.filter((f) => f.contact_role !== 'phone' && f.contact_role !== 'plate_number')
  // The form shows only what the tenant enabled in Settings: the phone and the
  // plate are fields like any other (the car size belongs with the plate).
  const phoneOn = active.some((f) => f.contact_role === 'phone')
  const plateOn = active.some((f) => f.contact_role === 'plate_number')
  const phoneRequired = active.some((f) => f.contact_role === 'phone' && f.required)
  const plateRequired = active.some((f) => f.contact_role === 'plate_number' && f.required)
  const nothingToFill = !fieldsLoading && !nameFieldEnabled && !phoneOn && !plateOn && extraFields.length === 0

  // A completely blank form must not silently create an anonymous customer.
  const emptyForm =
    !fullName.trim() && !phone.trim() && !plate.trim() && !Object.values(values).some((v) => v?.trim())

  const missingRequired =
    emptyForm ||
    (nameFieldEnabled && !fullName.trim()) ||
    (phoneRequired && !phone.trim()) ||
    (plateRequired && !plate.trim()) ||
    extraFields.some((f) => f.required && !values[f.field_key]?.trim())

  async function handleSubmit() {
    if (missingRequired || checking || nothingToFill) return
    setError(null)
    const custom_fields: Record<string, string | number | boolean> = {}
    for (const field of extraFields) {
      const raw = values[field.field_key]
      if (raw === undefined || raw === '') continue
      if (field.field_type === 'number') custom_fields[field.field_key] = Number(raw)
      else if (field.field_type === 'boolean') custom_fields[field.field_key] = raw === 'true'
      else custom_fields[field.field_key] = raw
    }
    const capture: CustomerCapture = {
      phone: phoneOn ? phone.trim() || undefined : undefined,
      plate: plateOn ? plate.trim() || undefined : undefined,
      size: plateOn ? size || undefined : undefined,
      name: nameFieldEnabled ? fullName.trim() : undefined,
      custom_fields: Object.keys(custom_fields).length ? custom_fields : undefined,
    }

    // Never create a duplicate: if the phone or plate is already registered,
    // the registered customer is used instead (see the smart box).
    if (capture.phone || capture.plate) {
      setChecking(true)
      try {
        const res = await customersApi.lookup({ phone: capture.phone, plate: capture.plate })
        if (res.found && res.customer) {
          onDone(res.customer, { plate: res.vehicle?.plate ?? capture.plate, size: size || res.vehicle?.size || undefined })
          return
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          onConflict(capture.phone, capture.plate)
          return
        }
        setError(t('lookupFailed'))
        return
      } finally {
        setChecking(false)
      }
    }
    onDone(placeholderCustomer(capture.name ?? '', capture.phone), capture)
  }

  const label = 'text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mb-1 block'

  return (
    <div className="space-y-3">
      {nameFieldEnabled && (
        <div>
          <label className={label}>{t('name')} <span className="text-posCloud-danger">*</span></label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} autoFocus />
        </div>
      )}
      {phoneOn && (
        <div>
          <label className={label}>{t('phone')} {phoneRequired && <span className="text-posCloud-danger">*</span>}</label>
          <input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
      )}
      {plateOn && (
        <>
          <div>
            <label className={label}>{t('plate')} {plateRequired && <span className="text-posCloud-danger">*</span>}</label>
            <input type="text" dir="ltr" value={plate} onChange={(e) => setPlate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={label}>{t('size')}</label>
            <div className="flex flex-wrap gap-1.5">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(size === s ? '' : s)}
                  className={`px-3 py-1.5 rounded-lg border text-xs ${size === s
                    ? 'border-posCloud-primary bg-posCloud-primary-light text-posCloud-primary dark:bg-posCloud-primary/15'
                    : 'border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-tertiary'}`}
                >
                  {t(`sizes.${s}`)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {nothingToFill && (
        <p className={`text-sm text-center py-3 ${mutedClass}`}>{t('noActiveFields')}</p>
      )}

      {extraFields.map((field) => (
        <div key={field.field_key}>
          <label className={label}>{field.label_ar} {field.required && <span className="text-posCloud-danger">*</span>}</label>
          {field.field_type === 'select' ? (
            <select value={values[field.field_key] ?? ''} onChange={(e) => setValues((p) => ({ ...p, [field.field_key]: e.target.value }))} className={inputClass}>
              <option value="">—</option>
              {(field.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label_ar}</option>)}
            </select>
          ) : field.field_type === 'boolean' ? (
            <select value={values[field.field_key] ?? ''} onChange={(e) => setValues((p) => ({ ...p, [field.field_key]: e.target.value }))} className={inputClass}>
              <option value="">—</option>
              <option value="true">{t('yes')}</option>
              <option value="false">{t('no')}</option>
            </select>
          ) : field.field_type === 'date' ? (
            <SingleDatePicker value={values[field.field_key] || undefined} onChange={(v) => setValues((p) => ({ ...p, [field.field_key]: v ?? '' }))} />
          ) : field.field_type === 'number' ? (
            <NumberInput value={values[field.field_key] ?? ''} onChange={(v) => setValues((p) => ({ ...p, [field.field_key]: v }))} className={inputClass} />
          ) : (
            <input type="text" value={values[field.field_key] ?? ''} onChange={(e) => setValues((p) => ({ ...p, [field.field_key]: e.target.value }))} className={inputClass} />
          )}
        </div>
      ))}

      {error && <p className="text-xs text-posCloud-danger">{error}</p>}

      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={onCancel} className="flex-1">{t('cancel')}</Button>
        <Button onClick={handleSubmit} disabled={checking || missingRequired || nothingToFill} className="flex-1">
          {checking ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  )
}

function MatchCard({
  result, onConfirm, showVehicles,
}: {
  result: CustomerLookupResult
  onConfirm: (customer: Customer, capture?: CustomerCapture) => void
  /** Cars only exist for tenants that enabled the plate field. */
  showVehicles: boolean
}) {
  const t = useTranslations('pos.customerPicker')
  const locale = useLocale()
  const customer = result.customer!
  const vehicles = showVehicles ? result.vehicles : []
  const [vehicleId, setVehicleId] = useState<string | null>(showVehicles ? result.vehicle?.id ?? null : null)
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const needsPick = vehicles.length > 1 && !result.vehicle
  const chosen = vehicles.find((v) => v.id === vehicleId) ?? null

  return (
    <div className="rounded-xl border border-posCloud-primary/40 bg-posCloud-primary-light/40 dark:bg-posCloud-primary/10 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-posCloud-success mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">{customer.full_name || '—'}</p>
          {customer.phone && <p className={`text-xs ${mutedClass}`} dir="ltr">{customer.phone}</p>}
        </div>
      </div>

      {result.stats && (
        <p className={`text-xs ${mutedClass}`}>
          {t('visits', { count: result.stats.visit_count })}
          {result.stats.last_visit_at ? ` · ${t('lastVisit')}: ${formatDate(result.stats.last_visit_at, locale)}` : ''}
          {` · ${t('totalSpent')}: ${fmt(result.stats.total_spent)}`}
        </p>
      )}

      {vehicles.length > 0 && (
        <div className="space-y-1">
          {needsPick && <p className="text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('pickCar')}</p>}
          {vehicles.map((v) => {
            const selectable = vehicles.length > 1
            const active = v.id === vehicleId
            return (
              <button
                key={v.id}
                type="button"
                disabled={!selectable}
                onClick={() => setVehicleId(v.id)}
                className={`w-full flex items-center gap-2 text-start px-3 py-2 rounded-lg border text-sm ${active
                  ? 'border-posCloud-primary bg-white dark:bg-posCloudDark-surface'
                  : 'border-posCloud-border dark:border-posCloudDark-border'}`}
              >
                <Car className="w-4 h-4 shrink-0" />
                <span dir="ltr" className="font-medium">{v.plate}</span>
                {v.size && <span className={`text-xs ${mutedClass}`}>{(SIZES as readonly string[]).includes(v.size) ? t(`sizes.${v.size as (typeof SIZES)[number]}`) : v.size}</span>}
              </button>
            )
          })}
        </div>
      )}

      <Button
        className="w-full"
        disabled={needsPick && !chosen}
        onClick={() => onConfirm(customer, chosen ? { plate: chosen.plate, size: chosen.size ?? undefined } : undefined)}
      >
        {t('useCustomer')}
      </Button>
    </div>
  )
}

export function CustomerPickerModal({ onSelect, onClose }: Props) {
  useEscape(onClose)
  const t = useTranslations('pos.customerPicker')
  const [text, setText] = useState('')
  const [debounced, setDebounced] = useState('')
  const [view, setView] = useState<View>({ name: 'smart' })

  useEffect(() => {
    const id = setTimeout(() => setDebounced(text.trim()), 350)
    return () => clearTimeout(id)
  }, [text])

  // What the box looks up follows the fields the tenant enabled: both phone and
  // plate -> auto-detect; only one of them -> that one; neither -> a plain
  // search (the name matches below still work).
  const { data: fieldDefs } = useCustomerFieldDefinitions()
  const activeDefs = (fieldDefs ?? []).filter((f) => f.is_active)
  const phoneOn = activeDefs.some((f) => f.contact_role === 'phone')
  const plateOn = activeDefs.some((f) => f.contact_role === 'plate_number')
  // Capture is on but the owner left nothing to capture (no active field, no
  // name field): the cashier can neither find nor register anyone, so say why
  // and what to do instead of leaving a dead-end form.
  const { data: pickerProfile } = useProfile()
  const noFieldsConfigured = fieldDefs !== undefined && activeDefs.length === 0 && pickerProfile !== undefined && !pickerProfile.name_field_enabled
  const mode: 'both' | 'phone' | 'plate' | 'none' =
    phoneOn && plateOn ? 'both' : phoneOn ? 'phone' : plateOn ? 'plate' : 'none'
  const kind: 'phone' | 'plate' = mode === 'both' ? detectKind(debounced) : mode === 'plate' ? 'plate' : 'phone'
  const placeholder =
    mode === 'both' ? t('smartPlaceholder')
    : mode === 'phone' ? t('smartPlaceholderPhone')
    : mode === 'plate' ? t('smartPlaceholderPlate')
    : t('searchPlaceholder')
  const hint =
    mode === 'both' ? t('smartHint')
    : mode === 'phone' ? t('smartHintPhone')
    : mode === 'plate' ? t('smartHintPlate')
    : null
  const notFoundText =
    mode === 'both' ? t('notFound')
    : mode === 'phone' ? t('notFoundPhone')
    : mode === 'plate' ? t('notFoundPlate')
    : t('noMatch')
  const ready = debounced.length >= 3
  const { data: result, isFetching } = useQuery({
    queryKey: ['customers', 'lookup', kind, debounced],
    queryFn: () => customersApi.lookup(kind === 'phone' ? { phone: debounced } : { plate: debounced }),
    enabled: ready && view.name === 'smart',
    // A customer is created when the sale completes, so a "not found" cached
    // earlier in the session goes stale right after. Always look it up fresh.
    staleTime: 0,
    gcTime: 0,
  })
  const { data: nameMatches } = useCustomerSearch(ready && result && !result.found ? debounced : '')

  // Phone and plate belong to two different customers: show both, offer ONLY
  // the registered customer (the car's owner) or going back to correct. No merge.
  async function handleConflict(phone?: string, plate?: string) {
    const [byPhone, byPlate] = await Promise.all([
      phone ? customersApi.lookup({ phone }).catch(() => null) : null,
      plate ? customersApi.lookup({ plate }).catch(() => null) : null,
    ])
    setView({ name: 'conflict', phoneCustomer: byPhone?.customer ?? null, plateCustomer: byPlate?.customer ?? null, plate })
  }

  const empty = text.trim().length === 0

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-2xl w-full max-w-md shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-posCloud-border dark:border-posCloudDark-border">
          <h3 className="font-bold text-lg text-posCloud-text-primary dark:text-posCloudDark-text-primary">
            {view.name === 'create' ? t('newTitle') : t('selectTitle')}
          </h3>
          <button onClick={onClose} aria-label={t('cancel')} className={`${mutedClass} hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary text-xl`}>✕</button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {view.name === 'smart' && noFieldsConfigured && (
            <div className="flex items-start gap-2 rounded-xl border border-posCloud-warning/40 bg-posCloud-warning-light p-3 dark:bg-posCloud-warning/15">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-posCloud-warning" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('noFieldsTitle')}</p>
                <p className={`text-xs ${mutedClass}`}>{t('noFieldsBody')}</p>
              </div>
            </div>
          )}

          {view.name === 'smart' && !noFieldsConfigured && (
            <>
              <div className="relative">
                <Search className={`absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedClass}`} />
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={placeholder}
                  className={`${inputClass} pe-9`}
                  dir="auto"
                  autoFocus
                />
              </div>

              {empty && hint && <p className={`text-xs text-center ${mutedClass}`}>{hint}</p>}
              {!empty && !ready && <p className={`text-xs text-center ${mutedClass}`}>{t('keepTyping')}</p>}
              {ready && (isFetching || !result) && <p className={`text-sm text-center py-4 ${mutedClass}`}>{t('searching')}</p>}

              {ready && result?.found && result.customer && (
                <MatchCard key={result.customer.id + (result.vehicle?.id ?? '')} result={result} onConfirm={onSelect} showVehicles={plateOn} />
              )}

              {ready && result && !result.found && !isFetching && (
                <div className="space-y-2">
                  <p className={`text-sm text-center py-2 ${mutedClass}`}>{notFoundText}</p>
                  {(nameMatches ?? []).slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelect(c)}
                      className="w-full text-start p-3 rounded-lg bg-posCloud-background dark:bg-posCloudDark-background hover:bg-slate-100 dark:hover:bg-white/10 border border-posCloud-border dark:border-posCloudDark-border transition-colors"
                    >
                      <p className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{c.full_name || '—'}</p>
                      {c.phone && <p className={`text-xs ${mutedClass}`} dir="ltr">{c.phone}</p>}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setView({ name: 'create' })}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-posCloud-border dark:border-posCloudDark-border text-posCloud-primary hover:border-posCloud-primary rounded-lg text-sm"
              >
                <UserPlus className="w-4 h-4" /> {t('addNew')}
              </button>
            </>
          )}

          {view.name === 'create' && (
            <CreateForm
              initialPhone={kind === 'phone' ? text.trim() : ''}
              initialPlate={kind === 'plate' ? text.trim() : ''}
              onCancel={() => setView({ name: 'smart' })}
              onDone={onSelect}
              onConflict={handleConflict}
            />
          )}

          {view.name === 'conflict' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl border border-posCloud-danger/40 bg-posCloud-danger/10 p-3">
                <AlertTriangle className="w-4 h-4 text-posCloud-danger mt-0.5 shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('conflictTitle')}</p>
                  <p className={`text-xs ${mutedClass}`}>{t('conflictBody')}</p>
                  {view.phoneCustomer && <p className="text-xs">{t('conflictPhoneOf')}: <b>{view.phoneCustomer.full_name || '—'}</b></p>}
                  {view.plateCustomer && <p className="text-xs">{t('conflictPlateOf')}: <b>{view.plateCustomer.full_name || '—'}</b></p>}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setView({ name: 'create' })}>{t('backToCorrect')}</Button>
                {view.plateCustomer && (
                  <Button className="flex-1" onClick={() => onSelect(view.plateCustomer!, view.plate ? { plate: view.plate } : undefined)}>{t('useRegistered')}</Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
