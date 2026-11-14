import type { JournalEntriesQuery } from '../api/accounting.api'

type Translator = {
  (key: string): string
  has: (key: string) => boolean
}

// Seeded account names are stored in English. In the UI they are shown through
// the accountNames dictionary (keyed by the slug of the English name); an
// account the owner renamed or added keeps its own stored name.
export function accountLabel(
  account: { code: string; name: string } | undefined,
  t: Translator,
  fallback = '',
): string {
  if (!account) return fallback
  const slug = account.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const name = slug && t.has(slug) ? t(slug) : account.name
  return `${account.code} - ${name}`
}

export type AmountError = 'negative' | 'range' | null

export function getAmountError(filters: Pick<JournalEntriesQuery, 'amount_min' | 'amount_max'>): AmountError {
  const { amount_min: min, amount_max: max } = filters
  if ((min !== undefined && (!Number.isFinite(min) || min < 0)) || (max !== undefined && (!Number.isFinite(max) || max < 0))) {
    return 'negative'
  }
  if (min !== undefined && max !== undefined && min > max) return 'range'
  return null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Order UUID, or an invoice number such as INV-000123.
export function isValidOrderRef(value: string): boolean {
  const v = value.trim()
  return UUID_RE.test(v) || /^[A-Za-z0-9][A-Za-z0-9_\-/]{0,39}$/.test(v)
}

// Short, readable form of a UUID (last 8 chars) with the full value kept for a tooltip.
export function shortId(id: string): string {
  return id.slice(-8)
}
