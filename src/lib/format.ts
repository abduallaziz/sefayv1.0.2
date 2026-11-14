export const formatNumber = (value: number, decimals = 2): string =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

export const formatCurrency = (value: number, currency = '\u0631.\u0633'): string =>
  `${formatNumber(value)} ${currency}`

// Arabic UI: Gregorian calendar, day/month order, Arabic AM/PM (ص/م), but ALWAYS
// Western 0-9 numerals (project rule): `-nu-latn-ca-gregory`. English keeps en-US.
const dateLocale = (locale?: string): string =>
  locale === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-US'

export const formatDate = (date: string, locale?: string): string =>
  new Date(date).toLocaleDateString(dateLocale(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

export const formatDateTime = (date: string, locale?: string): string =>
  new Date(date).toLocaleString(dateLocale(locale), {
    dateStyle: 'short',
    timeStyle: 'short',
  })

export const formatTime = (date: string, locale?: string): string =>
  new Date(date).toLocaleTimeString(dateLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
  })

export const formatDateTimeSeconds = (date: string, locale?: string): string =>
  new Date(date).toLocaleString(dateLocale(locale), {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
