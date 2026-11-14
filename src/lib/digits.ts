const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩'
const EXT_ARABIC_INDIC = '۰۱۲۳۴۵۶۷۸۹'

/** Converts Arabic-Indic / Persian digits to Western 0-9 (project rule: English numerals everywhere). */
export function toEnglishDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXT_ARABIC_INDIC.indexOf(d)))
}

/** Lower-cased, space-collapsed key used to detect duplicate free-text entries. */
export function dupKey(value: string): string {
  return toEnglishDigits(value).replace(/\s+/g, ' ').trim().toLowerCase()
}

/** Plate comparison key: no spaces/dashes, upper-case, English digits (mirrors the API). */
export function plateKey(value: string): string {
  return toEnglishDigits(value).replace(/[\s\-_.]/g, '').toUpperCase()
}

/** Parses a whole number typed by the user; null when empty or not an integer. */
export function parseIntStrict(value: string): number | null {
  const v = toEnglishDigits(value).trim()
  return /^\d+$/.test(v) ? Number(v) : null
}
