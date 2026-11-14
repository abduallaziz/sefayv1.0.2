// Input normalization + validation shared by the employee wizard and detail page.
// Rule (permanent): English 0-9 numerals everywhere, so Arabic-Indic / Persian digits are
// converted as the user types.

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩'
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹'

export function toWesternDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (c) => {
    const i = ARABIC_INDIC.indexOf(c)
    return String(i >= 0 ? i : PERSIAN.indexOf(c))
  })
}

/** Phone: digits (optionally a leading +), spaces/dashes are tolerated and removed on submit. */
export function normalizePhone(value: string): string {
  return toWesternDigits(value).trim().replace(/[\s-]/g, '')
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export function isValidPhone(value: string): boolean {
  return /^\+?\d{7,20}$/.test(normalizePhone(value))
}

export function isValidIdentity(value: string): boolean {
  return /^\d{4,20}$/.test(toWesternDigits(value).trim())
}

/** Parses a user-typed decimal (accepts Arabic digits / comma). Returns NaN when not numeric. */
export function parseNumber(value: string): number {
  const v = toWesternDigits(value).trim().replace(',', '.')
  if (v === '') return NaN
  return /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : NaN
}

export function isValidLatitude(value: string): boolean {
  const n = parseNumber(value)
  return Number.isFinite(n) && n >= -90 && n <= 90
}

export function isValidLongitude(value: string): boolean {
  const n = parseNumber(value)
  return Number.isFinite(n) && n >= -180 && n <= 180
}

export function isPositiveNumber(value: string): boolean {
  const n = parseNumber(value)
  return Number.isFinite(n) && n > 0
}
