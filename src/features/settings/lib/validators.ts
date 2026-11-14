// Pure validators for the settings form, kept free of React so they stay easy to test.

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EXT_ARABIC_INDIC = '۰۱۲۳۴۵۶۷۸۹';

/** Converts Arabic-Indic / Persian digits to 0-9 (the app uses English numerals only). */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXT_ARABIC_INDIC.indexOf(d)));
}

export type TaxRateCheck = { ok: true; value: number } | { ok: false; reason: 'required' | 'range' | 'decimals' };

/** Tax rate typed as a percentage: required, numeric, 0..100, at most 2 decimals. */
export function checkTaxRatePercent(raw: string): TaxRateCheck {
  const text = normalizeDigits(raw).trim();
  if (text === '' || text === '.') return { ok: false, reason: 'required' };
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0 || value > 100) return { ok: false, reason: 'range' };
  if (!/^\d*(\.\d{0,2})?$/.test(text)) return { ok: false, reason: 'decimals' };
  return { ok: true, value };
}

export type VatCheck = 'ok' | 'digits' | 'zatca';

/** Empty is allowed (clears the number). Otherwise 15 digits; with ZATCA also starting and ending with 3. */
export function checkVatNumber(raw: string, zatcaEnabled: boolean): VatCheck {
  const text = normalizeDigits(raw).trim();
  if (text === '') return 'ok';
  if (!/^\d{15}$/.test(text)) return 'digits';
  if (zatcaEnabled && !/^3\d{13}3$/.test(text)) return 'zatca';
  return 'ok';
}

type SubscriptionLike = { status: string; current_period_end: string | null } | null | undefined;

/** Display status: a trial/active subscription whose period already ended is shown as expired. */
export function effectiveSubscriptionStatus(sub: SubscriptionLike, now: Date = new Date()): string {
  if (!sub) return 'none';
  if (
    (sub.status === 'active' || sub.status === 'trial') &&
    sub.current_period_end &&
    new Date(sub.current_period_end).getTime() < now.getTime()
  ) {
    return 'expired';
  }
  return sub.status;
}
