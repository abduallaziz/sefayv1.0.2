import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  const loadFile = async (path: string) => {
    try {
      return (await import(`../../messages/${path}`)).default
    } catch {
      return {}
    }
  }

  const [
    root,
    common,
    shell,
    dashboard,
    pos,
    orders,
    expenses,
    items,
    settings,
    users,
    reports,
    customers,
    shifts,
    superadmin,
    subscriptions,
    purchasing,
    inventory,
    suppliers,
    warehouses,
  ] = await Promise.all([
    loadFile(`${locale}.json`),
    loadFile(`${locale}/common.json`),
    loadFile(`${locale}/shell.json`),
    loadFile(`${locale}/dashboard.json`),
    loadFile(`${locale}/pos.json`),
    loadFile(`${locale}/orders.json`),
    loadFile(`${locale}/expenses.json`),
    loadFile(`${locale}/items.json`),
    loadFile(`${locale}/settings.json`),
    loadFile(`${locale}/users.json`),
    loadFile(`${locale}/reports.json`),
    loadFile(`${locale}/customers.json`),
    loadFile(`${locale}/shifts.json`),
    loadFile(`${locale}/superadmin.json`),
    loadFile(`${locale}/subscriptions.json`),
    loadFile(`${locale}/purchasing.json`),
    loadFile(`${locale}/inventory.json`),
    loadFile(`${locale}/suppliers.json`),
    loadFile(`${locale}/warehouses.json`),
  ])

  return {
    locale,
    messages: {
      ...root,
      common: { ...root.common, ...common },
      shell: { ...shell, ...root.shell },
      dashboard: { ...root.dashboard, ...dashboard },
      pos,
      orders,
      expenses: { 
        ...root.expenses, 
        ...expenses,
        actions: { ...root.expenses?.actions, ...expenses?.actions },
        status: { ...root.expenses?.status, ...expenses?.status },
        cancel: { ...root.expenses?.cancel, ...expenses?.cancel },
        reject: { ...root.expenses?.reject, ...expenses?.reject },
      },
      items: { ...root.items, ...items },
      settings,
      users,
      reports: { ...root.reports, ...reports },
      customers: { ...root.customers, ...customers },
      shifts: { ...root.shifts, ...shifts },
      superadmin,
      subscriptions,
      purchasing,
      inventory,
      suppliers,
      warehouses,
      stock: inventory?.stock,
      adjustments: inventory?.adjustments,
      inventoryDashboard: inventory?.dashboard,
    }
  }
})