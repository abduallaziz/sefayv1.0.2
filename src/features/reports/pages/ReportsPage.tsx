'use client'

import { useBranchIsolation } from '@/features/branches/hooks/useBranchesAdmin'
import { useBranchContext } from '@/core/branch/useBranchContext'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { useRevenueReport, useShiftsReport, useExpensesReport, useEmployeesReport, useTaxReport, useComparisonReport, useBranchComparisonReport, useCustomerChurnReport, useCustomersReport, useDailyReconciliation, useCogsReport } from '../hooks/useReports'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CreditCard, Download, Percent, Printer, Receipt, Store, Tag, TrendingDown, TrendingUp } from 'lucide-react'
import { DateRangePicker, SingleDatePicker, type DateRange } from '@/shared/ui/date-range-picker'
import { PageHeader } from '@/shared/ui/page-header'
import { StatCard } from '@/shared/ui/stat-card'
import { Skeleton } from '@/shared/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import { useBranches } from '@/shared/hooks/useBranches'
import { fillMissingDays, downloadCsv } from '../lib/reports-utils'
import { CHART_COLORS, GroupHeading, MetricTile, RankedList, ReportCard, Segmented } from '../components/report-ui'

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function defaultRange(): DateRange {
  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - 1)
  return { from: toYMD(from), to: toYMD(to) }
}

type PresetKey = 'today' | 'd7' | 'month' | 'quarter' | 'year'
function presetRange(key: PresetKey): DateRange {
  const now = new Date()
  const from = new Date(now)
  if (key === 'd7') from.setDate(from.getDate() - 6)
  else if (key === 'month') from.setDate(1)
  else if (key === 'quarter') from.setMonth(Math.floor(now.getMonth() / 3) * 3, 1)
  else if (key === 'year') from.setMonth(0, 1)
  return { from: toYMD(from), to: toYMD(now) }
}
const PRESETS: PresetKey[] = ['today', 'd7', 'month', 'quarter', 'year']

const num = (v: number | undefined | null) => formatNumber(v ?? 0)
const int = (v: number | undefined | null) => formatNumber(v ?? 0, 0)
const pct1 = (v: number | null | undefined) => (v === null || v === undefined ? undefined : Number(v.toFixed(1)))

const ghostBtn = 'inline-flex items-center gap-1.5 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3 py-2 text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-posCloud-sidebar dark:hover:bg-posCloudDark-sidebar focus:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary'

