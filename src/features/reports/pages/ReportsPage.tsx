'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { useRevenueReport, useShiftsReport, useExpensesReport, useEmployeesReport, useTaxReport, useComparisonReport, useBranchComparisonReport, useCustomerChurnReport } from '../hooks/useReports'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Clock, TrendingDown, CreditCard, Users, Receipt, GitCompareArrows, Building2, UserMinus, ArrowUp, ArrowDown } from 'lucide-react'
import { DateRangePicker, type DateRange } from '@/shared/ui/date-range-picker'
import { formatNumber } from '@/lib/format'

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function defaultRange(): DateRange {
  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - 1)
  return { from: toYMD(from), to: toYMD(to) }
}

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-gray-400">—</span>
  const positive = pct >= 0
  const Icon = positive ? ArrowUp : ArrowDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
      <Icon className="w-3 h-3" />
      {Math.abs(pct)}%
    </span>
  )
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: string
  icon: any
  color: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

export function ReportsPage() {
  const t = useTranslations('reports')
  const currency = useTenantStore((s) => s.currency_symbol)
  const [range, setRange] = useState<DateRange>(defaultRange)
  const query = { period: 'custom' as const, from: range.from, to: range.to }

  const { data: revenue, isLoading: revLoading } = useRevenueReport(query)
  const { data: shifts, isLoading: shiftsLoading } = useShiftsReport(query)
  const { data: expenses, isLoading: expLoading } = useExpensesReport(query)
  const { data: employees, isLoading: employeesLoading } = useEmployeesReport(query)
  const { data: tax, isLoading: taxLoading } = useTaxReport(query)
  const { data: comparison, isLoading: comparisonLoading } = useComparisonReport(query)
  const { data: byBranch, isLoading: byBranchLoading, error: byBranchError } = useBranchComparisonReport(query)
  const { data: churn, isLoading: churnLoading } = useCustomerChurnReport(query)

  const summary = revenue?.summary
  const dailyBreakdown = revenue?.daily_breakdown ?? []
  const byPaymentMethod = revenue?.by_payment_method ?? {}
  const byCategory = expenses?.by_category ?? []
  const shiftsSummary = shifts?.summary

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <DateRangePicker value={range} onChange={(r) => r.from && r.to && setRange(r)} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('totalRevenue')}
          value={revLoading ? '...' : `${formatNumber(summary?.total_revenue ?? 0)} ${currency}`}
          icon={TrendingUp}
          color="bg-emerald-600"
        />
        <StatCard
          label={t('totalOrders')}
          value={revLoading ? '...' : String(summary?.total_orders ?? 0)}
          icon={CreditCard}
          color="bg-[#0C447C]"
        />
        <StatCard
          label={t('totalShifts')}
          value={shiftsLoading ? '...' : String(shiftsSummary?.total_shifts ?? 0)}
          icon={Clock}
          color="bg-violet-600"
        />
        <StatCard
          label={t('totalExpenses')}
          value={expLoading ? '...' : `${formatNumber(expenses?.summary?.total_approved_amount ?? 0)} ${currency}`}
          icon={TrendingDown}
          color="bg-red-600"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('revenueChart')}</h2>
        {revLoading ? (
          <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">{t('loading')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#374151]" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--tooltip-bg, #ffffff)',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  color: '#111827',
                }}
                formatter={(value?: number | string | readonly (number | string)[]) => [`${formatNumber(Number(value))} ${currency}`, t('revenue')]}
              />
              <Bar dataKey="total" fill="#0C447C" radius={[4, 4, 0, 0]} name={t('revenue')} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('paymentMethods')}</h2>
        {revLoading ? (
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <div className="space-y-2">
            {Object.entries(byPaymentMethod).map(([method, data]: [string, any]) => (
              <div key={method} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{method}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-500 dark:text-gray-500">{data.count} {t('orders')}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{formatNumber(data.total ?? 0)} {currency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('expensesByCategory')}</h2>
        {expLoading ? (
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <div className="space-y-2">
            {byCategory.map((c: any) => (
              <div key={c.category} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{c.category}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-500 dark:text-gray-500">{c.count} {t('items')}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{formatNumber(c.total ?? 0)} {currency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('employeePerformance')}</h2>
        </div>
        {employeesLoading ? (
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <div className="space-y-2">
            {(employees?.employees ?? []).map((e) => (
              <div key={e.cashier_id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{e.name}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-500 dark:text-gray-500">{e.order_count} {t('orders')}</span>
                  <span className="text-gray-500 dark:text-gray-500">{t('avgOrder')}: {formatNumber(e.avg_order_value)} {currency}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{formatNumber(e.total_sales)} {currency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('taxSummary')}</h2>
        </div>
        {taxLoading ? (
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">{t('subtotalBeforeTax')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatNumber(tax?.summary.total_subtotal ?? 0)} {currency}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('taxCollected')} ({((tax?.tax_rate ?? 0) * 100).toFixed(0)}%)</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatNumber(tax?.summary.total_tax_collected ?? 0)} {currency}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('totalRevenue')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatNumber(tax?.summary.grand_total ?? 0)} {currency}</p>
            </div>
          </div>
        )}
      </div>

      {/* Period Comparison */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitCompareArrows className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('periodComparison')}</h2>
        </div>
        {comparisonLoading ? (
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('totalRevenue')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{formatNumber(comparison?.current_period.revenue ?? 0)} {currency}</p>
              <ChangeBadge pct={comparison?.change.revenue_pct ?? null} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('totalOrders')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{comparison?.current_period.order_count}</p>
              <ChangeBadge pct={comparison?.change.order_count_pct ?? null} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('avgOrder')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{formatNumber(comparison?.current_period.avg_order_value ?? 0)} {currency}</p>
              <ChangeBadge pct={comparison?.change.avg_order_value_pct ?? null} />
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3">{t('vsPreviousPeriod')}</p>
      </div>

      {/* Branch Comparison — only visible with reports.view.all */}
      {!byBranchError && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('branchComparison')}</h2>
          </div>
          {byBranchLoading ? (
            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          ) : (byBranch?.branches ?? []).length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">{t('noBranches')}</p>
          ) : (
            <div className="space-y-2">
              {(byBranch?.branches ?? []).map((b) => (
                <div key={b.branch_id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{b.branch_name}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-500 dark:text-gray-500">{b.order_count} {t('orders')}</span>
                    <span className="text-gray-900 dark:text-white font-medium">{formatNumber(b.revenue)} {currency}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Customer Churn */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserMinus className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('customerChurn')}</h2>
        </div>
        {churnLoading ? (
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">{t('previousCustomers')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{churn?.previous_period_customers ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('churnedCustomers')}</p>
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-1">{churn?.churned_customers ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('churnRate')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{churn?.churn_rate_pct ?? 0}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}