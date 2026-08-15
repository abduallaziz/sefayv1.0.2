'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { AlertTriangle, Plus } from 'lucide-react'
import { PageHeader } from '@/shared/ui/page-header'
import { SectionCard } from '@/shared/ui/section-card'
import { DataTable, Column } from '@/shared/ui/data-table'
import { StatusBadge, StatusTone } from '@/shared/ui/status-badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { usePermission } from '@/core/permissions/hooks/usePermission'
import { useBranches } from '@/shared/hooks/useBranches'
import { useFiscalPeriods } from '../hooks/useAccountingCommandCenter'
import { useChartOfAccounts } from '../hooks/useJournalEntries'
import { useAccountingOwners, useBranchAssignments } from '../hooks/useAccountingConfig'
import { AssignBranchOwnerSheet } from '../components/AssignBranchOwnerSheet'
import { FiscalPeriod, AccountingOwner, BranchAssignment, Account } from '../api/accounting.api'

const fiscalStatusTone: Record<string, StatusTone> = {
  open: 'success',
  closed: 'neutral',
}

export function AccountingConfigurationPage() {
  const t = useTranslations('accounting.configuration')
  const locale = useLocale()

  const canManagePeriods = usePermission('accounting.period.manage')
  const canManageConfig = usePermission('accounting.configuration.manage')
  const canViewLedger = usePermission('accounting.ledger.view')

  const [assignOpen, setAssignOpen] = useState(false)

  const fiscalPeriods = useFiscalPeriods(canManagePeriods)
  const owners = useAccountingOwners(canManageConfig)
  const assignments = useBranchAssignments(canManageConfig)
  const accounts = useChartOfAccounts(canViewLedger)
  const branches = useBranches()

  const branchNameById = new Map((branches.data ?? []).map((b) => [b.id, b.name]))
  const ownerNameById = new Map((owners.data ?? []).map((o) => [o.id, o.name]))

  if (!canManagePeriods && !canManageConfig && !canViewLedger) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState icon={AlertTriangle} title={t('noPermission.title')} description={t('noPermission.description')} theme="dashboard" size="lg" />
      </div>
    )
  }

  const fiscalColumns: Column<FiscalPeriod>[] = [
    { key: 'period_number', header: t('fiscalPeriods.columns.period'), render: (row) => <span className="tabular-nums">{t('fiscalPeriods.periodLabel', { number: row.period_number })}</span> },
    { key: 'start_date', header: t('fiscalPeriods.columns.startDate'), render: (row) => <span className="tabular-nums">{row.start_date}</span> },
    { key: 'end_date', header: t('fiscalPeriods.columns.endDate'), render: (row) => <span className="tabular-nums">{row.end_date}</span> },
    {
      key: 'status',
      header: t('fiscalPeriods.columns.status'),
      render: (row) => <StatusBadge label={t(`fiscalPeriods.status.${row.status}`)} tone={fiscalStatusTone[row.status] ?? 'neutral'} />,
    },
  ]

  const ownerColumns: Column<AccountingOwner>[] = [
    { key: 'name', header: t('owners.columns.name') },
    { key: 'owner_type_code', header: t('owners.columns.type'), render: (row) => <span>{t(`owners.type.${row.owner_type_code}`)}</span> },
    { key: 'branch_id', header: t('owners.columns.branch'), render: (row) => <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{branchNameById.get(row.branch_id) ?? row.branch_id}</span> },
    {
      key: 'status',
      header: t('owners.columns.status'),
      render: (row) => <StatusBadge label={t(`owners.status.${row.status}`)} tone={row.status === 'active' ? 'success' : 'neutral'} />,
    },
  ]

  const assignmentColumns: Column<BranchAssignment>[] = [
    { key: 'branch_id', header: t('assignments.columns.branch'), render: (row) => <span>{branchNameById.get(row.branch_id) ?? row.branch_id}</span> },
    { key: 'accounting_owner_id', header: t('assignments.columns.owner'), render: (row) => <span>{ownerNameById.get(row.accounting_owner_id) ?? row.accounting_owner_id}</span> },
    { key: 'effective_from', header: t('assignments.columns.effectiveFrom'), render: (row) => <span className="tabular-nums">{row.effective_from}</span> },
    { key: 'effective_to', header: t('assignments.columns.effectiveTo'), render: (row) => <span className="tabular-nums">{row.effective_to ?? '—'}</span> },
    { key: 'reason', header: t('assignments.columns.reason'), render: (row) => <span className="truncate block max-w-[160px] text-xs">{row.reason ?? '—'}</span> },
  ]

  const accountColumns: Column<Account>[] = [
    { key: 'code', header: t('chartOfAccounts.columns.code'), render: (row) => <span className="tabular-nums">{row.code}</span> },
    { key: 'name', header: t('chartOfAccounts.columns.name') },
    { key: 'account_type', header: t('chartOfAccounts.columns.type'), render: (row) => <span>{t(`chartOfAccounts.type.${row.account_type}`)}</span> },
    { key: 'normal_balance', header: t('chartOfAccounts.columns.normalBalance'), render: (row) => <span>{t(`chartOfAccounts.normalBalanceValue.${row.normal_balance}`)}</span> },
    {
      key: 'is_posting_account',
      header: t('chartOfAccounts.columns.postingAccount'),
      render: (row) => <StatusBadge label={row.is_posting_account ? t('yes') : t('no')} tone={row.is_posting_account ? 'brand' : 'neutral'} />,
    },
    {
      key: 'is_active',
      header: t('chartOfAccounts.columns.active'),
      render: (row) => <StatusBadge label={row.is_active ? t('yes') : t('no')} tone={row.is_active ? 'success' : 'danger'} />,
    },
    {
      key: 'roleCodes',
      header: t('chartOfAccounts.columns.roles'),
      render: (row) => (
        <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
          {row.roleCodes.length
            ? row.roleCodes.map((code) => t(`chartOfAccounts.roleLabels.${code}`)).join(locale === 'ar' ? '، ' : ', ')
            : '—'}
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

      {canManagePeriods && (
        <SectionCard title={t('fiscalPeriods.title')} description={t('fiscalPeriods.description')} theme="dashboard" padding="none">
          <DataTable
            columns={fiscalColumns}
            data={fiscalPeriods.data ?? []}
            keyExtractor={(row) => row.id}
            theme="dashboard"
            loading={fiscalPeriods.isLoading}
            emptyState={<EmptyState title={t('fiscalPeriods.empty')} theme="dashboard" size="sm" />}
          />
        </SectionCard>
      )}

      {canManageConfig && (
        <SectionCard title={t('owners.title')} description={t('owners.description')} theme="dashboard" padding="none">
          <DataTable
            columns={ownerColumns}
            data={owners.data ?? []}
            keyExtractor={(row) => row.id}
            theme="dashboard"
            loading={owners.isLoading}
            emptyState={<EmptyState title={t('owners.empty')} theme="dashboard" size="sm" />}
          />
        </SectionCard>
      )}

      {canManageConfig && (
        <SectionCard
          title={t('assignments.title')}
          description={t('assignments.description')}
          theme="dashboard"
          padding="none"
          actions={
            <button
              type="button"
              onClick={() => setAssignOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-posCloud-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              {t('assignments.assign')}
            </button>
          }
        >
          <DataTable
            columns={assignmentColumns}
            data={assignments.data ?? []}
            keyExtractor={(row) => row.id}
            theme="dashboard"
            loading={assignments.isLoading}
            emptyState={<EmptyState title={t('assignments.empty')} theme="dashboard" size="sm" />}
          />
        </SectionCard>
      )}

      {canViewLedger && (
        <SectionCard title={t('chartOfAccounts.title')} description={t('chartOfAccounts.description')} theme="dashboard" padding="none">
          <DataTable
            columns={accountColumns}
            data={accounts.data ?? []}
            keyExtractor={(row) => row.id}
            theme="dashboard"
            loading={accounts.isLoading}
            emptyState={<EmptyState title={t('chartOfAccounts.empty')} theme="dashboard" size="sm" />}
          />
        </SectionCard>
      )}

      {canManageConfig && (
        <AssignBranchOwnerSheet open={assignOpen} onOpenChange={setAssignOpen} />
      )}
    </div>
  )
}
