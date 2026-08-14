'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/shared/ui/page-header'
import { DataTable, Column } from '@/shared/ui/data-table'
import { StatusBadge, StatusTone } from '@/shared/ui/status-badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { Pagination } from '@/shared/components/ui/Pagination'
import { usePermission } from '@/core/permissions/hooks/usePermission'
import { ApiError } from '@/lib/api'
import { useBranches } from '@/shared/hooks/useBranches'
import { useItems } from '@/features/items/hooks/useItems'
import { useUsers } from '@/features/users/hooks/useUsers'
import { usePriceOverrideAudits } from '../hooks/usePriceOverrideAudit'
import { PriceOverrideAuditFilters } from '../components/PriceOverrideAuditFilters'
import { PriceOverrideAuditDetailSheet } from '../components/PriceOverrideAuditDetailSheet'
import { PriceOverrideAuditQuery, PriceOverrideAudit } from '../api/accounting.api'

const directionTone: Record<string, StatusTone> = {
  discount: 'warning',
  increase: 'info',
}

const numberFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function formatAmount(value: number): string {
  return numberFormatter.format(value)
}

export function PriceOverrideAuditPage() {
  const t = useTranslations('accounting.priceOverrideAudit')
  const locale = useLocale()
  const canView = usePermission('price_override.audit.view')

  const [filters, setFilters] = useState<PriceOverrideAuditQuery>({})
  const [page, setPage] = useState(1)
  const perPage = 50
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleFiltersChange = (next: PriceOverrideAuditQuery) => {
    setFilters(next)
    setPage(1)
  }

  const query = usePriceOverrideAudits({ ...filters, page, per_page: perPage }, canView)
  const branches = useBranches()
  const branchNameById = new Map((branches.data ?? []).map((b) => [b.id, b.name]))
  const items = useItems()
  const itemNameById = new Map((items.data ?? []).map((i) => [i.id, i.name]))
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

  const columns: Column<PriceOverrideAudit>[] = [
    {
      key: 'created_at',
      header: t('columns.date'),
      render: (row) => <span className="tabular-nums">{new Date(row.created_at).toLocaleDateString('en-US')}</span>,
    },
    {
      key: 'item_id',
      header: t('columns.item'),
      render: (row) => <span className="truncate block max-w-[160px]">{itemNameById.get(row.item_id) ?? row.item_id}</span>,
    },
    {
      key: 'official_unit_price',
      header: t('columns.officialPrice'),
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatAmount(row.official_unit_price)}</span>,
    },
    {
      key: 'approved_unit_price',
      header: t('columns.approvedPrice'),
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatAmount(row.approved_unit_price)}</span>,
    },
    {
      key: 'difference_percent',
      header: t('columns.differencePercent'),
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatAmount(row.difference_percent)}%</span>,
    },
    {
      key: 'direction',
      header: t('columns.direction'),
      render: (row) => <StatusBadge label={t(`direction.${row.direction}`)} tone={directionTone[row.direction] ?? 'neutral'} />,
    },
    {
      key: 'actor_role_name_snapshot',
      header: t('columns.effectiveRole'),
      render: (row) => <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{row.actor_role_name_snapshot}</span>,
    },
    {
      key: 'actor_id',
      header: t('columns.user'),
      render: (row) => <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{userNameById.get(row.actor_id) ?? row.actor_id}</span>,
    },
    {
      key: 'branch_id',
      header: t('columns.branch'),
      render: (row) => <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{branchNameById.get(row.branch_id) ?? row.branch_id}</span>,
    },
    {
      key: 'reason',
      header: t('columns.reason'),
      render: (row) => <span className="truncate block max-w-[160px] text-xs">{row.reason ?? '—'}</span>,
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

      <PriceOverrideAuditFilters filters={filters} onChange={handleFiltersChange} />

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
            <EmptyState icon={ShieldAlert} title={t('empty.title')} description={t('empty.description')} theme="dashboard" size="md" />
          }
        />
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} label={t('title')} />
      )}

      <PriceOverrideAuditDetailSheet
        auditId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => { if (!open) setSelectedId(null) }}
        canView={canView}
      />
    </div>
  )
}
