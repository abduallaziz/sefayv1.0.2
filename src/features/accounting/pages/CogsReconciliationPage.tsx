'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/page-header'
import { DataTable, Column } from '@/shared/ui/data-table'
import { StatusBadge, StatusTone } from '@/shared/ui/status-badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { Pagination } from '@/shared/components/ui/Pagination'
import { usePermission } from '@/core/permissions/hooks/usePermission'
import { ApiError } from '@/lib/api'
import { useCogsReconciliation } from '../hooks/useJournalEntries'
import { useFiscalPeriods } from '../hooks/useAccountingCommandCenter'
import { useUsers } from '@/features/users/hooks/useUsers'
import { JournalEntriesFilters } from '../components/JournalEntriesFilters'
import { JournalEntryDetailSheet } from '../components/JournalEntryDetailSheet'
import { JournalEntriesQuery, JournalEntry } from '../api/accounting.api'

const statusTone: Record<string, StatusTone> = {
  draft: 'neutral',
  posted: 'success',
  reversed: 'danger',
}

export function CogsReconciliationPage() {
  const t = useTranslations('accounting.cogsReconciliation')
  const tJournal = useTranslations('accounting.journalEntries')
  const locale = useLocale()
  const canView = usePermission('accounting.reconciliation.view')

  const [filters, setFilters] = useState<JournalEntriesQuery>({})
  const [page, setPage] = useState(1)
  const perPage = 50
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleFiltersChange = (next: JournalEntriesQuery) => {
    setFilters(next)
    setPage(1)
  }

  const query = useCogsReconciliation({ ...filters, page, per_page: perPage }, canView)
  const fiscalPeriods = useFiscalPeriods(canView)
  const fiscalPeriodById = new Map((fiscalPeriods.data ?? []).map((p) => [p.id, p]))
  const users = useUsers()
  const userNameById = new Map((users.data ?? []).map((u) => [u.id, u.name]))

  if (!canView) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState icon={AlertTriangle} title={t('noPermission.title')} description={t('noPermission.description')} theme="dashboard" size="lg" />
      </div>
    )
  }

  const isForbidden = query.error instanceof ApiError && query.error.status === 403
  const rows = query.data?.data ?? []
  const total = query.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const columns: Column<JournalEntry>[] = [
    {
      key: 'reference',
      header: tJournal('columns.reference'),
      render: (row) => (
        <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{row.reference ?? row.id}</span>
      ),
    },
    { key: 'posting_date', header: tJournal('columns.postingDate'), render: (row) => <span className="tabular-nums">{row.posting_date}</span> },
    {
      key: 'description',
      header: tJournal('columns.description'),
      render: (row) => <span className="truncate block max-w-xs">{row.description ?? '—'}</span>,
    },
    {
      key: 'status',
      header: tJournal('columns.status'),
      render: (row) => <StatusBadge label={tJournal(`status.${row.status}`)} tone={statusTone[row.status] ?? 'neutral'} />,
    },
    {
      key: 'fiscal_period_id',
      header: tJournal('columns.fiscalPeriod'),
      render: (row) => {
        const period = row.fiscal_period_id ? fiscalPeriodById.get(row.fiscal_period_id) : undefined
        return (
          <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary tabular-nums">
            {period ? tJournal('fiscalPeriodLabel', { number: period.period_number }) : '—'}
          </span>
        )
      },
    },
    {
      key: 'created_by',
      header: tJournal('columns.createdBy'),
      render: (row) => (
        <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
          {row.created_by ? (userNameById.get(row.created_by) ?? row.created_by) : '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        theme="dashboard"
        breadcrumb={[
          { label: t('breadcrumbAccounting'), href: `/${locale}/dashboard/accounting` },
          { label: t('title') },
        ]}
      />

      <JournalEntriesFilters filters={filters} onChange={handleFiltersChange} canView={canView} hideSource />

      {isForbidden ? (
        <EmptyState icon={AlertTriangle} title={t('noPermission.title')} description={t('noPermission.description')} theme="dashboard" size="lg" />
      ) : query.isError ? (
        <EmptyState icon={AlertTriangle} title={t('error.title')} description={t('error.description')} theme="dashboard" size="md" />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.id}
          theme="dashboard"
          loading={query.isLoading}
          onRowClick={(row) => setSelectedId(row.id)}
          emptyState={
            // No exceptions is the healthy state here, unlike an empty
            // Journal Entries list — framed positively, not as an error.
            <EmptyState icon={CheckCircle2} title={t('empty.title')} description={t('empty.description')} theme="dashboard" size="md" />
          }
        />
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} label={t('title')} />
      )}

      <JournalEntryDetailSheet
        entryId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => { if (!open) setSelectedId(null) }}
        canView={canView}
        canViewReconciliation={canView}
      />
    </div>
  )
}
