import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  const loadNamespace = async (ns: string) => {
    try {
      return (await import(`../../messages/${locale}/${ns}.json`)).default
    } catch {
      return {}
    }
  }

  const loadLegacy = async (file: string) => {
    try {
      return (await import(`../../messages/${file}.json`)).default
    } catch {
      return {}
    }
  }

  const [
    common,
    shell,
    superadmin,
    dashboard,
    orders,
    pos,
    expenses,
    items,
    settings,
    users,
    reports,
    legacyRoot,
    legacyDashboard,
    legacyItems,
    legacyCustomers,
  ] = await Promise.all([
    loadNamespace('common'),
    loadNamespace('shell'),
    loadNamespace('superadmin'),
    loadNamespace('dashboard'),
    loadNamespace('orders'),
    loadNamespace('pos'),
    loadNamespace('expenses'),
    loadNamespace('items'),
    loadNamespace('settings'),
    loadNamespace('users'),
    loadNamespace('reports'),
    loadLegacy(locale),
    loadLegacy(`${locale}/dashboard`),
    loadLegacy(`${locale}/items`),
    loadLegacy(`${locale}/customers`),
  ])

  return {
    locale,
    messages: {
      common,
      shell,
      superadmin,
      users,
      reports,
      dashboard: {
        ...(legacyDashboard?.dashboard ?? {}),
        ...dashboard,
      },
      orders,
      pos,
      expenses,
      items,
      settings,
      ...legacyRoot,
      ...legacyItems,
      ...legacyCustomers,
    }
  }
})