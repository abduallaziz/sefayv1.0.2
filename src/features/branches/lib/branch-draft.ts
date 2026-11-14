import { toEnglishDigits, isValidPhone } from '@/features/customers/lib/customer-input'
import { checkVatNumber } from '@/features/settings/lib/validators'
import type { BranchRecord, WeekdayKey, WorkingHours, UpdateBranchDto } from '../api/branches.api'

// Week starts on Saturday (Saudi default); keys match the API's working_hours JSON.
export const WEEKDAYS: WeekdayKey[] = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri']

export interface DayDraft {
  open: string
  close: string
  closed: boolean
}

export interface BranchDraft {
  name: string
  shortCode: string
  shortCodeTouched: boolean
  address: string
  city: string
  phone: string
  email: string
  lat: number | null
  lng: number | null
  radius: string
  warehouseName: string
  warehouseTouched: boolean
  vat: string
  cr: string
  footer: string
  printer: '' | '58mm' | '80mm'
  hoursEnabled: boolean
  hours: Record<WeekdayKey, DayDraft>
}

export const FOOTER_MAX = 500
export const NAME_MAX = 100

const defaultHours = (): Record<WeekdayKey, DayDraft> =>
  Object.fromEntries(WEEKDAYS.map((d) => [d, { open: '09:00', close: '22:00', closed: false }])) as Record<
    WeekdayKey,
    DayDraft
  >

export const emptyDraft = (): BranchDraft => ({
  name: '',
  shortCode: '',
  shortCodeTouched: false,
  address: '',
  city: '',
  phone: '',
  email: '',
  lat: null,
  lng: null,
  radius: '100',
  warehouseName: '',
  warehouseTouched: false,
  vat: '',
  cr: '',
  footer: '',
  printer: '',
  hoursEnabled: false,
  hours: defaultHours(),
})

/** Draft pre-filled from an existing branch (edit sheet). */
export function draftFromBranch(b: BranchRecord): BranchDraft {
  const hours = defaultHours()
  for (const d of WEEKDAYS) {
    const h = b.working_hours?.[d]
    if (h) hours[d] = { open: h.open ?? '09:00', close: h.close ?? '22:00', closed: h.closed }
  }
  return {
    ...emptyDraft(),
    name: b.name,
    shortCode: b.short_code ?? '',
    shortCodeTouched: true,
    address: b.address ?? '',
    city: b.city ?? '',
    phone: b.phone ?? '',
    email: b.email ?? '',
    lat: b.geofence_lat,
    lng: b.geofence_lng,
    radius: b.geofence_radius_m != null ? String(b.geofence_radius_m) : '100',
    vat: b.tax_number ?? '',
    cr: b.commercial_registration ?? '',
    footer: b.invoice_footer ?? '',
    printer: b.printer_size ?? '',
    hoursEnabled: !!b.working_hours,
    hours,
  }
}

/** "Riyadh Branch" -> "RB", "فرع الرياض" (no Latin letters) -> '' (user types it). */
export function suggestShortCode(name: string): string {
  const words = toEnglishDigits(name)
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
  if (words.length === 0) return ''
  const code = words.length === 1 ? words[0].slice(0, 3) : words.map((w) => w[0]).join('')
  return code.length >= 2 ? code.slice(0, 6) : (words[0] + '0').slice(0, 2)
}

export const normalizeShortCode = (v: string) =>
  toEnglishDigits(v)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)

