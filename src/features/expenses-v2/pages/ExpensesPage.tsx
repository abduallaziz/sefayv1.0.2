'use client'

import { useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
  AlertTriangle,
  CircleCheckBig,
  History,
  ListChecks,
  Paperclip,
  Pencil,
  Plus,
  TrendingUp,
  Wallet,
  X,
  XCircle,
  MoreVertical,
  FolderOpen,
  Repeat,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/shared/ui/page-header'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { StatusBadge } from '@/shared/ui/status-badge'
import { StatCard } from '@/shared/ui/stat-card'
import { EmptyState } from '@/shared/ui/empty-state'
import { DataTable, type Column } from '@/shared/ui/data-table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/shared/ui/dropdown'
import { useBranchContext } from '@/core/branch/useBranchContext'
import { usePermission } from '@/core/permissions/hooks/usePermission'
import { useUsers } from '@/features/users/hooks/useUsers'
import { ApiError } from '@/lib/api'
import { useExpenseCategoriesV2 } from '../hooks/useExpenseCategories'
import { useExpenses, useCancelExpense, useConfirmPayment, useStopRecurring } from '../hooks/useExpensesCore'
import { ExpenseFormSheet } from '../components/ExpenseFormSheet'
import { ExpenseActivitySheet } from '../components/ExpenseActivitySheet'
import { ExpenseAttachmentsSheet } from '../components/ExpenseAttachmentsSheet'
import { AddCategoryDialog } from '../components/AddCategoryDialog'
import { ExpensesSectionNav } from '../components/ExpensesSectionNav'
import { ExpenseRecord, ExpenseFilters } from '../api/expenses-v2.api'

const ALL = '__all__'

export function ExpensesPage() {
  const t = useTranslations('expensesV2.expensesCore')
  const tBreadcrumb = useTranslations('expensesV2.breadcrumb')
  const tForm = useTranslations('expensesV2.expensesCore.form')
  // payment methods are stored as codes (cash, card ...): show the translated name, keep unknown codes as they are
  const methodLabel = (code: string) => {
    const keys: Record<string, string> = { cash: 'paymentMethodCash', card: 'paymentMethodCard', bank_transfer: 'paymentMethodBankTransfer', cheque: 'paymentMethodCheque', other: 'paymentMethodOther' }
    return keys[code] ? tForm(keys[code] as never) : code
  }
  const locale = useLocale()
  const canView = usePermission('expenses.view')
  const canCreate = usePermission('expenses.create')
  const canManage = usePermission('expenses.manage')

  const { availableBranches, currentBranchId, setCurrentBranch, isCentral } = useBranchContext()
  const activeBranchId = currentBranchId ?? undefined

  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(ALL)
  const categories = useExpenseCategoriesV2()
  const users = useUsers()
  const userNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const u of users.data ?? []) map.set(u.id, u.name)
    return map
  }, [users.data])

  const expenses = useExpenses(activeBranchId, filters)
  const cancelExpense = useCancelExpense(activeBranchId)
  const confirmPayment = useConfirmPayment(activeBranchId)
  const stopRecurring = useStopRecurring(activeBranchId)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseRecord | null>(null)
  const [activityExpenseId, setActivityExpenseId] = useState<string | null>(null)
  const [attachmentsExpenseId, setAttachmentsExpenseId] = useState<string | null>(null)

  const categoryMap = useMemo(
    () => new Map(categories.data?.map((c) => [c.id, c.name])),
    [categories.data],
  )

  const paymentMethods = useMemo(() => {
    const set = new Set<string>()
    for (const e of expenses.data ?? []) if (e.payment_method) set.add(e.payment_method)
    return Array.from(set)
  }, [expenses.data])

  const rows = useMemo(() => {
    let list = expenses.data ?? []
    if (paymentMethodFilter !== ALL) list = list.filter((e) => e.payment_method === paymentMethodFilter)
    return list
  }, [expenses.data, paymentMethodFilter])

  // KPI figures — Total/Paid/Unpaid/Count all computed from the already-
  // fetched branch expense list (no new backend aggregate endpoints).
  // "vs last month" compares expense_date within the current calendar
  // month against the same span last month, both client-side.
  const stats = useMemo(() => {
    const active = (expenses.data ?? []).filter((r) => !r.cancelled_at)
    const unpaid = active.filter((r) => r.payment_status === 'unpaid')
    const paid = active.filter((r) => r.payment_status === 'paid')
    const totalAmount = active.reduce((sum, r) => sum + r.total_amount, 0)
    const unpaidAmount = unpaid.reduce((sum, r) => sum + r.total_amount, 0)
    const paidAmount = paid.reduce((sum, r) => sum + r.total_amount, 0)

    const now = new Date()
    const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`
    let thisMonthTotal = 0
    let lastMonthTotal = 0
    for (const r of active) {
      const d = new Date(r.expense_date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (key === thisMonthKey) thisMonthTotal += r.total_amount
      else if (key === lastMonthKey) lastMonthTotal += r.total_amount
    }
    const vsLastMonth = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : null

    return {
      count: active.length,
      totalAmount,
      unpaidCount: unpaid.length,
      unpaidAmount,
      paidCount: paid.length,
      paidAmount,
      vsLastMonth,
    }
  }, [expenses.data])

  const hasActiveFilters =
    Object.values(filters).some((v) => v !== undefined && v !== '') || paymentMethodFilter !== ALL

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
      header: t('table.title'),
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">
            {row.title}
          </span>
          {row.cancelled_at && <StatusBadge label={t('status.cancelled')} tone="danger" />}
        </div>
      ),
    },
    {
      key: 'category',
      header: t('table.category'),
      render: (row) => categoryMap.get(row.category_id) ?? '—',
    },
    {
      key: 'total',
      header: t('table.total'),
      render: (row) => (
        <span className="tabular-nums font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
          {row.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: t('table.paymentMethod'),
      render: (row) => (row.payment_method ? methodLabel(row.payment_method) : '—'),
    },
    {
      key: 'status',
      header: t('table.status'),
      render: (row) => (
        <StatusBadge
          label={row.payment_status === 'paid' ? t('payment.paid') : t('payment.unpaid')}
          tone={row.payment_status === 'paid' ? 'success' : 'warning'}
        />
      ),
    },
    {
      key: 'source',
      header: t('table.source'),
      render: (row) => <StatusBadge label={t(`source.${row.source}`)} tone="neutral" />,
    },
    {
      key: 'addedBy',
      header: t('table.addedBy'),
      render: (row) => (row.created_by ? userNameById.get(row.created_by) ?? '—' : '—'),
    },
    {
      key: 'dateTime',
      header: t('table.dateTime'),
      render: (row) => (
        <span className="text-xs">
          {new Date(row.created_at).toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-CA', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      sticky: true,
      header: t('table.actions'),
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" aria-label={t('table.actions')} size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setAttachmentsExpenseId(row.id)}>
              <Paperclip className="h-4 w-4" />
              {t('actions.attachments')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActivityExpenseId(row.id)}>
              <History className="h-4 w-4" />
              {t('actions.activity')}
            </DropdownMenuItem>
            {canManage && !row.cancelled_at && (
              <>
                {row.payment_status === 'unpaid' && (
                  <DropdownMenuItem
                    onClick={() =>
                      confirmPayment.mutate(row.id, {
                        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed'),
                      })
                    }
                  >
                    <CircleCheckBig className="h-4 w-4" />
                    {t('payment.confirmPayment')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    setEditing(row)
                    setFormOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  {t('actions.edit')}
                </DropdownMenuItem>
                {row.is_recurring ? (
                  <DropdownMenuItem
                    onClick={() =>
                      stopRecurring.mutate(row.id, {
                        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed'),
                      })
                    }
                  >
                    <Repeat className="h-4 w-4" />
                    {t('actions.stopRecurring')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="text-posCloud-danger"
                    onClick={() =>
                      cancelExpense.mutate(row.id, {
                        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed'),
                      })
                    }
                  >
                    <XCircle className="h-4 w-4" />
                    {t('actions.cancel')}
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="p-4 lg:p-6">
      <ExpensesSectionNav />
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumb={[{ label: tBreadcrumb('home'), href: `/${locale}/dashboard` }, { label: t('title') }]}
        actions={
          canCreate && (
            <div className="flex flex-wrap items-center gap-2">
              <AddCategoryDialog />
              <Button
                onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                {t('addExpense')}
              </Button>
            </div>
          )
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary shrink-0">
          {t('workingBranch')}
        </span>
        <Select value={activeBranchId ?? ''} onValueChange={setCurrentBranch} disabled={!isCentral}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder={t('selectBranch')} />
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
        <div className="space-y-6">
          {/* KPI summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('kpi.totalExpenses')}
              value={stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              sub={
                stats.vsLastMonth !== null
                  ? `${stats.vsLastMonth >= 0 ? '+' : ''}${stats.vsLastMonth}% ${t('kpi.vsLastMonth')}`
                  : undefined
              }
              icon={TrendingUp}
              variant="info"
            />
            <StatCard
              title={t('kpi.unpaid')}
              value={stats.unpaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              sub={`${stats.unpaidCount} ${t('kpi.expenseUnit')}`}
              icon={Wallet}
              variant="warning"
            />
            <StatCard
              title={t('kpi.paid')}
              value={stats.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              sub={`${stats.paidCount} ${t('kpi.expenseUnit')}`}
              icon={CircleCheckBig}
              variant="success"
            />
            <StatCard title={t('kpi.expenseCount')} value={stats.count} icon={ListChecks} variant="default" />
          </div>

          {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="w-48">
                      <label className="block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                        {t('filters.category')}
                      </label>
                      <Select
                        value={filters.category_id ?? ALL}
                        onValueChange={(v) => setFilters((f) => ({ ...f, category_id: v === ALL ? undefined : v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>{t('filters.allCategories')}</SelectItem>
                          {categories.data?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-48">
                      <label className="block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                        {t('filters.paymentMethod')}
                      </label>
                      <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>{t('filters.allPaymentMethods')}</SelectItem>
                          {paymentMethods.map((pm) => (
                            <SelectItem key={pm} value={pm}>
                              {methodLabel(pm)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-48">
                      <label className="block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                        {t('filters.status')}
                      </label>
                      <Select
                        value={filters.payment_status ?? ALL}
                        onValueChange={(v) =>
                          setFilters((f) => ({ ...f, payment_status: v === ALL ? undefined : (v as 'paid' | 'unpaid') }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>{t('filters.allStatuses')}</SelectItem>
                          <SelectItem value="paid">{t('payment.paid')}</SelectItem>
                          <SelectItem value="unpaid">{t('payment.unpaid')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                        {t('filters.search')}
                      </label>
                      <Input
                        value={filters.search ?? ''}
                        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
                        placeholder={t('filters.searchPlaceholder')}
                      />
                    </div>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="default"
                        onClick={() => {
                          setFilters({})
                          setPaymentMethodFilter(ALL)
                        }}
                      >
                        <X className="h-4 w-4" />
                        {t('filters.clear')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Expenses table */}
              <DataTable
                columns={columns}
                data={rows}
                keyExtractor={(row) => row.id}
                loading={expenses.isLoading}
                theme="dashboard"
                emptyState={<EmptyState icon={FolderOpen} title={t('empty')} theme="dashboard" size="sm" />}
              />

        </div>
      )}

      {activeBranchId && (
        <ExpenseFormSheet open={formOpen} onOpenChange={setFormOpen} branchId={activeBranchId} editing={editing} />
      )}
      {activeBranchId && (
        <ExpenseActivitySheet
          open={!!activityExpenseId}
          onOpenChange={(o) => !o && setActivityExpenseId(null)}
          branchId={activeBranchId}
          expenseId={activityExpenseId}
        />
      )}
      {activeBranchId && (
        <ExpenseAttachmentsSheet
          open={!!attachmentsExpenseId}
          onOpenChange={(o) => !o && setAttachmentsExpenseId(null)}
          branchId={activeBranchId}
          expenseId={attachmentsExpenseId}
        />
      )}
    </div>
  )
}
