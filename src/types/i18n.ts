import type en_common from '../../messages/en/common.json'
import type en_shell from '../../messages/en/shell.json'
import type en_superadmin from '../../messages/en/superadmin.json'
import type en_dashboard from '../../messages/en/dashboard.json'
import type en_orders from '../../messages/en/orders.json'
import type en_pos from '../../messages/en/pos.json'
import type en_expenses from '../../messages/en/expenses.json'

export type Messages = {
  common: typeof en_common
  shell: typeof en_shell
  superadmin: typeof en_superadmin
  dashboard: typeof en_dashboard
  orders: typeof en_orders
  pos: typeof en_pos
  expenses: typeof en_expenses
}

declare global {
  // next-intl's documented global-augmentation contract requires an `interface`
  // here (declaration merging into its own global `IntlMessages` lookup, which
  // every `useTranslations()` call site relies on for key type-checking) — a
  // `type` alias cannot merge the same way, so this can't be rewritten without
  // breaking message-key typing app-wide. Empty body is inherent to the pattern.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}