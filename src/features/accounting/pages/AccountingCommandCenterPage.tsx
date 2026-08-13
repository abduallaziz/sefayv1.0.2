'use client'

import { useTranslations } from 'next-intl'
import { DollarSign, Wallet, Receipt, Landmark, TrendingUp, AlertTriangle, Building2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/page-header'
import { SectionCard } from '@/shared/ui/section-card'
import { StatCard } from '@/shared/ui/stat-card'
import { EmptyState } from '@/shared/ui/empty-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { usePermission } from '@/core/permissions/hooks/usePermission'
import { useCommandCenter, useFiscalPeriods } from '../hooks/useAccountingCommandCenter'
import { ApiError } from '@/lib/api'

// Every value here always renders with English (Western) numerals, in
// both locales, per the project's permanent numeral convention — 'en-US'
// is deliberate and locale-independent, not a bug for the Arabic UI.
const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatAmount(value: number): string {
  return numberFormatter.format(value)
}

export function AccountingCommandCenterPage() {
  const t = useTranslations('accounting.commandCenter')
  const canView = usePermission('accounting.view')

  // Gated on the client-known permission — avoids firing (and console-
  // logging) a request we already know will 403, matching the
  // "permission-aware" requirement rather than only handling the denial
  // after the fact.
  const commandCenter = useCommandCenter(canView)
  const fiscalPeriods = useFiscalPeriods(canView)

  if (!canView) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          icon={AlertTriangle}
          title={t('noPermission.title')}
          description={t('noPermission.description')}
          theme="dashboard"
          size="lg"
        />
      </div>
    )
  }

  const isForbidden =
    (commandCenter.error instanceof ApiError && commandCenter.error.status === 403) ||
    (fiscalPeriods.error instanceof ApiError && fiscalPeriods.error.status === 403)

  if (isForbidden) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          icon={AlertTriangle}
          title={t('noPermission.title')}
          description={t('noPermission.description')}
          theme="dashboard"
          size="lg"
        />
      </div>
    )
  }

  const hasError = commandCenter.isError || fiscalPeriods.isError
  const isLoading = commandCenter.isLoading || fiscalPeriods.isLoading

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader title={t('title')} description={t('description')} theme="dashboard" />

      {hasError && !isLoading && (
        <EmptyState
          icon={AlertTriangle}
          title={t('error.title')}
          description={t('error.description')}
          theme="dashboard"
          size="md"
        />
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && !hasError && commandCenter.data && (
        <>
          {/* Financial KPIs — only backend-supported values, per the
              approved design. No Expenses KPI, no forecast, no invented
              calculation. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title={t('kpis.revenue')}
              value={formatAmount(commandCenter.data.revenue)}
              icon={DollarSign}
              variant="success"
              theme="dashboard"
            />
            <StatCard
              title={t('kpis.cashAndBank')}
              value={formatAmount(commandCenter.data.cashAndBank)}
              icon={Wallet}
              variant="info"
              theme="dashboard"
            />
            <StatCard
              title={t('kpis.accountsReceivable')}
              value={formatAmount(commandCenter.data.accountsReceivable)}
              icon={Receipt}
              variant="warning"
              theme="dashboard"
            />
            <StatCard
              title={t('kpis.taxLiability')}
              value={formatAmount(commandCenter.data.taxLiability)}
              icon={Landmark}
              variant="default"
              theme="dashboard"
            />
            <StatCard
              title={t('kpis.grossProfit')}
              value={formatAmount(commandCenter.data.grossProfit)}
              icon={TrendingUp}
              variant={commandCenter.data.grossProfit >= 0 ? 'success' : 'danger'}
              theme="dashboard"
            />
            <StatCard
              title={t('kpis.reconciliationExceptions')}
              value={commandCenter.data.reconciliationExceptions}
              icon={AlertTriangle}
              variant={commandCenter.data.reconciliationExceptions > 0 ? 'warning' : 'default'}
              theme="dashboard"
            />
          </div>

          {/* Operational Health — Tenant/Branch readiness + Fiscal Period */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title={t('readiness.title')} description={t('readiness.description')} theme="dashboard">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
                    <Building2 className="w-4 h-4" />
                    {commandCenter.data.tenantsWithAccountingOwner > 0
                      ? t('readiness.tenantHasOwner')
                      : t('readiness.tenantMissingOwner')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
                    {t('readiness.branchesAssigned')}
                  </span>
                  <span className="tabular-nums font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                    {commandCenter.data.branchesAssigned} {t('readiness.of')} {commandCenter.data.totalBranches}
                  </span>
                </div>
                <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                  {commandCenter.data.branchesAssigned >= commandCenter.data.totalBranches
                    ? t('readiness.allBranchesAssigned')
                    : t('readiness.branchesUnassigned', {
                        count: commandCenter.data.totalBranches - commandCenter.data.branchesAssigned,
                      })}
                </p>
              </div>
            </SectionCard>

            <SectionCard title={t('fiscalPeriod.title')} theme="dashboard">
              {fiscalPeriods.data && fiscalPeriods.data.length > 0 ? (
                (() => {
                  const today = new Date().toISOString().slice(0, 10)
                  const current = fiscalPeriods.data.find(
                    (p) => p.start_date <= today && today < p.end_date,
                  )
                  if (!current) {
                    return (
                      <p className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
                        {t('fiscalPeriod.none')}
                      </p>
                    )
                  }
                  return (
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={
                          current.status === 'open'
                            ? 'inline-block w-2 h-2 rounded-full bg-posCloud-success'
                            : 'inline-block w-2 h-2 rounded-full bg-posCloud-danger'
                        }
                      />
                      <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                        {current.status === 'open' ? t('fiscalPeriod.open') : t('fiscalPeriod.closed')}
                      </span>
                    </div>
                  )
                })()
              ) : (
                <p className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
                  {t('fiscalPeriod.none')}
                </p>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}
