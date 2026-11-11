'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ListChecks, Repeat, Zap, Building2, Tag } from 'lucide-react'

// New Expenses — shared cross-page navigation strip. Rendered at the top
// of all 5 related pages (Expenses List, Recurring, Quick Expenses,
// Departments, Categories) so moving between them is consistent and
// obvious, per the Owner-approved navigation/relationship pass. Purely
// presentational — no business logic, no new routes beyond what already
// exists (Departments/Categories still share the single existing
// `/expenses-v2` page, distinguished here only by an in-page anchor).
export function ExpensesSectionNav() {
  const t = useTranslations('expensesV2.nav')
  const locale = useLocale()
  const pathname = usePathname()

  const base = `/${locale}/dashboard/expenses-v2`
  const items = [
    { key: 'list', href: `${base}/expenses`, icon: ListChecks, match: `${base}/expenses` },
    { key: 'recurring', href: `${base}/recurring-expenses`, icon: Repeat, match: `${base}/recurring-expenses` },
    { key: 'quick', href: `${base}/quick-definitions`, icon: Zap, match: `${base}/quick-definitions` },
    { key: 'departments', href: `${base}#departments`, icon: Building2, match: base },
    { key: 'categories', href: `${base}#categories`, icon: Tag, match: base },
  ]

  return (
    <nav className="sticky top-0 z-20 flex flex-wrap items-center gap-1.5 mb-6 pb-4 pt-1 -mx-4 px-4 lg:-mx-6 lg:px-6 border-b border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background">
      {items.map((item) => {
        const isActive = pathname === item.match
        const Icon = item.icon
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors bg-posCloud-primary-light dark:bg-posCloud-primary/15 text-posCloud-primary hover:bg-posCloud-primary/20 dark:hover:bg-posCloud-primary/25 ${
              isActive ? 'font-semibold ring-2 ring-posCloud-primary/40' : ''
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(item.key)}
          </Link>
        )
      })}
    </nav>
  )
}
