// Helpers for numeric text inputs: normalise Arabic-Indic / Persian digits and
// the Arabic decimal separator to Western ones, then parse strictly (no silent
// "abc" -> 0).

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

export function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)))
    .replace(/[٫,]/g, '.')
    .replace(/[٬\s]/g, '');
}

/** Returns a finite number, or null when the text is empty / not a number. */
export function parseStrictNumber(value: string): number | null {
  const v = normalizeDigits(value.trim());
  if (v === '') return null;
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
