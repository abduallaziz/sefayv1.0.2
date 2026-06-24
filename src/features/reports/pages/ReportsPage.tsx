'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { useRevenueReport, useShiftsReport, useExpensesReport } from '../hooks/useReports'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Clock, TrendingDown, CreditCard } from 'lucide-react'
import type { ReportPeriod } from '../api/reports.api'

const PERIODS: { key: ReportPeriod; labelKey: string }[] = [
  { key: 'today', labelKey: 'today' },
  { key: 'week', labelKey: 'week' },
  { key: 'month', labelKey: 'month' },
]

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
  const [period, setPeriod] = useState<ReportPeriod>('month')

  const { data: revenue, isLoading: revLoading } = useRevenueReport({ period })
  const { data: shifts, isLoading: shiftsLoading } = useShiftsReport({ period })
  const { data: expenses, isLoading: expLoading } = useExpensesReport({ period })

  const summary = (revenue as any)?.summary
  const dailyBreakdown = (revenue as any)?.daily_breakdown ?? []
  const byPaymentMethod = (revenue as any)?.by_payment_method ?? {}
  const byCategory = (expenses as any)?.by_category ?? []
  const shiftsSummary = (shifts as any)?.summary

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p.key
                  ? 'bg-[#0C447C] text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('totalRevenue')}
          value={revLoading ? '...' : `${(summary?.total_revenue ?? 0).toLocaleString('en-US')} ${currency}`}
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
          value={expLoading ? '...' : `${((expenses as any)?.summary?.total_expenses ?? 0).toLocaleString('en-US')} ${currency}`}
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
              />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('revenue')} />
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
                  <span className="text-gray-900 dark:text-white font-medium">{data.total?.toLocaleString('en-US')} {currency}</span>
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
                  <span className="text-gray-900 dark:text-white font-medium">{c.total?.toLocaleString('en-US')} {currency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}