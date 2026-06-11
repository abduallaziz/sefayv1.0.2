'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, Users,
  Download, RefreshCw, Shield, ArrowUpRight, Activity,
} from 'lucide-react'
import AuditLogViewer from './components/AuditLogViewer'
import { superadminApi } from '../api/superadmin.api'

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, trend, trendUp }: {
  label: string
  value: string
  sub: string
  icon: any
  trend?: string
  trendUp?: boolean
}) {
  return (
    <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-[#1e2130] flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-slate-500 mt-1">{sub}</div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
  )
}

const PLAN_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

type Tab = 'overview' | 'revenue' | 'tenants' | 'audit'

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReportsAuditPage() {
  const t = useTranslations('superadmin.reports')
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // ── Queries ──
  const statsQuery = useQuery({
    queryKey: ['superadmin', 'stats'],
    queryFn: () => superadminApi.getStats(),
  })

  const mrrQuery = useQuery({
  queryKey: ['superadmin', 'analytics', 'mrr'],
  queryFn: async () => {
    const res = await superadminApi.getMRR() as any;
    return typeof res === 'number' ? res : res?.mrr ?? 0;
  },
})

  const arrQuery = useQuery({
  queryKey: ['superadmin', 'analytics', 'arr'],
  queryFn: async () => {
    const res = await superadminApi.getARR() as any;
    return typeof res === 'number' ? res : res?.arr ?? 0;
  },
})

  const mrrHistoryQuery = useQuery({
    queryKey: ['superadmin', 'analytics', 'mrr-history'],
    queryFn: () => superadminApi.getMRRHistory('last_12_months'),
  })

  const churnQuery = useQuery({
    queryKey: ['superadmin', 'analytics', 'churn'],
    queryFn: () => superadminApi.getChurnRate('last_12_months'),
  })

  const growthQuery = useQuery({
    queryKey: ['superadmin', 'analytics', 'growth'],
    queryFn: () => superadminApi.getGrowthRate('last_12_months'),
  })

  const revenueByPlanQuery = useQuery({
    queryKey: ['superadmin', 'analytics', 'revenue-by-plan'],
    queryFn: () => superadminApi.getRevenueByPlan(),
  })

  // ── Derived values ──
  const stats     = statsQuery.data
  const mrr       = mrrQuery.data ?? 0
  const arr       = arrQuery.data ?? 0
  const mrrHistory = mrrHistoryQuery.data ?? []
  const churn     = churnQuery.data
  const growth    = growthQuery.data
  const byPlan    = revenueByPlanQuery.data ?? []

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: t('overview'), icon: Activity },
    { key: 'revenue',  label: t('revenue'),  icon: DollarSign },
    { key: 'tenants',  label: t('tenants'),  icon: Users },
    { key: 'audit',    label: t('auditLog'), icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-[#141720] border border-[#1e2130] rounded-lg text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-all">
          <Download className="w-4 h-4" />
          {t('export')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#141720] border border-[#1e2130] rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={t('mrr')}
              value={statsQuery.isLoading ? '...' : `$${mrr.toLocaleString()}`}
              sub="Monthly Recurring Revenue"
              icon={DollarSign}
            />
            <StatCard
              label={t('arr')}
              value={statsQuery.isLoading ? '...' : `$${arr.toLocaleString()}`}
              sub="Annual Run Rate"
              icon={TrendingUp}
            />
            <StatCard
              label={t('activeTenants')}
              value={stats ? String(stats.totalTenants) : '...'}
              sub={`${stats?.totalUsers ?? '—'} users`}
              icon={Users}
            />
            <StatCard
              label={t('churnRate')}
              value={churn ? `${churn.churnRate}%` : '...'}
              sub={churn ? `${churn.churned} churned` : '—'}
              icon={Activity}
              trendUp
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* MRR History */}
            <div className="lg:col-span-2 bg-[#141720] border border-[#1e2130] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">{t('mrrGrowth')}</h3>
                <span className="text-xs text-slate-500">{t('last6months')}</span>
              </div>
              {mrrHistoryQuery.isLoading ? (
                <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={mrrHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} labelStyle={{ color: '#fff' }} formatter={(v: any) => [`$${v.toLocaleString()}`, t('mrr')]} />
                    <Line type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Revenue by Plan */}
            <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{t('tenantsByPlan')}</h3>
              {revenueByPlanQuery.isLoading ? (
                <div className="h-[160px] flex items-center justify-center text-slate-500 text-sm">Loading...</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={byPlan} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="mrr" paddingAngle={3}>
                        {byPlan.map((_, i) => (
                          <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {byPlan.map((p, i) => (
                      <div key={p.planName} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                          <span className="text-slate-400">{p.planName}</span>
                        </div>
                        <span className="text-white font-medium">{p.tenantCount}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Churn Trend */}
          <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">{t('churnTrend')}</h3>
              {churn && churn.churnRate < 2 && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> {t('improving')}
                </span>
              )}
            </div>
            {churnQuery.isLoading ? (
              <div className="h-[160px] flex items-center justify-center text-slate-500 text-sm">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={churn?.monthly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} formatter={(v: any) => [`${v}%`, t('churnRate')]} />
                  <Bar dataKey="rate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Revenue ── */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={t('currentMrr')} value={`$${mrr.toLocaleString()}`} sub="Monthly Recurring" icon={DollarSign} />
            <StatCard label={t('currentArr')} value={`$${arr.toLocaleString()}`} sub="Annual Run Rate"   icon={TrendingUp} />
            <StatCard label={t('totalOrders')} value={stats ? String(stats.totalOrders) : '...'} sub="All time" icon={ArrowUpRight} />
            <StatCard label={t('totalRevenue')} value={stats ? `$${stats.totalRevenue.toLocaleString()}` : '...'} sub="From orders" icon={DollarSign} />
          </div>

          <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">{t('mrrVsArr')}</h3>
            {mrrHistoryQuery.isLoading ? (
              <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mrrHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} />
                  <Bar dataKey="mrr" name={t('mrr')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue by Plan Table */}
          <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">{t('revenueByPlan')}</h3>
            <div className="space-y-2">
              {byPlan.map((plan, i) => (
                <div key={plan.planName} className="flex items-center justify-between py-2.5 border-b border-[#1e2130] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                    <span className="text-sm text-white">{plan.planName}</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs">
                    <span className="text-slate-400">{plan.tenantCount} tenants</span>
                    <span className="text-slate-400">{plan.percentage}%</span>
                    <span className="text-white font-bold w-20 text-right">${plan.mrr.toLocaleString()}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tenants ── */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={t('totalTenants')}
              value={stats ? String(stats.totalTenants) : '...'}
              sub={`${stats?.totalUsers ?? '—'} total users`}
              icon={Users}
            />
            <StatCard
              label={t('newThisMonth')}
              value={growth ? String(growth.newTenants) : '...'}
              sub="New tenants"
              icon={ArrowUpRight}
              trendUp
            />
            <StatCard
              label={t('churned')}
              value={churn ? String(churn.churned) : '...'}
              sub="This period"
              icon={TrendingDown}
            />
            <StatCard
              label={t('growthRate')}
              value={growth ? `${growth.growthRate}%` : '...'}
              sub="Period growth"
              icon={TrendingUp}
              trendUp={growth ? growth.growthRate > 0 : undefined}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* New vs Churned */}
            <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{t('newPerMonth')}</h3>
              {growthQuery.isLoading ? (
                <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={growth?.monthly ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} />
                    <Bar dataKey="new" name="New" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Plan Distribution */}
            <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{t('planDist')}</h3>
              {revenueByPlanQuery.isLoading ? (
                <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={byPlan}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="tenantCount"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {byPlan.map((_, i) => (
                        <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Audit ── */}
      {activeTab === 'audit' && <AuditLogViewer />}
    </div>
  )
}