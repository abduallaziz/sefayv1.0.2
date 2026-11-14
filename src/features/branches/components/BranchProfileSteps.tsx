'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Input } from '@/shared/ui/input'
import { Switch } from '@/shared/ui/switch'
import { SimpleSelect } from '@/features/tables/components/SimpleSelect'
import { TimeSelect } from '@/features/tables/components/TimeSelect'
import { SectionErrorBoundary } from '@/features/users/components/SectionErrorBoundary'
import { toEnglishDigits } from '@/features/customers/lib/customer-input'
import {
  BranchDraft,
  FieldErrors,
  FOOTER_MAX,
  NAME_MAX,
  WEEKDAYS,
  normalizeShortCode,
  suggestShortCode,
} from '../lib/branch-draft'

// Leaflet touches `window` at module load: client-only.
const LocationMapPicker = dynamic(() => import('@/shared/ui/location-map-picker').then((m) => m.LocationMapPicker), {
  ssr: false,
})

export interface StepProps {
  draft: BranchDraft
  patch: (p: Partial<BranchDraft>) => void
  errors: FieldErrors
}

const LABEL = 'block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary'
const HINT = 'mt-1 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary'

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs text-posCloud-danger">
          {error}
        </p>
      ) : hint ? (
        <p className={HINT}>{hint}</p>
      ) : null}
    </div>
  )
}

/** Maps an error key from branch-draft to its translated message. */
function useErr(errors: FieldErrors) {
  const t = useTranslations('branches.wizard.errors')
  return (k: string) => (errors[k] ? t(errors[k] as string) : undefined)
}

