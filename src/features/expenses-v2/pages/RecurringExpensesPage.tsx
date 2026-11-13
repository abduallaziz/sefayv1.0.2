'use client'

import { useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { AlertTriangle, Trash2, Pencil, Wallet, CalendarClock, PauseCircle, PlayCircle, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/shared/ui/page-header'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { StatusBadge } from '@/shared/ui/status-badge'
import { StatCard } from '@/shared/ui/stat-card'
import { EmptyState } from '@/shared/ui/empty-state'
import { DataTable, type Column } from '@/shared/ui/data-table'
import { useBranchContext } from '@/core/branch/useBranchContext'
import { usePermission } from '@/core/permissions/hooks/usePermission'
import { ApiError } from '@/lib/api'
import { useExpenseCategoriesV2 } from '../hooks/useExpenseCategories'
import { useExpenses, useCancelExpense } from '../hooks/useExpensesCore'
import { ExpenseFormSheet } from '../components/ExpenseFormSheet'
import { ExpensesSectionNav } from '../components/ExpensesSectionNav'
import { ExpenseRecord, RecurringFrequency } from '../api/expenses-v2.api'

// Multiplier normalizing each frequency to a "per month" spend rate — a
// derived display figure only (KPI cards), never persisted or sent to the
// backend, and never used to compute any real Expense amount.
const MONTHLY_MULTIPLIER: Record<RecurringFrequency, number> = {
  daily: 30,
  weekly: 4.345,
  monthly: 1,
  yearly: 1 / 12,
}

// Recurring Expenses Final Implementation (Owner Decision): this page is a
// filtered view of the Expenses list (is_recurring=true) — not a separate
// Template management surface. Supports view/edit/stop-recurring only.
export function RecurringExpensesPage() {
  const t = useTranslations('expensesV2.recurringExpenses')
  const tBreadcrumb = useTranslations('expensesV2.breadcrumb')
  const tForm = useTranslations('expensesV2.expensesCore')
  const tMethod = useTranslations('expensesV2.expensesCore.form')
  const methodLabel = (code: string) => {
    const keys: Record<string, string> = { cash: 'paymentMethodCash', card: 'paymentMethodCard', bank_transfer: 'paymentMethodBankTransfer', cheque: 'paymentMethodCheque', other: 'paymentMethodOther' }
    return keys[code] ? tMethod(keys[code] as never) : code
  }
  const locale = useLocale()
  const canView = usePermission('expenses.view')
  const canManage = usePermission('expenses.manage')

  const { availableBranches, currentBranchId, setCurrentBranch, isCentral } = useBranchContext()
  const activeBranchId = currentBranchId ?? undefined

  const categories = useExpenseCategoriesV2()
  const expenses = useExpenses(activeBranchId, { is_recurring: true })
  const allRecurring = useExpenses(activeBranchId, {})
  const cancelExpense = useCancelExpense(activeBranchId)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseRecord | null>(null)

  const categoryMap = useMemo(
    () => new Map(categories.data?.map((c) => [c.id, c.name])),
    [categories.data],
  )

  // KPI figures — all derived client-side from the already-fetched
  // branch expense list (no new backend aggregate endpoints). "Paused"
  // counts Expenses that were once recurring and later stopped (still
  // carry a frequency, but is_recurring is now false).
  const stats = useMemo(() => {
    const all = allRecurring.data ?? []
    const everRecurring = all.filter((r) => r.frequency !== null)
    const active = everRecurring.filter((r) => r.is_recurring)
    const paused = everRecurring.filter((r) => !r.is_recurring)

    const monthlyTotal = active.reduce((sum, r) => {
      const mult = r.frequency ? MONTHLY_MULTIPLIER[r.frequency] : 0
      return sum + r.total_amount * mult
    }, 0)

    const in7Days = new Date()
    in7Days.setDate(in7Days.getDate() + 7)
    const dueSoon = active.filter(
      (r) => r.next_occurrence_date && new Date(r.next_occurrence_date) <= in7Days,
    ).length

    return {
      monthlyTotal,
      annualTotal: monthlyTotal * 12,
      activeCount: active.length,
      pausedCount: paused.length,
      dueSoonCount: dueSoon,
    }
  }, [allRecurring.data])

  if (!canView) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState icon={AlertTriangle} title={t('noPermission')} theme="dashboard" size="lg" />
      </div>
    )
  }

  const columns: Column<ExpenseRecord>[] = [
    {
      key: 'title',
      header: tForm('table.title'),
      render: (row) => (
        <span className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">
          {row.title}
        </span>
      ),
    },
    {
      key: 'category',
      header: tForm('table.category'),
      render: (row) => categoryMap.get(row.category_id) ?? '—',
    },
    {
      key: 'total',
      header: tForm('table.total'),
      render: (row) => (
        <span className="tabular-nums font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
          {row.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: tForm('table.paymentMethod'),
      render: (row) => (row.payment_method ? methodLabel(row.payment_method) : '—'),
    },
    {
      key: 'frequency',
      header: t('frequency'),
      render: (row) => (row.frequency ? t(`frequency${row.frequency.charAt(0).toUpperCase()}${row.frequency.slice(1)}`) : '—'),
    },
    {
      key: 'nextOccurrence',
      header: t('nextOccurrence'),
      render: (row) => row.next_occurrence_date ?? '—',
    },
    {
      key: 'status',
      header: tForm('table.status'),
      render: (row) =>
        row.is_recurring ? (
          <StatusBadge label={t('active')} tone="success" />
        ) : (
          <StatusBadge label={t('stopped')} tone="neutral" />
        ),
    },
    {
      key: 'actions',
      header: tForm('table.actions'),
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={tForm('actions.edit')}
            onClick={() => {
              setEditing(row)
              setFormOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {canManage && !row.cancelled_at && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-posCloud-danger hover:text-posCloud-danger"
              title={t('deleteRecurring')}
              onClick={() => {
                if (!window.confirm(t('deleteRecurringConfirm'))) return
                cancelExpense.mutate(row.id, {
                  onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed'),
                })
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <ExpensesSectionNav />
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumb={[
          { label: tBreadcrumb('home'), href: `/${locale}/dashboard` },
          { label: tBreadcrumb('expenses'), href: `/${locale}/dashboard/expenses-v2/expenses` },
          { label: t('title') },
        ]}
      />

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary shrink-0">
          {t('workingBranch')}
        </span>
        <Select value={activeBranchId ?? ''} onValueChange={setCurrentBranch} disabled={!isCentral}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder={tForm('selectBranch')} />
          </SelectTrigger>
          <SelectContent>
            {availableBranches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!activeBranchId ? (
        <EmptyState title={t('noBranchSelected')} theme="dashboard" size="lg" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title={t('kpiMonthly')}
              value={stats.monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              icon={Wallet}
              variant="info"
            />
            <StatCard
              title={t('kpiActive')}
              value={stats.activeCount}
              icon={PlayCircle}
              variant="success"
            />
            <StatCard
              title={t('kpiPaused')}
              value={stats.pausedCount}
              icon={PauseCircle}
              variant="warning"
            />
            <StatCard
              title={t('kpiDueSoon')}
              value={stats.dueSoonCount}
              icon={CalendarClock}
              variant="danger"
            />
            <StatCard
              title={t('kpiAnnual')}
              value={stats.annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              icon={TrendingUp}
              variant="default"
            />
          </div>

          <DataTable
            columns={columns}
            data={expenses.data ?? []}
            keyExtractor={(row) => row.id}
            loading={expenses.isLoading}
            theme="dashboard"
            emptyState={<EmptyState title={t('empty')} theme="dashboard" size="sm" />}
          />
        </>
      )}

      {activeBranchId && (
        <ExpenseFormSheet open={formOpen} onOpenChange={setFormOpen} branchId={activeBranchId} editing={editing} />
      )}
    </div>
  )
}
