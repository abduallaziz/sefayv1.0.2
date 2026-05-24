type Locale = 'ar' | 'en'

interface FormatCurrencyOptions {
  locale: Locale
  currency?: string
}

interface FormatDateOptions {
  locale: Locale
  format?: 'short' | 'long' | 'relative'
  timezone?: string
}

interface FormatNumberOptions {
  locale: Locale
  decimals?: number
}

const LOCALE_MAP: Record<Locale, string> = {
  ar: 'ar-SA',
  en: 'en-US',
}

const CURRENCY_MAP: Record<Locale, string> = {
  ar: 'SAR',
  en: 'USD',
}

export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions
): string {
  const { locale, currency } = options
  return new Intl.NumberFormat(LOCALE_MAP[locale], {
    style: 'currency',
    currency: currency ?? CURRENCY_MAP[locale],
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(
  date: string | Date,
  options: FormatDateOptions
): string {
  const { locale, format = 'short', timezone } = options
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'relative') {
    const diff = Date.now() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (locale === 'ar') {
      if (minutes < 1) return 'الآن'
      if (minutes < 60) return `منذ ${minutes} دقيقة`
      if (hours < 24) return `منذ ${hours} ساعة`
      return `منذ ${days} يوم`
    } else {
      if (minutes < 1) return 'just now'
      if (minutes < 60) return `${minutes}m ago`
      if (hours < 24) return `${hours}h ago`
      return `${days}d ago`
    }
  }

  return new Intl.DateTimeFormat(LOCALE_MAP[locale], {
    timeZone: timezone ?? 'Asia/Riyadh',
    ...(format === 'short'
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
  }).format(d)
}

export function formatNumber(
  value: number,
  options: FormatNumberOptions
): string {
  const { locale, decimals = 0 } = options
  return new Intl.NumberFormat(LOCALE_MAP[locale], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}