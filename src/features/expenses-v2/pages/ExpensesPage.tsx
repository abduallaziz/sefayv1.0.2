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
  Download,
} from 'lucide-react'
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
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { DateRangePicker } from '@/shared/ui/date-range-picker'
import type { DateRange } from '@/shared/ui/date-range-picker'
import { usePaymentMethodLabel, normalizePaymentMethod } from '../lib/payment-method'
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
  // payment methods are stored as free codes ("Cash", "transfer"...): always show the translated name
  const methodLabel = usePaymentMethodLabel()
  const locale = useLocale()
  const canView = usePermission('expenses.view')
  const canCreate = usePermission('expenses.create')
  const canManage = usePermission('expenses.manage')

  const { availableBranches, currentBranchId, setCurrentBranch, isCentral } = useBranchContext()
  const activeBranchId = currentBranchId ?? undefined

  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [sort, setSort] = useState('date_desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [cancelTarget, setCancelTarget] = useState<ExpenseRecord | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const categories = useExpenseCategoriesV2()
  const users = useUsers()
  const userNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const u of users.data ?? []) map.set(u.id, u.name)
    return map
  }, [users.data])

  const apiFilters = useMemo<ExpenseFilters>(() => {
    const [sortField, dir] = sort.split('_') as [string, 'asc' | 'desc']
    return {
      ...filters,
      payment_status: statusFilter === 'paid' || statusFilter === 'unpaid' ? statusFilter : undefined,
      date_from: dateRange.from,
      date_to: dateRange.to,
      sort_by: sortField === 'amount' ? 'total_amount' : 'expense_date',
      sort_dir: dir,
    }
  }, [filters, statusFilter, dateRange, sort])
  const expenses = useExpenses(activeBranchId, apiFilters)
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

  // One option per canonical method; legacy spellings ("Cash", "transfer") are folded into them.
  const paymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'other']

  const filteredRows = useMemo(() => {
    let list = expenses.data ?? []
    if (paymentMethodFilter !== ALL) {
      list = list.filter((e) => (normalizePaymentMethod(e.payment_method) ?? 'other') === paymentMethodFilter)
    }
    if (statusFilter === 'cancelled') list = list.filter((e) => !!e.cancelled_at)
    return list
  }, [expenses.data, paymentMethodFilter, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const rows = useMemo(
    () => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredRows, currentPage, pageSize],
  )

  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const head = [t('table.title'), t('table.category'), t('table.total'), t('table.paymentMethod'), t('table.status'), t('table.dateTime')]
    const lines = filteredRows.map((r) =>
      [
        r.title,
        categoryMap.get(r.category_id) ?? '',
        r.total_amount.toFixed(2),
        r.payment_method ? methodLabel(r.payment_method) : '',
        r.cancelled_at ? t('status.cancelled') : r.payment_status === 'paid' ? t('payment.paid') : t('payment.unpaid'),
        r.expense_date,
      ].map(esc).join(','),
    )
    const blob = new Blob(['\uFEFF' + [head.map(esc).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'expenses.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

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
    Object.values(filters).some((v) => v !== undefined && v !== '') ||
    paymentMethodFilter !== ALL ||
    statusFilter !== ALL ||
    !!dateRange.from ||
    !!dateRange.to

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
                  <DropdownMenuItem onClick={() => confirmPayment.mutate(row.id)}>
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
                  <DropdownMenuItem onClick={() => stopRecurring.mutate(row.id)}>
                    <Repeat className="h-4 w-4" />
                    {t('actions.stopRecurring')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="text-posCloud-danger"
                    onClick={() => {
                      setCancelReason('')
                      setCancelTarget(row)
                    }}
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
                      <Select value={paymentMethodFilter} onValueChange={(v) => { setPaymentMethodFilter(v); setPage(1) }}>
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
                      <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>{t('filters.allStatuses')}</SelectItem>
                          <SelectItem value="paid">{t('payment.paid')}</SelectItem>
                          <SelectItem value="unpaid">{t('payment.unpaid')}</SelectItem>
                          <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-64">
                      <label className="block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                        {t('filters.dateRange')}
                      </label>
                      <DateRangePicker value={dateRange} onChange={(r) => { setDateRange(r); setPage(1) }} />
                    </div>

                    <div className="w-48">
                      <label className="block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                        {t('filters.sort')}
                      </label>
                      <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date_desc">{t('filters.sortDateDesc')}</SelectItem>
                          <SelectItem value="date_asc">{t('filters.sortDateAsc')}</SelectItem>
                          <SelectItem value="amount_desc">{t('filters.sortAmountDesc')}</SelectItem>
                          <SelectItem value="amount_asc">{t('filters.sortAmountAsc')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-medium mb-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                        {t('filters.search')}
                      </label>
                      <Input
                        value={filters.search ?? ''}
                        onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value || undefined })); setPage(1) }}
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
                          setStatusFilter(ALL)
                          setDateRange({ from: undefined, to: undefined })
                          setPage(1)
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

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <Button variant="ghost" onClick={exportCsv} disabled={filteredRows.length === 0}>
                  <Download className="h-4 w-4" />
                  {t('exportCsv')}
                </Button>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                    {t('pagination.summary', { page: currentPage, pages: pageCount, total: filteredRows.length })}
                  </span>
                  <select
                    aria-label={t('pagination.pageSize')}
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                    className="rounded-lg border border-slate-200 dark:border-gray-700 bg-transparent px-2 py-1"
                  >
                    {[20, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <Button variant="ghost" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                    {t('pagination.prev')}
                  </Button>
                  <Button variant="ghost" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
                    {t('pagination.next')}
                  </Button>
                </div>
              </div>

        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (!cancelTarget) return
          cancelExpense.mutate(
            { id: cancelTarget.id, reason: cancelReason.trim() || undefined },
            { onSuccess: () => setCancelTarget(null) },
          )
        }}
        title={t('cancelDialog.title')}
        message={
          <div className="space-y-3">
            <p>{t('cancelDialog.message', { name: cancelTarget?.title ?? '' })}</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={300}
              rows={2}
              aria-label={t('cancelDialog.reason')}
              placeholder={t('cancelDialog.reason')}
              className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>
        }
        confirmLabel={t('cancelDialog.confirm')}
        cancelLabel={t('cancelDialog.back')}
        isLoading={cancelExpense.isPending}
      />

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
