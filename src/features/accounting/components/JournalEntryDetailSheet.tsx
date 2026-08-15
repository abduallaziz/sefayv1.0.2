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
import { useJournalEntryDetail, useChartOfAccounts } from '../hooks/useJournalEntries'
import { useUsers } from '@/features/users/hooks/useUsers'

interface Props {
  entryId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canView: boolean
  canViewReconciliation?: boolean
  canViewPriceOverride?: boolean
}

const numberFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function formatAmount(value: number): string {
  return numberFormatter.format(value)
}

const statusTone: Record<string, StatusTone> = {
  draft: 'neutral',
  posted: 'success',
  reversed: 'danger',
}

const knownSourceLabelKeys = new Set(['sales_order'])

function sourceLabelKey(sourceModule: string, sourceEntityType: string): string {
  const key = `${sourceModule}_${sourceEntityType}`
  return knownSourceLabelKeys.has(key) ? key : 'manual'
}

// Never render a raw 36-char UUID — shorten to its last 8 characters,
// enough to disambiguate; the linked Order section below carries full
// traceability for sales-sourced entries.
function shortenReference(id: string): string {
  return id.slice(-8)
}

export function JournalEntryDetailSheet({ entryId, open, onOpenChange, canView, canViewReconciliation = false, canViewPriceOverride = false }: Props) {
  const t = useTranslations('accounting.journalEntries.detail')
  const tStatus = useTranslations('accounting.journalEntries.status')
  const tRoot = useTranslations('accounting.journalEntries')
  const locale = useLocale()

  const detail = useJournalEntryDetail(entryId, open && canView)
  const accounts = useChartOfAccounts(open && canView)
  const users = useUsers()

  const accountById = new Map((accounts.data ?? []).map((a) => [a.id, a]))
  const userNameById = new Map((users.data ?? []).map((u) => [u.id, u.name]))

  const isForbidden = detail.error instanceof ApiError && detail.error.status === 403
  const isNotFound = detail.error instanceof ApiError && detail.error.status === 404

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
              <SectionCard title={t('header.title')} theme="dashboard">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('header.reference')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary tabular-nums">
                      {tRoot('referenceFallback', { shortId: shortenReference(detail.data.reference ?? detail.data.id) })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('header.postingDate')}</span>
                    <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{detail.data.posting_date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('header.status')}</span>
                    <StatusBadge label={tStatus(detail.data.status)} tone={statusTone[detail.data.status] ?? 'neutral'} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('header.source')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                      {tRoot(`sourceLabels.${sourceLabelKey(detail.data.source_module, detail.data.source_entity_type)}`)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
                    {detail.data.description ?? tRoot(`sourceLabels.${sourceLabelKey(detail.data.source_module, detail.data.source_entity_type)}`)}
                  </div>
                  {detail.data.requires_cogs_reconciliation && (
                    <div className="flex items-center gap-2 text-posCloud-warning text-xs pt-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t('header.cogsFlag')}
                      {canViewReconciliation && (
                        <Link
                          href={`/${locale}/dashboard/accounting/cogs-reconciliation`}
                          className="text-posCloud-primary hover:underline"
                        >
                          {t('header.viewInCogs')}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title={t('lines.title')} theme="dashboard" padding="none">
                <div className="divide-y divide-slate-100 dark:divide-posCloudDark-border">
                  {detail.data.lines.map((line) => {
                    const account = accountById.get(line.account_id)
                    return (
                      <div key={line.id} className="flex items-center justify-between px-5 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">
                            {account ? `${account.code} — ${account.name}` : line.account_id}
                          </p>
                          {line.description && (
                            <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{line.description}</p>
                          )}
                        </div>
                        <div className="flex gap-4 tabular-nums shrink-0">
                          <span className="text-posCloud-text-secondary dark:text-posCloudDark-text-secondary w-20 text-end">
                            {line.debit_amount > 0 ? formatAmount(line.debit_amount) : ''}
                          </span>
                          <span className="text-posCloud-text-secondary dark:text-posCloudDark-text-secondary w-20 text-end">
                            {line.credit_amount > 0 ? formatAmount(line.credit_amount) : ''}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </SectionCard>

              {detail.data.order && (
                <SectionCard title={t('order.title')} theme="dashboard">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('order.paymentMethod')}</span>
                      <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{detail.data.order.payment_method ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('order.subtotal')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatAmount(detail.data.order.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('order.discount')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatAmount(detail.data.order.discount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('order.tax')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatAmount(detail.data.order.tax)}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('order.total')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatAmount(detail.data.order.total)}</span>
                    </div>
                    <Link
                      href={`/${locale}/dashboard/orders`}
                      className="inline-block pt-2 text-sm text-posCloud-primary hover:underline"
                    >
                      {t('order.viewInOrders')}
                    </Link>
                  </div>
                </SectionCard>
              )}

              {detail.data.priceOverrideAudits.length > 0 && (
                <SectionCard title={t('priceOverride.title')} theme="dashboard" padding="none">
                  <div className="divide-y divide-slate-100 dark:divide-posCloudDark-border">
                    {detail.data.priceOverrideAudits.map((a) => (
                      <div key={a.id} className="px-5 py-3 text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('priceOverride.official')}</span>
                          <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatAmount(a.official_unit_price)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('priceOverride.approved')}</span>
                          <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatAmount(a.approved_unit_price)}</span>
                        </div>
                        {a.reason && (
                          <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{a.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {canViewPriceOverride && (
                    <div className="px-5 py-3">
                      <Link
                        href={`/${locale}/dashboard/accounting/price-override-audit`}
                        className="text-sm text-posCloud-primary hover:underline"
                      >
                        {t('priceOverride.viewInAudit')}
                      </Link>
                    </div>
                  )}
                </SectionCard>
              )}

              {detail.data.reversal_of_id && (
                <SectionCard title={t('reversal.title')} theme="dashboard">
                  <p className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
                    {t('reversal.reversalOf', { id: detail.data.reversal_of_id })}
                  </p>
                </SectionCard>
              )}

              {detail.data.reversalEntry && (
                <SectionCard title={t('reversal.reversedByTitle')} theme="dashboard">
                  <div className="flex items-center justify-between text-sm">
                    <StatusBadge
                      label={tStatus(detail.data.reversalEntry.status)}
                      tone={statusTone[detail.data.reversalEntry.status] ?? 'neutral'}
                    />
                    <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                      {new Date(detail.data.reversalEntry.created_at).toLocaleDateString('en-US')}
                    </span>
                  </div>
                </SectionCard>
              )}

              <SectionCard title={t('audit.title')} theme="dashboard">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('audit.createdBy')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                      {detail.data.created_by ? (userNameById.get(detail.data.created_by) ?? detail.data.created_by) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('audit.createdAt')}</span>
                    <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                      {new Date(detail.data.created_at).toLocaleString('en-US')}
                    </span>
                  </div>
                  {detail.data.posted_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('audit.postedAt')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                        {new Date(detail.data.posted_at).toLocaleString('en-US')}
                      </span>
                    </div>
                  )}
                  {detail.data.reversed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('audit.reversedAt')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                        {new Date(detail.data.reversed_at).toLocaleString('en-US')}
                      </span>
                    </div>
                  )}
                </div>
              </SectionCard>

              <Link
                href={`/${locale}/dashboard/accounting`}
                className="inline-block text-sm text-posCloud-primary hover:underline"
              >
                {tRoot('backToCommandCenter')}
              </Link>
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
