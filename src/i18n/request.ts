// cache-bust-v3
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
    customers,
    shifts,
    legacyRoot,
    legacyDashboard,
    legacyItems,
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
    loadNamespace('customers'),
    loadNamespace('shifts'),
    loadLegacy(locale),
    loadLegacy(`${locale}/dashboard`),
    loadLegacy(`${locale}/items`),
  ])

  // استخرج legacyRoot بدون المفاتيح اللي عندنا namespaces مخصصة لها
  const { shifts: _s, expenses: _e, customers: _c, ...legacyRootClean } = legacyRoot

  return {
    locale,
    messages: {
      ...legacyRootClean,
      ...legacyItems,
      common,
      shell,
      superadmin,
      users,
      dashboard: {
        ...(legacyDashboard?.dashboard ?? {}),
        ...dashboard,
      },
      orders,
      items,
      settings,
      shifts,
      reports,
      customers,
      expenses,
      pos,
    }
  }
})