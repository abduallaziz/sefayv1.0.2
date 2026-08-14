'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '@/shared/ui/sheet'
import { StatusBadge, StatusTone } from '@/shared/ui/status-badge'
import { SectionCard } from '@/shared/ui/section-card'
import { EmptyState } from '@/shared/ui/empty-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { ApiError } from '@/lib/api'
import { usePriceOverrideAuditDetail } from '../hooks/usePriceOverrideAudit'
import { useJournalEntryDetail } from '../hooks/useJournalEntries'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useItems } from '@/features/items/hooks/useItems'
import { useBranches } from '@/shared/hooks/useBranches'
import { useOrder } from '@/features/orders/hooks/useOrders'

interface Props {
  auditId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canView: boolean
}

const numberFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function formatAmount(value: number): string {
  return numberFormatter.format(value)
}

const directionTone: Record<string, StatusTone> = {
  discount: 'warning',
  increase: 'info',
}

const journalStatusTone: Record<string, StatusTone> = {
  draft: 'neutral',
  posted: 'success',
  reversed: 'danger',
}

export function PriceOverrideAuditDetailSheet({ auditId, open, onOpenChange, canView }: Props) {
  const t = useTranslations('accounting.priceOverrideAudit.detail')
  const locale = useLocale()

  const detail = usePriceOverrideAuditDetail(auditId, open && canView)
  const users = useUsers()
  const items = useItems()
  const branches = useBranches()
  // Order is fetched only in Detail (one call), never in the List, per the
  // approved decision — resolving item_id/order_id per List row would be N+1.
  const order = useOrder(detail.data?.order_id ?? '')
  // journalEntry on the audit record has no `reference` string — resolved
  // via the existing Step 2 detail endpoint on demand, not invented here.
  const journalEntry = useJournalEntryDetail(detail.data?.journalEntry?.id ?? null, open && canView && !!detail.data?.journalEntry)

  const userNameById = new Map((users.data ?? []).map((u) => [u.id, u.name]))
  const itemNameById = new Map((items.data ?? []).map((i) => [i.id, i.name]))
  const branchNameById = new Map((branches.data ?? []).map((b) => [b.id, b.name]))

  const isForbidden = detail.error instanceof ApiError && detail.error.status === 403
  const isNotFound = detail.error instanceof ApiError && detail.error.status === 404

  const orderItem = order.data?.items?.find((oi) => oi.id === detail.data?.order_item_id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end">
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {detail.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px] rounded-xl" />
              ))}
            </div>
          )}

          {!detail.isLoading && isForbidden && (
            <EmptyState icon={AlertTriangle} title={t('noPermission.title')} description={t('noPermission.description')} theme="dashboard" size="md" />
          )}

          {!detail.isLoading && isNotFound && (
            <EmptyState icon={AlertTriangle} title={t('notFound.title')} description={t('notFound.description')} theme="dashboard" size="md" />
          )}

          {!detail.isLoading && detail.isError && !isForbidden && !isNotFound && (
            <EmptyState icon={AlertTriangle} title={t('error.title')} description={t('error.description')} theme="dashboard" size="md" />
          )}

          {!detail.isLoading && detail.data && (
            <>
              {/* Price Override → Official → Approved → Difference → Direction → Reason */}
              <SectionCard title={t('override.title')} theme="dashboard">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('override.officialPrice')}</span>
                    <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatAmount(detail.data.official_unit_price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('override.approvedPrice')}</span>
                    <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatAmount(detail.data.approved_unit_price)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('override.difference')}</span>
                    <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                      {formatAmount(detail.data.difference_amount)} ({formatAmount(detail.data.difference_percent)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('override.direction')}</span>
                    <StatusBadge label={t(`direction.${detail.data.direction}`)} tone={directionTone[detail.data.direction] ?? 'neutral'} />
                  </div>
                  {detail.data.reason && (
                    <div className="pt-2 border-t border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
                      {detail.data.reason}
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Effective Role → Effective Policy Snapshot → User/Actor */}
              <SectionCard title={t('actor.title')} theme="dashboard">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('actor.user')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                      {userNameById.get(detail.data.actor_id) ?? detail.data.actor_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('actor.effectiveRole')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{detail.data.actor_role_name_snapshot}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('actor.branch')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                      {branchNameById.get(detail.data.branch_id) ?? detail.data.branch_id}
                    </span>
                  </div>
                  {detail.data.effective_policy_snapshot && (
                    <div className="pt-2 border-t border-posCloud-border dark:border-posCloudDark-border">
                      <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mb-1">{t('actor.policySnapshot')}</p>
                      <pre className="text-xs whitespace-pre-wrap break-all bg-posCloud-background dark:bg-posCloudDark-background rounded-lg p-3 text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
                        {JSON.stringify(detail.data.effective_policy_snapshot, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Order → Order Item */}
              <SectionCard title={t('order.title')} theme="dashboard">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('order.orderId')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate max-w-[220px]">{detail.data.order_id}</span>
                  </div>
                  {order.isLoading && <Skeleton className="h-6 rounded" />}
                  {order.data && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('order.status')}</span>
                        <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{order.data.status}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('order.total')}</span>
                        <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatAmount(order.data.total)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-posCloud-border dark:border-posCloudDark-border">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('order.item')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                      {orderItem?.item_name ?? itemNameById.get(detail.data.item_id) ?? detail.data.item_id}
                    </span>
                  </div>
                  {orderItem && (
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('order.quantity')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{orderItem.quantity}</span>
                    </div>
                  )}
                  <Link
                    href={`/${locale}/dashboard/orders`}
                    className="inline-block pt-2 text-sm text-posCloud-primary hover:underline"
                  >
                    {t('order.viewInOrders')}
                  </Link>
                </div>
              </SectionCard>

              {/* Journal Entry → Accounting */}
              <SectionCard title={t('journal.title')} theme="dashboard">
                {detail.data.journalEntry ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('journal.status')}</span>
                      <StatusBadge
                        label={t(`journalStatus.${detail.data.journalEntry.status}`)}
                        tone={journalStatusTone[detail.data.journalEntry.status] ?? 'neutral'}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('journal.postingDate')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{detail.data.journalEntry.posting_date}</span>
                    </div>
                    {journalEntry.data && (
                      <div className="flex items-center justify-between">
                        <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('journal.reference')}</span>
                        <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate max-w-[220px]">{journalEntry.data.reference ?? '—'}</span>
                      </div>
                    )}
                    <Link
                      href={`/${locale}/dashboard/accounting/journal-entries`}
                      className="inline-block pt-2 text-sm text-posCloud-primary hover:underline"
                    >
                      {t('journal.viewInJournal')}
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
                    {t('journal.none')}
                  </p>
                )}
              </SectionCard>

              <div className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                {t('createdAt')}: <span className="tabular-nums">{new Date(detail.data.created_at).toLocaleString('en-US')}</span>
              </div>
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
