'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRevenueReport, useShiftsReport, useExpensesReport, usePaymentsReport } from '../hooks/useReports'
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
    <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

export function ReportsPage() {
  const t = useTranslations('reports')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-1 bg-[#141720] border border-[#1e2130] rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
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
          value={revLoading ? '...' : `${summary?.total_revenue?.toLocaleString() ?? 0} ر.س`}
          icon={TrendingUp}
          color="bg-emerald-600"
        />
        <StatCard
          label={t('totalOrders')}
          value={revLoading ? '...' : String(summary?.total_orders ?? 0)}
          icon={CreditCard}
          color="bg-blue-600"
        />
        <StatCard
          label={t('totalShifts')}
          value={shiftsLoading ? '...' : String(shiftsSummary?.total_shifts ?? 0)}
          icon={Clock}
          color="bg-violet-600"
        />
        <StatCard
          label={t('totalExpenses')}
          value={expLoading ? '...' : `${(expenses as any)?.summary?.total_expenses?.toLocaleString() ?? 0} ر.س`}
          icon={TrendingDown}
          color="bg-red-600"
        />
      </div>

      <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">{t('revenueChart')}</h2>
        {revLoading ? (
          <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">{t('loading')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('revenue')} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">{t('paymentMethods')}</h2>
        {revLoading ? (
          <div className="h-10 bg-[#1e2130] rounded animate-pulse" />
        ) : (
          <div className="space-y-2">
            {Object.entries(byPaymentMethod).map(([method, data]: [string, any]) => (
              <div key={method} className="flex items-center justify-between py-2 border-b border-[#1e2130] last:border-0">
                <span className="text-sm text-slate-400">{method}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">{data.count} {t('orders')}</span>
                  <span className="text-white font-medium">{data.total?.toLocaleString()} ر.س</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">{t('expensesByCategory')}</h2>
        {expLoading ? (
          <div className="h-10 bg-[#1e2130] rounded animate-pulse" />
        ) : (
          <div className="space-y-2">
            {byCategory.map((c: any) => (
              <div key={c.category} className="flex items-center justify-between py-2 border-b border-[#1e2130] last:border-0">
                <span className="text-sm text-slate-400">{c.category}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">{c.count} {t('items')}</span>
                  <span className="text-white font-medium">{c.total?.toLocaleString()} ر.س</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}