export function ReportsPage() {
  const t = useTranslations('reports')
  const tOrders = useTranslations('orders')
  const currency = useCurrencyDisplay()
  const [range, setRange] = useState<DateRange>(defaultRange)
  const [branchId, setBranchId] = useState('')
  const { data: branches } = useBranches()
  const { currentBranchId, availableBranches } = useBranchContext()
  // Branch isolation: reports always follow the working branch (the server resolves it), so the
  // branch filter is hidden and no explicit branch_id is sent.
  const { data: isolation } = useBranchIsolation()
  const isolated = isolation?.enabled === true
  const query = { period: 'custom' as const, from: range.from, to: range.to, branch_id: (!isolated && branchId) || undefined }
  const [peopleSort, setPeopleSort] = useState<'sales' | 'orders'>('sales')
  const [reconciliationDate, setReconciliationDate] = useState<string>(toYMD(new Date()))

  const revenueQ = useRevenueReport(query)
  const shiftsQ = useShiftsReport(query)
  const expensesQ = useExpensesReport(query)
  const employeesQ = useEmployeesReport(query)
  const taxQ = useTaxReport(query)
  const comparisonQ = useComparisonReport(query)
  const byBranchQ = useBranchComparisonReport(query)
  const churnQ = useCustomerChurnReport(query)
  const customersQ = useCustomersReport(query)
  const reconQ = useDailyReconciliation(reconciliationDate, (!isolated && branchId) || undefined)
  const cogsQ = useCogsReport(query)

  const { data: revenue } = revenueQ
  const { data: shifts } = shiftsQ
  const { data: expenses } = expensesQ
  const { data: employees } = employeesQ
  const { data: tax } = taxQ
  const { data: comparison } = comparisonQ
  const { data: byBranch, error: byBranchError } = byBranchQ
  const { data: churn } = churnQ
  const { data: customersReport } = customersQ
  const { data: reconciliation } = reconQ
  const { data: cogs } = cogsQ

  const summary = revenue?.summary
  const dailyBreakdown = useMemo(() => fillMissingDays(revenue?.daily_breakdown ?? [], range.from, range.to), [revenue?.daily_breakdown, range.from, range.to])
  const byPaymentMethod = revenue?.by_payment_method ?? {}
  const byCategory = expenses?.by_category ?? []
  const shiftsSummary = shifts?.summary
  const sortedEmployees = [...(employees?.employees ?? [])].sort((a, b) => (peopleSort === 'sales' ? b.total_sales - a.total_sales : b.order_count - a.order_count))
  const sortedCustomers = [...(customersReport?.customers ?? [])].sort((a, b) => (peopleSort === 'sales' ? b.total_spent - a.total_spent : b.order_count - a.order_count))
  const methodLabel = (m: string) => (tOrders.has(`payment_method.${m}`) ? tOrders(`payment_method.${m}`) : m)
  const paymentRows = Object.entries(byPaymentMethod).map(([m, v]) => ({ key: m, name: methodLabel(m), count: v.count, total: v.total ?? 0 }))
  const paymentTotal = paymentRows.reduce((s, r) => s + r.total, 0)
  const workingBranchName = availableBranches?.find((b) => b.id === currentBranchId)?.name
  const branchIndicator = isolated
    ? (workingBranchName ?? '—')
    : branchId
      ? ((branches ?? []).find((b) => b.id === branchId)?.name ?? '—')
      : t('allBranches')

  const exportCsv = () => {
    const rows: (string | number)[][] = [[t('csvSection'), t('csvMetric'), t('csvValue'), t('csvCount')]]
    rows.push([t('title'), t('totalRevenue'), summary?.total_revenue ?? 0, summary?.total_orders ?? 0])
    rows.push([t('title'), t('netRevenue'), summary?.net_revenue ?? 0, ''])
    for (const d of revenue?.daily_breakdown ?? []) rows.push([t('revenueChart'), d.date, d.total, ''])
    for (const [m, v] of Object.entries(byPaymentMethod)) rows.push([t('paymentMethods'), methodLabel(m), v.total, v.count])
    rows.push([t('taxSummary'), t('subtotalGross'), tax?.summary.total_subtotal ?? 0, ''])
    rows.push([t('taxSummary'), t('discountsLabel'), tax?.summary.total_discount ?? 0, ''])
    rows.push([t('taxSummary'), t('taxCollected'), tax?.summary.total_tax_collected ?? 0, ''])
    rows.push([t('taxSummary'), t('totalRevenue'), tax?.summary.grand_total ?? 0, ''])
    for (const e of sortedEmployees) rows.push([t('employeePerformance'), e.name ?? t('unassigned'), e.total_sales, e.order_count])
    for (const c of sortedCustomers) rows.push([t('topCustomers'), c.name, c.total_spent, c.order_count])
    for (const b of byBranch?.branches ?? []) rows.push([t('branchComparison'), b.branch_name ?? t('unassignedBranch'), b.revenue, b.order_count])
    downloadCsv(`reports-${range.from ?? ''}_${range.to ?? ''}.csv`, rows)
  }

  const money = (v: number | undefined) => `${num(v)} ${currency}`
  const sparkValues = dailyBreakdown.map((d) => d.total)
  const sortOptions = [
    { value: 'sales' as const, label: t('sortBySales') },
    { value: 'orders' as const, label: t('sortByOrders') },
  ]
  const delta = (p: number | null | undefined) => ({ change: pct1(p), changeLabel: p === null || p === undefined ? undefined : t('vsPrevShort') })
  const discrepancy = reconciliation?.cash_shifts.total_discrepancy ?? 0

  return (
    <div className="space-y-5">
      <PageHeader
        className="!mb-0 !pb-0 !border-b-0"
        title={t('title')}
        description={t('subtitle')}
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3 py-1.5 text-sm">
            <Store className="h-4 w-4 text-posCloud-primary" aria-hidden />
            <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('workingBranch')}</span>
            <span className="font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{branchIndicator}</span>
          </div>
        }
      />

      {/* Filter bar */}
      <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-posCloud-background/90 dark:bg-posCloudDark-background/90 backdrop-blur print:hidden">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface p-2">
          <div role="group" aria-label={t('quickRanges')} className="inline-flex rounded-lg bg-posCloud-sidebar dark:bg-posCloudDark-sidebar p-0.5">
            {PRESETS.map((k) => {
              const r = presetRange(k)
              const active = r.from === range.from && r.to === range.to
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRange(r)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary',
                    active ? 'bg-posCloud-primary text-white shadow-sm' : 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary',
                  )}
                >
                  {t(`preset.${k}`)}
                </button>
              )
            })}
          </div>
          <DateRangePicker value={range} onChange={(r) => r.from && r.to && setRange(r)} />
          {!isolated && (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              aria-label={t('branchFilter')}
              className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3 py-2 text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary"
            >
              <option value="">{t('allBranches')}</option>
              {(branches ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <div className="ms-auto flex items-center gap-2">
            <button type="button" onClick={exportCsv} className={ghostBtn}><Download className="h-4 w-4" aria-hidden />{t('exportCsv')}</button>
            <button type="button" onClick={() => window.print()} className={ghostBtn}><Printer className="h-4 w-4" aria-hidden />{t('print')}</button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <section aria-label={t('kpiLabel')} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {revenueQ.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[128px] rounded-xl" />)
        ) : (
          <>
            <StatCard className="col-span-2 lg:col-span-1" title={t('totalRevenue')} value={money(summary?.total_revenue)} icon={TrendingUp} variant="success" sparkline={sparkValues} sparklineColor="#16a34a" {...delta(comparison?.change.revenue_pct)} />
            <StatCard title={t('totalOrders')} value={int(summary?.total_orders)} icon={CreditCard} variant="default" {...delta(comparison?.change.order_count_pct)} />
            <StatCard title={t('avgInvoice')} value={money(summary?.avg_order_value)} icon={Receipt} variant="info" {...delta(comparison?.change.avg_order_value_pct)} />
            <StatCard title={t('vatCollected')} value={money(summary?.total_tax)} icon={Percent} variant="warning" sub={`${t('netRevenue')}: ${num(summary?.net_revenue)}`} />
            <StatCard title={t('discountsLabel')} value={money(summary?.total_discount)} icon={Tag} variant="danger" />
            <StatCard title={`${t('totalExpenses')} (${t('beforeTax')})`} value={expensesQ.isLoading ? '…' : money(expenses?.summary?.total_approved_amount)} icon={TrendingDown} variant="danger" />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        <GroupHeading>{t('groups.sales')}</GroupHeading>

        <ReportCard className="md:col-span-2 lg:col-span-8" title={t('revenueChart')} description={t('revenueChartDesc')} isLoading={revenueQ.isLoading} error={revenueQ.error} onRetry={() => revenueQ.refetch()} isEmpty={dailyBreakdown.length === 0} minHeight="min-h-[260px]">
          <div dir="ltr" className="h-[260px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" role="img" aria-label={t('revenueChart')}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyBreakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-posCloud-border dark:stroke-posCloudDark-border" />
                <XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis width={56} tick={{ fill: 'currentColor', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatNumber(v, 0)} />
                <Tooltip
                  cursor={{ stroke: '#2563eb', strokeOpacity: 0.3 }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3 py-2 text-xs shadow-md">
                        <p className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary tabular-nums">{String(label)}</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatNumber(Number(payload[0].value))} {currency}</p>
                      </div>
                    ) : null
                  }
                />
                <Area type="monotone" dataKey="total" name={t('revenue')} stroke="#2563eb" strokeWidth={2} fill="url(#rev-fill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ReportCard>

        <ReportCard className="md:col-span-2 lg:col-span-4" title={t('paymentMethods')} description={t('paymentMethodsDesc')} isLoading={revenueQ.isLoading} error={revenueQ.error} onRetry={() => revenueQ.refetch()} isEmpty={paymentRows.length === 0} minHeight="min-h-[260px]">
          <div className="flex flex-col gap-4">
            <div dir="ltr" className="relative mx-auto h-[150px] w-[150px]" role="img" aria-label={t('paymentMethods')}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentRows} dataKey="total" nameKey="name" innerRadius={52} outerRadius={72} paddingAngle={2} stroke="none">
                    {paymentRows.map((r, i) => <Cell key={r.key} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('totalRevenue')}</span>
                <span className="text-sm font-bold tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatNumber(paymentTotal, 0)}</span>
              </div>
            </div>
            <ul className="space-y-2">
              {paymentRows.map((r, i) => (
                <li key={r.key} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{r.name}</span>
                  <span className="text-xs tabular-nums text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{paymentTotal ? Math.round((r.total / paymentTotal) * 100) : 0}% · {r.count} {t('payments')}</span>
                  <span className="font-semibold tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{num(r.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        </ReportCard>

        <ReportCard className="lg:col-span-5" title={t('periodComparison')} description={t('vsPreviousPeriod')} isLoading={comparisonQ.isLoading} error={comparisonQ.error} onRetry={() => comparisonQ.refetch()}>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3">
            {([
              ['totalRevenue', money(comparison?.current_period.revenue), comparison?.change.revenue_pct],
              ['totalOrders', int(comparison?.current_period.order_count), comparison?.change.order_count_pct],
              ['avgOrder', money(comparison?.current_period.avg_order_value), comparison?.change.avg_order_value_pct],
            ] as const).map(([k, v, p]) => (
              <MetricTile
                key={k}
                label={t(k)}
                value={v}
                hint={p === null || p === undefined
                  ? t('noPreviousData')
                  : <span className={p >= 0 ? 'text-posCloud-success' : 'text-posCloud-danger'}>{p >= 0 ? '▲' : '▼'} {Math.abs(Number(p.toFixed(1)))}%</span>}
              />
            ))}
          </div>
        </ReportCard>

        <ReportCard className="lg:col-span-7" title={t('taxSummary')} description={t('taxSummaryDesc')} isLoading={taxQ.isLoading} error={taxQ.error} onRetry={() => taxQ.refetch()}>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricTile label={t('subtotalGross')} value={`${num(tax?.summary.total_subtotal)} ${currency}`} />
            <MetricTile label={t('discountsLabel')} value={`${num(tax?.summary.total_discount)} ${currency}`} />
            <MetricTile label={`${t('taxCollected')} (${((tax?.tax_rate ?? 0) * 100).toFixed(0)}%)`} value={`${num(tax?.summary.total_tax_collected)} ${currency}`} />
            <MetricTile label={t('totalRevenue')} value={`${num(tax?.summary.grand_total)} ${currency}`} />
          </div>
          <p className="mt-3 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('taxNote')}</p>
        </ReportCard>

        <GroupHeading>{t('groups.cash')}</GroupHeading>

        <ReportCard
          className="md:col-span-2 lg:col-span-8"
          title={t('dailyReconciliation')}
          description={t('reconciliationDesc')}
          actions={<div className="print:hidden"><SingleDatePicker value={reconciliationDate} onChange={(v) => v && setReconciliationDate(v)} /></div>}
          isLoading={reconQ.isLoading}
          error={reconQ.error}
          onRetry={() => reconQ.refetch()}
          minHeight="min-h-[260px]"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <MetricTile label={t('salesTotal')} value={`${num(reconciliation?.sales.total_revenue)} ${currency}`} hint={`${int(reconciliation?.sales.total_orders)} ${t('orders')}`} />
              <MetricTile label={t('expensesTotal')} value={`${num(reconciliation?.expenses.total_approved_amount)} ${currency}`} hint={`${int(reconciliation?.expenses.approved_count)} ${t('items')}`} />
              <MetricTile label={t('closedShifts')} value={int(reconciliation?.cash_shifts.closed_shift_count)} />
              <MetricTile
                label={t('discrepancy')}
                tone={discrepancy === 0 ? 'default' : 'danger'}
                value={`${num(discrepancy)} ${currency}`}
                hint={`${t('shortage')}: ${num(reconciliation?.cash_shifts.shortage_total)} · ${t('overage')}: ${num(reconciliation?.cash_shifts.overage_total)}`}
              />
            </div>
            <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary tabular-nums">
              {t('cancelledInvoices')}: {int(reconciliation?.sales.cancelled_count)} ({num(reconciliation?.sales.cancelled_amount)}) · {t('returnedInvoices')}: {int(reconciliation?.sales.returned_count)} ({num(reconciliation?.sales.returned_amount)})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricTile label={t('openingCash')} value={`${num(reconciliation?.cash_shifts.total_opening_cash)} ${currency}`} />
              <MetricTile label={t('closingCash')} value={`${num(reconciliation?.cash_shifts.total_closing_cash)} ${currency}`} />
              <MetricTile label={t('expectedCash')} value={`${num(reconciliation?.cash_shifts.total_expected_cash)} ${currency}`} />
            </div>
            {Object.keys(reconciliation?.sales.by_payment_method ?? {}).length > 0 && (
              <RankedList
                ariaLabel={t('paymentMethods')}
                items={Object.entries(reconciliation?.sales.by_payment_method ?? {}).map(([m, v]) => ({ key: m, label: methodLabel(m), weight: v.total, display: `${num(v.total)} ${currency}`, meta: `${int(v.count)} ${t('payments')}` }))}
              />
            )}
          </div>
        </ReportCard>

        <ReportCard className="md:col-span-2 lg:col-span-4" title={t('shiftsTitle')} description={t('shiftsDesc')} isLoading={shiftsQ.isLoading} error={shiftsQ.error} onRetry={() => shiftsQ.refetch()} minHeight="min-h-[260px]">
          <div className="grid grid-cols-2 gap-3">
            <MetricTile label={t('totalShifts')} value={int(shiftsSummary?.total_shifts)} />
            <MetricTile label={t('closedShifts')} value={int(shiftsSummary?.closed_shifts)} tone="success" />
            <MetricTile label={t('openShifts')} value={int(shiftsSummary?.open_shifts)} />
            <MetricTile label={t('discrepancy')} tone={(shiftsSummary?.total_discrepancy ?? 0) === 0 ? 'default' : 'danger'} value={num(shiftsSummary?.total_discrepancy)} hint={`${t('shortage')}: ${num(shiftsSummary?.shortage_total)} · ${t('overage')}: ${num(shiftsSummary?.overage_total)}`} />
          </div>
        </ReportCard>

        <GroupHeading>{t('groups.costs')}</GroupHeading>

        <ReportCard className="lg:col-span-6" title={`${t('expensesByCategory')} (${t('beforeTax')})`} description={t('expensesDesc')} isLoading={expensesQ.isLoading} error={expensesQ.error} onRetry={() => expensesQ.refetch()} isEmpty={byCategory.length === 0}>
          <RankedList
            ariaLabel={t('expensesByCategory')}
            color="#ef4444"
            items={byCategory.map((c) => ({ key: c.category, label: c.category, weight: c.total ?? 0, display: `${num(c.total)} ${currency}`, meta: `${int(c.count)} ${t('items')}` }))}
          />
        </ReportCard>

        <ReportCard className="lg:col-span-6" title={t('cogs')} description={t('cogsDesc')} isLoading={cogsQ.isLoading} error={cogsQ.error} onRetry={() => cogsQ.refetch()}>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile label={t('cogsTotal')} value={`${num(cogs?.summary.total_cogs)} ${currency}`} />
            <MetricTile label={t('netRevenue')} value={`${num(cogs?.summary.total_revenue)} ${currency}`} />
            <MetricTile label={t('grossProfit')} value={`${num(cogs?.summary.gross_profit)} ${currency}`} tone="success" />
            <MetricTile label={t('grossMargin')} value={`${cogs?.summary.gross_margin_pct ?? 0}%`} />
          </div>
          {(cogs?.top_by_cost ?? []).length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('cogsTopByCost')}</p>
              <RankedList
                ariaLabel={t('cogsTopByCost')}
                color="#f59e0b"
                items={(cogs?.top_by_cost ?? []).map((i) => ({ key: i.item_id, label: i.item_name, weight: i.total_cost, display: `${num(i.total_cost)} ${currency}`, meta: `${int(i.quantity_sold)} ${t('units')}` }))}
              />
            </div>
          )}
          {cogs?.coverage_note && <p className="mt-3 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('cogsCoverageNote')}</p>}
        </ReportCard>

        <GroupHeading>{t('groups.people')}</GroupHeading>

        <ReportCard
          className="lg:col-span-6"
          title={t('employeePerformance')}
          description={t('employeesDesc')}
          actions={<Segmented value={peopleSort} onChange={setPeopleSort} options={sortOptions} ariaLabel={t('sortBy')} />}
          isLoading={employeesQ.isLoading}
          error={employeesQ.error}
          onRetry={() => employeesQ.refetch()}
          isEmpty={sortedEmployees.length === 0}
        >
          <RankedList
            ariaLabel={t('employeePerformance')}
            items={sortedEmployees.map((e) => ({
              key: e.cashier_id ?? 'unassigned',
              label: e.name ?? t('unassigned'),
              weight: peopleSort === 'sales' ? e.total_sales : e.order_count,
              display: `${num(e.total_sales)} ${currency}`,
              meta: `${int(e.order_count)} ${t('orders')} · ${t('avgOrder')}: ${num(e.avg_order_value)} ${currency}`,
            }))}
          />
        </ReportCard>

        <ReportCard
          className="lg:col-span-6"
          title={t('topCustomers')}
          description={t('customersDesc')}
          actions={<Segmented value={peopleSort} onChange={setPeopleSort} options={sortOptions} ariaLabel={t('sortBy')} />}
          isLoading={customersQ.isLoading}
          error={customersQ.error}
          onRetry={() => customersQ.refetch()}
          isEmpty={sortedCustomers.length === 0}
          emptyTitle={t('noCustomers')}
        >
          <RankedList
            ariaLabel={t('topCustomers')}
            color="#7c3aed"
            items={sortedCustomers.slice(0, 10).map((c) => ({
              key: c.customer_id,
              label: c.name,
              weight: peopleSort === 'sales' ? c.total_spent : c.order_count,
              display: `${num(c.total_spent)} ${currency}`,
              meta: `${int(c.order_count)} ${t('orders')} · ${t('avgOrder')}: ${num(c.avg_order_value)} ${currency}`,
            }))}
          />
        </ReportCard>

        <ReportCard className={byBranchError ? 'md:col-span-2 lg:col-span-12' : 'lg:col-span-5'} title={t('customerChurn')} description={t('churnDesc')} isLoading={churnQ.isLoading} error={churnQ.error} onRetry={() => churnQ.refetch()}>
          <div className="grid grid-cols-3 gap-3">
            <MetricTile label={t('previousCustomers')} value={int(churn?.previous_period_customers)} />
            <MetricTile label={t('churnedCustomers')} value={int(churn?.churned_customers)} tone="danger" />
            <MetricTile label={t('churnRate')} value={`${churn?.churn_rate_pct ?? 0}%`} />
          </div>
        </ReportCard>

        {/* Branch comparison: only visible with reports.view.all */}
        {!byBranchError && (
          <ReportCard className="lg:col-span-7" title={t('branchComparison')} description={t('branchDesc')} isLoading={byBranchQ.isLoading} isEmpty={(byBranch?.branches ?? []).length === 0} emptyTitle={t('noBranches')}>
            <RankedList
              ariaLabel={t('branchComparison')}
              color="#16a34a"
              items={(byBranch?.branches ?? []).map((b) => ({ key: b.branch_id ?? 'unassigned', label: b.branch_name ?? t('unassignedBranch'), weight: b.revenue, display: `${num(b.revenue)} ${currency}`, meta: `${int(b.order_count)} ${t('orders')}` }))}
            />
          </ReportCard>
        )}
      </div>
    </div>
  )
}