export type FieldErrors = Partial<Record<string, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Identity + contact + map. Values are message keys under branches.wizard.errors. */
export function validateIdentity(d: BranchDraft, others: BranchRecord[], editingId?: string): FieldErrors {
  const e: FieldErrors = {}
  const name = d.name.trim()
  if (!name) e.name = 'nameRequired'
  else if (name.length > NAME_MAX) e.name = 'nameTooLong'
  else if (others.some((b) => b.id !== editingId && b.name.trim().toLowerCase() === name.toLowerCase()))
    e.name = 'nameDuplicate'

  if (d.shortCode) {
    if (!/^[A-Z0-9]{2,6}$/.test(d.shortCode)) e.shortCode = 'shortCodeFormat'
    else if (others.some((b) => b.id !== editingId && (b.short_code ?? '').toUpperCase() === d.shortCode))
      e.shortCode = 'shortCodeTaken'
  }
  if (d.address.length > 255) e.address = 'tooLong'
  if (d.city.length > 100) e.city = 'tooLong'
  if (d.phone.trim() && !isValidPhone(d.phone)) e.phone = 'phoneInvalid'
  if (d.email.trim() && (!EMAIL_RE.test(d.email.trim()) || d.email.length > 120)) e.email = 'emailInvalid'
  if (d.lat != null && d.lng != null) {
    const r = Number(toEnglishDigits(d.radius))
    if (!Number.isFinite(r) || r < 1 || r > 100000) e.radius = 'radiusInvalid'
  }
  return e
}

export function validateTax(d: BranchDraft): FieldErrors {
  const e: FieldErrors = {}
  if (checkVatNumber(d.vat, false) !== 'ok') e.vat = 'vatInvalid'
  const cr = toEnglishDigits(d.cr).trim()
  if (cr && !/^\d{4,20}$/.test(cr)) e.cr = 'crInvalid'
  if (d.footer.length > FOOTER_MAX) e.footer = 'footerTooLong'
  return e
}

export function validateHours(d: BranchDraft): FieldErrors {
  const e: FieldErrors = {}
  if (!d.hoursEnabled) return e
  for (const day of WEEKDAYS) {
    const h = d.hours[day]
    if (!h.closed && h.open >= h.close) e[day] = 'hoursOrder'
  }
  return e
}

export const hasErrors = (e: FieldErrors) => Object.keys(e).length > 0

export function buildWorkingHours(d: BranchDraft): WorkingHours | null {
  if (!d.hoursEnabled) return null
  const out: WorkingHours = {}
  for (const day of WEEKDAYS) {
    const h = d.hours[day]
    out[day] = h.closed ? { closed: true } : { open: h.open, close: h.close, closed: false }
  }
  return out
}

/** Profile payload. `clear` sends null for emptied fields (edit) instead of omitting them (create). */
export function buildProfile(d: BranchDraft, clear: boolean): UpdateBranchDto {
  const opt = (v: string): string | null | undefined => {
    const t = v.trim()
    return t ? t : clear ? null : undefined
  }
  const dto: UpdateBranchDto = {
    short_code: opt(d.shortCode),
    city: opt(d.city),
    phone: opt(toEnglishDigits(d.phone)),
    email: opt(d.email),
    tax_number: opt(toEnglishDigits(d.vat).replace(/\s/g, '')),
    commercial_registration: opt(toEnglishDigits(d.cr).replace(/\s/g, '')),
    invoice_footer: opt(d.footer),
    printer_size: d.printer || (clear ? null : undefined),
  }
  const hours = buildWorkingHours(d)
  if (hours) dto.working_hours = hours
  else if (clear) dto.working_hours = null
  if (d.lat != null && d.lng != null) {
    dto.geofence_lat = d.lat
    dto.geofence_lng = d.lng
    dto.geofence_radius_m = Math.round(Number(toEnglishDigits(d.radius)) || 100)
  } else if (clear) {
    dto.geofence_lat = null
    dto.geofence_lng = null
    dto.geofence_radius_m = null
  }
  // Drop undefined keys so JSON stays minimal.
  return Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)) as UpdateBranchDto
}

/** Copy groups of wizard step 5(b) -> publisher entity types. */
export const COPY_GROUPS = [
  { key: 'catalog', types: ['categories', 'brands', 'units', 'items'] },
  { key: 'customerFields', types: ['customer_field_definitions'] },
  { key: 'expenses', types: ['expense_categories_v2', 'expense_departments'] },
  { key: 'shiftPatterns', types: ['shift_patterns'] },
  { key: 'loyaltyTiers', types: ['loyalty_tiers'] },
  { key: 'coupons', types: ['coupons'] },
  { key: 'rewards', types: ['reward_definitions'] },
] as const

export type CopyGroupKey = (typeof COPY_GROUPS)[number]['key']
