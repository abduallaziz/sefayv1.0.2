'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/shared/ui/sheet'
import { EmptyState } from '@/shared/ui/empty-state'
import { useExpenseActivity } from '../hooks/useExpensesCore'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
  expenseId: string | null
}

export function ExpenseActivitySheet({ open, onOpenChange, branchId, expenseId }: Props) {
  const t = useTranslations('expensesV2.expensesCore.activityDrawer')
  const tSource = useTranslations('expensesV2.expensesCore.source')
  const locale = useLocale()
  const fmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })
  // Notes written by the server are English ("source: manual"): translate the known shape.
  const noteText = (note: string) => {
    const m = /^source:\s*(manual|quick|recurring|pos)$/i.exec(note.trim())
    return m ? `${tSource('label')}: ${tSource(m[1].toLowerCase() as never)}` : note
  }
  const activity = useExpenseActivity(open ? branchId : undefined, open ? expenseId : null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end">
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          {!activity.data || activity.data.length === 0 ? (
            <EmptyState title={t('empty')} theme="dashboard" size="sm" />
          ) : (
            <ol className="relative border-s border-posCloud-border dark:border-posCloudDark-border ps-4 space-y-4">
              {activity.data.map((a) => (
                <li key={a.id}>
                  <div className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                    {t(`actions.${a.action}`)}
                  </div>
                  {a.note && (
                    <div className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                      {noteText(a.note)}
                    </div>
                  )}
                  <div className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                    {fmt.format(new Date(a.created_at))}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