export function IdentityStep({ draft, patch, errors }: StepProps) {
  const t = useTranslations('branches')
  const w = useTranslations('branches.wizard')
  const err = useErr(errors)
  const radiusN = Number(toEnglishDigits(draft.radius))
  return (
    <div className="space-y-4">
      <Field id="bw-name" label={`${t('name')} *`} error={err('name')}>
        <Input
          id="bw-name"
          value={draft.name}
          maxLength={NAME_MAX}
          aria-invalid={!!errors.name}
          aria-required="true"
          placeholder={t('namePlaceholder')}
          onChange={(e) => {
            const name = e.target.value
            patch({
              name,
              ...(draft.shortCodeTouched ? {} : { shortCode: suggestShortCode(name) }),
            })
          }}
        />
      </Field>
      <Field id="bw-code" label={w('shortCode')} error={err('shortCode')} hint={w('shortCodeHint')}>
        <Input
          id="bw-code"
          dir="ltr"
          value={draft.shortCode}
          maxLength={6}
          aria-invalid={!!errors.shortCode}
          placeholder="RYD"
          className="uppercase"
          onChange={(e) => patch({ shortCode: normalizeShortCode(e.target.value), shortCodeTouched: true })}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="bw-city" label={w('city')} error={err('city')}>
          <Input id="bw-city" value={draft.city} maxLength={100} onChange={(e) => patch({ city: e.target.value })} />
        </Field>
        <Field id="bw-phone" label={w('phone')} error={err('phone')}>
          <Input
            id="bw-phone"
            dir="ltr"
            inputMode="tel"
            value={draft.phone}
            maxLength={20}
            aria-invalid={!!errors.phone}
            placeholder="05XXXXXXXX"
            onChange={(e) => patch({ phone: toEnglishDigits(e.target.value) })}
          />
        </Field>
      </div>
      <Field id="bw-email" label={w('email')} error={err('email')}>
        <Input
          id="bw-email"
          dir="ltr"
          type="email"
          value={draft.email}
          maxLength={120}
          aria-invalid={!!errors.email}
          placeholder="branch@company.com"
          onChange={(e) => patch({ email: e.target.value })}
        />
      </Field>
      <Field id="bw-address" label={t('address')} error={err('address')}>
        <Input
          id="bw-address"
          value={draft.address}
          maxLength={255}
          placeholder={t('addressPlaceholder')}
          onChange={(e) => patch({ address: e.target.value })}
        />
      </Field>
      <div className="rounded-xl border border-posCloud-border dark:border-posCloudDark-border p-3 space-y-3">
        <div>
          <p className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{w('mapTitle')}</p>
          <p className={HINT}>{w('mapHint')}</p>
        </div>
        <SectionErrorBoundary
          resetKey={`${draft.lat}|${draft.lng}|${draft.radius}`}
          fallback={<p className="text-xs text-posCloud-warning py-3">{w('mapUnavailable')}</p>}
        >
          <LocationMapPicker
            lat={draft.lat}
            lng={draft.lng}
            radiusM={Number.isFinite(radiusN) && radiusN > 0 ? radiusN : null}
            onPick={(lat, lng) => patch({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) })}
          />
        </SectionErrorBoundary>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Field id="bw-radius" label={w('radius')} error={err('radius')}>
              <Input
                id="bw-radius"
                dir="ltr"
                inputMode="numeric"
                value={draft.radius}
                maxLength={6}
                aria-invalid={!!errors.radius}
                onChange={(e) => patch({ radius: toEnglishDigits(e.target.value).replace(/\D/g, '') })}
              />
            </Field>
          </div>
          {draft.lat != null && draft.lng != null && (
            <button
              type="button"
              className="text-xs text-posCloud-danger underline pb-2.5"
              onClick={() => patch({ lat: null, lng: null })}
            >
              {w('clearLocation')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function WarehouseStep({ draft, patch, defaultName }: Pick<StepProps, 'draft' | 'patch'> & { defaultName: string }) {
  const w = useTranslations('branches.wizard')
  return (
    <div className="space-y-4">
      <Field id="bw-wh" label={w('warehouseName')} hint={w('warehouseHint')}>
        <Input
          id="bw-wh"
          value={draft.warehouseTouched ? draft.warehouseName : defaultName}
          maxLength={120}
          onChange={(e) => patch({ warehouseName: e.target.value, warehouseTouched: true })}
        />
      </Field>
      <p className="rounded-xl bg-posCloud-primary-light dark:bg-posCloud-primary/10 p-3 text-xs text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
        {w('warehouseOwn')}
      </p>
    </div>
  )
}

export function TaxStep({ draft, patch, errors }: StepProps) {
  const w = useTranslations('branches.wizard')
  const err = useErr(errors)
  return (
    <div className="space-y-4">
      <Field id="bw-vat" label={w('vat')} error={err('vat')} hint={w('vatHint')}>
        <Input
          id="bw-vat"
          dir="ltr"
          inputMode="numeric"
          value={draft.vat}
          maxLength={15}
          aria-invalid={!!errors.vat}
          placeholder="3XXXXXXXXXXXXX3"
          onChange={(e) => patch({ vat: toEnglishDigits(e.target.value).replace(/\D/g, '') })}
        />
      </Field>
      <Field id="bw-cr" label={w('cr')} error={err('cr')}>
        <Input
          id="bw-cr"
          dir="ltr"
          inputMode="numeric"
          value={draft.cr}
          maxLength={20}
          aria-invalid={!!errors.cr}
          onChange={(e) => patch({ cr: toEnglishDigits(e.target.value).replace(/\D/g, '') })}
        />
      </Field>
      <Field id="bw-footer" label={w('footer')} error={err('footer')} hint={`${draft.footer.length} / ${FOOTER_MAX}`}>
        <textarea
          id="bw-footer"
          rows={3}
          value={draft.footer}
          aria-invalid={!!errors.footer}
          placeholder={w('footerPlaceholder')}
          onChange={(e) => patch({ footer: e.target.value })}
          className="w-full rounded-xl border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3 py-2 text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40"
        />
      </Field>
      <div>
        <span className={LABEL}>{w('printer')}</span>
        <SimpleSelect
          value={draft.printer || 'none'}
          onChange={(v) => patch({ printer: v === 'none' ? '' : (v as '58mm' | '80mm') })}
          ariaLabel={w('printer')}
          options={[
            { value: 'none', label: w('printerDefault') },
            { value: '58mm', label: '58 mm' },
            { value: '80mm', label: '80 mm' },
          ]}
        />
      </div>
      <p className="rounded-xl bg-posCloud-background dark:bg-posCloudDark-border/40 p-3 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
        {w('taxNote')}
      </p>
    </div>
  )
}

export function HoursStep({ draft, patch, errors }: StepProps) {
  const w = useTranslations('branches.wizard')
  const d = useTranslations('branches.wizard.days')
  const err = useErr(errors)
  const setDay = (day: (typeof WEEKDAYS)[number], p: Partial<BranchDraft['hours']['mon']>) =>
    patch({ hours: { ...draft.hours, [day]: { ...draft.hours[day], ...p } } })
  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-3 rounded-xl border border-posCloud-border dark:border-posCloudDark-border p-3">
        <span className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{w('hoursEnable')}</span>
        <Switch checked={draft.hoursEnabled} onCheckedChange={(v) => patch({ hoursEnabled: v })} aria-label={w('hoursEnable')} />
      </label>
      {draft.hoursEnabled && (
        <ul className="space-y-2">
          {WEEKDAYS.map((day) => {
            const h = draft.hours[day]
            return (
              <li
                key={day}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-posCloud-border dark:border-posCloudDark-border p-3"
              >
                <span className="w-20 text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{d(day)}</span>
                <Switch
                  checked={!h.closed}
                  onCheckedChange={(v) => setDay(day, { closed: !v })}
                  aria-label={`${d(day)} - ${w('open')}`}
                />
                {h.closed ? (
                  <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{w('closed')}</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <TimeSelect
                      value={h.open}
                      onChange={(v) => setDay(day, { open: v })}
                      hourLabel={`${d(day)} ${w('opensAt')} - ${w('hour')}`}
                      minuteLabel={`${d(day)} ${w('opensAt')} - ${w('minute')}`}
                    />
                    <span className="text-xs text-posCloud-text-tertiary">{w('to')}</span>
                    <TimeSelect
                      value={h.close}
                      onChange={(v) => setDay(day, { close: v })}
                      hourLabel={`${d(day)} ${w('closesAt')} - ${w('hour')}`}
                      minuteLabel={`${d(day)} ${w('closesAt')} - ${w('minute')}`}
                    />
                  </div>
                )}
                {err(day) && (
                  <p role="alert" className="basis-full text-xs text-posCloud-danger">
                    {err(day)}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
