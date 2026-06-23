export const formatNumber = (value: number, decimals = 2): string =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

export const formatCurrency = (value: number, currency = '\uFDFC'): string =>
  `${formatNumber(value)} ${currency}`

export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

export const formatDateTime = (date: string): string =>
  new Date(date).toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  })