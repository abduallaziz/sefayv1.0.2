'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, Users,
  AlertTriangle, Download, RefreshCw,
  Shield, ArrowUpRight, Activity,
} from 'lucide-react'
import AuditLogViewer from './components/AuditLogViewer'

const revenueData = [
  { month: 'Jan', mrr: 12400, arr: 148800, churn: 2.1 },
  { month: 'Feb', mrr: 13200, arr: 158400, churn: 1.8 },
  { month: 'Mar', mrr: 14800, arr: 177600, churn: 2.4 },
  { month: 'Apr', mrr: 15600, arr: 187200, churn: 1.5 },
  { month: 'May', mrr: 17200, arr: 206400, churn: 1.2 },
  { month: 'Jun', mrr: 19400, arr: 232800, churn: 0.9 },
]

const tenantsByPlan = [
  { name: 'Basic', value: 142, color: '#3b82f6' },
  { name: 'Pro', value: 87, color: '#8b5cf6' },
  { name: 'Enterprise', value: 23, color: '#10b981' },
  { name: 'Trial', value: 61, color: '#f59e0b' },
]

const topTenants = [
  { name: 'مطعم البيت', plan: 'Enterprise', mrr: 1200, status: 'active', growth: 12 },
  { name: 'كافيه نجمة', plan: 'Pro', mrr: 480, status: 'active', growth: 8 },
  { name: 'محل الأمل', plan: 'Pro', mrr: 480, status: 'active', growth: -2 },
  { name: 'ورشة السرعة', plan: 'Basic', mrr: 120, status: 'trial', growth: 0 },
  { name: 'سوبرماركت النور', plan: 'Enterprise', mrr: 1200, status: 'active', growth: 22 },
]

function StatCard({ label, value, sub, icon: Icon, trend, trendUp }: {
  label: string, value: string, sub: string,
  icon: any, trend?: string, trendUp?: boolean
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

type Tab = 'overview' | 'revenue' | 'tenants' | 'audit'

export default function ReportsAuditPage() {
  const t = useTranslations('reports')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [exportLoading, setExportLoading] = useState(false)

  const tabs: { key: Tab, label: string, icon: any }[] = [
    { key: 'overview', label: t('overview'), icon: Activity },
    { key: 'revenue', label: t('revenue'), icon: DollarSign },
    { key: 'tenants', label: t('tenants'), icon: Users },
    { key: 'audit', label: t('auditLog'), icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => { setExportLoading(true); setTimeout(() => setExportLoading(false), 1500) }}
          className="flex items-center gap-2 px-3 py-2 bg-[#141720] border border-[#1e2130] rounded-lg text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-all"
        >
          {exportLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {t('export')}
        </button>
      </div>

      <div className="flex gap-1 bg-[#141720] border border-[#1e2130] rounded-xl p-1 w-fit">
        {tabs.map(tab => (
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

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={t('mrr')} value="$19,400" sub="Monthly Recurring Revenue" icon={DollarSign} trend="+12.8% vs last month" trendUp />
            <StatCard label={t('arr')} value="$232,800" sub="Annual Run Rate" icon={TrendingUp} trend="+12.8% annualized" trendUp />
            <StatCard label={t('activeTenants')} value="252" sub="142 basic · 87 pro · 23 ent" icon={Users} trend="+18 this month" trendUp />
            <StatCard label={t('churnRate')} value="0.9%" sub="Down from 2.1% in Jan" icon={Activity} trend="-1.2% improvement" trendUp />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-[#141720] border border-[#1e2130] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">{t('mrrGrowth')}</h3>
                <span className="text-xs text-slate-500">{t('last6months')}</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} labelStyle={{ color: '#fff' }} formatter={(v: any) => [`$${v.toLocaleString()}`, t('mrr')]} />
                  <Line type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{t('tenantsByPlan')}</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={tenantsByPlan} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {tenantsByPlan.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {tenantsByPlan.map(p => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-slate-400">{p.name}</span>
                    </div>
                    <span className="text-white font-medium">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">{t('churnTrend')}</h3>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> {t('improving')}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} formatter={(v: any) => [`${v}%`, t('churnRate')]} />
                <Bar dataKey="churn" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Revenue */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={t('currentMrr')} value="$19,400" sub="Jun 2025" icon={DollarSign} trend="+12.8%" trendUp />
            <StatCard label={t('currentArr')} value="$232,800" sub="Projected" icon={TrendingUp} trend="+12.8%" trendUp />
            <StatCard label={t('newMrr')} value="$3,200" sub="From new tenants" icon={ArrowUpRight} trend="+5 tenants" trendUp />
            <StatCard label={t('churnedMrr')} value="$180" sub="Lost this month" icon={AlertTriangle} trend="-$320 vs last month" trendUp />
          </div>
          <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">{t('mrrVsArr')}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} />
                <Bar dataKey="mrr" name={t('mrr')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">{t('topTenants')}</h3>
            <div className="space-y-2">
              {topTenants.map((ten, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#1e2130] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#1e2130] flex items-center justify-center text-xs font-bold text-slate-400">{i + 1}</div>
                    <div>
                      <div className="text-sm font-medium text-white">{ten.name}</div>
                      <div className="text-xs text-slate-500">{ten.plan}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1 text-xs ${ten.growth > 0 ? 'text-emerald-400' : ten.growth < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {ten.growth > 0 ? <TrendingUp className="w-3 h-3" /> : ten.growth < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                      {ten.growth !== 0 ? `${ten.growth > 0 ? '+' : ''}${ten.growth}%` : '—'}
                    </div>
                    <div className="text-sm font-bold text-white w-16 text-right">${ten.mrr}/mo</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ten.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{ten.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tenants */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={t('totalTenants')} value="313" sub="252 active · 61 trial" icon={Users} trend="+18 this month" trendUp />
            <StatCard label={t('newThisMonth')} value="23" sub="vs 18 last month" icon={ArrowUpRight} trend="+27.8%" trendUp />
            <StatCard label={t('churned')} value="4" sub="This month" icon={TrendingDown} trend="-2 vs last month" trendUp />
            <StatCard label={t('avgRevenue')} value="$77" sub="ARPU" icon={DollarSign} trend="+$8 vs last month" trendUp />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{t('newPerMonth')}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { month: 'Jan', new: 8, churned: 3 },
                  { month: 'Feb', new: 11, churned: 2 },
                  { month: 'Mar', new: 14, churned: 4 },
                  { month: 'Apr', new: 18, churned: 3 },
                  { month: 'May', new: 21, churned: 2 },
                  { month: 'Jun', new: 23, churned: 4 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} />
                  <Bar dataKey="new" name="New" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="churned" name="Churned" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{t('planDist')}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={tenantsByPlan} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {tenantsByPlan.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2130', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Audit */}
      {activeTab === 'audit' && <AuditLogViewer />}
    </div>
  )
}