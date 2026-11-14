// Input rules shared by the customer forms. Mirrors the API's checkContactValues
// (api/src/modules/customers/customer-normalize.ts) so the client rejects what
// the server would reject, with a translated inline message.

export const PHONE_MAX_LENGTH = 20;
export const PLATE_MAX_LENGTH = 20;
export const NAME_MAX_LENGTH = 100;

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EXT_ARABIC_INDIC = '۰۱۲۳۴۵۶۷۸۹';

/** Arabic-Indic / Persian digits -> English 0-9 (the project-wide numerals rule). */
export function toEnglishDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXT_ARABIC_INDIC.indexOf(d)));
}

/** True when the phone is 7-20 digits with only + space - allowed (Arabic digits are converted first). */
export function isValidPhone(value: string): boolean {
  const v = toEnglishDigits(value).trim();
  if (!/^\+?[\d\s-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, '').length;
  return digits >= 7 && digits <= PHONE_MAX_LENGTH && v.length <= PHONE_MAX_LENGTH;
}
