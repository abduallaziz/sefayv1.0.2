'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, ShoppingCart, Users, Wallet,
  Clock, BarChart3, Zap, AlertCircle,
  CheckCircle, CreditCard, RotateCcw, Star,
} from 'lucide-react'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { useThemeStore } from '@/core/theme/stores/theme.store'
import { reportsApi } from '@/features/reports/api/reports.api'
import { shiftsApi } from '@/features/shifts/api/shifts.api'
import { customersApi } from '@/features/customers/api/customers.api'
import Link from 'next/link'

type Period = 'today' | 'week' | 'month'

/* ── Theme tokens ── */
function useDashboardColors(isDark: boolean) {
  return {
    cardBg: isDark ? 'rgba(22,27,34,0.78)' : 'rgba(255,255,255,0.74)',
    cardBorder: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.95)',
    cardShadow: isDark ? '0 4px 6px rgba(0,0,0,0.2),0 8px 24px rgba(0,0,0,0.25)' : '0 4px 6px rgba(10,22,40,0.03),0 8px 24px rgba(10,22,40,0.07)',
    cardShadowHover: isDark ? '0 8px 16px rgba(0,0,0,0.25),0 20px 48px rgba(0,0,0,0.3)' : '0 8px 16px rgba(10,22,40,0.05),0 20px 48px rgba(10,22,40,0.12)',
    textPrimary: isDark ? '#E6EDF3' : '#0A1628',
    textSecondary: isDark ? '#8B949E' : '#54657C',
    textMuted: isDark ? '#6E7681' : '#8C9CB2',
    divider: isDark ? 'rgba(255,255,255,0.08)' : '#EEF2F7',
    chipBg: isDark ? 'rgba(255,255,255,0.05)' : '#F5F8FC',
    iconChipBg: isDark ? 'rgba(91,155,213,0.14)' : 'linear-gradient(135deg,#EAF2FB,#DBEAFE)',
    iconColor: isDark ? '#5B9BD5' : '#0C447C',
    tagNeutralBg: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9',
    tagNeutralBorder: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F1',
    gridLine: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,22,40,0.04)',
    axisTick: isDark ? '#6E7681' : '#94A3B8',
    rankFallbackBg: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
  }
}

/* ── Sparkline ── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const points = data.map((v) => ({ v }))
  return (
    <ResponsiveContainer width="100%" height={34}>
      <LineChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

/* ── Stat Card ── */
function StatCard({
  title, value, delta, deltaUp, icon: Icon, spark, sparkColor, stripe, c,
}: {
  title: string; value: string; delta?: string; deltaUp?: boolean
  icon: React.ElementType; spark: number[]; sparkColor: string; stripe: string
  c: ReturnType<typeof useDashboardColors>
}) {
  return (
    <div style={{
      background: c.cardBg,
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      borderRadius: '20px',
      border: c.cardBorder,
      boxShadow: c.cardShadow,
      position: 'relative', overflow: 'hidden',
      transition: 'all .3s cubic-bezier(.4,0,.2,1)',
      cursor: 'default',
    }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = c.cardShadowHover }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = c.cardShadow }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: '3px', background: stripe }} />
      <div style={{ padding: '18px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '13px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: stripe, boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}>
            <Icon size={20} color="#fff" strokeWidth={2.2} />
          </div>
          {delta && (
            <div style={{
              fontSize: '11px', fontWeight: 700, padding: '4px 9px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '3px',
              background: deltaUp ? '#DCFCE7' : '#FEE2E2',
              color: deltaUp ? '#15803D' : '#B91C1C',
            }}>
              {deltaUp ? '↑' : '↓'} {delta}
            </div>
          )}
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: c.textPrimary, letterSpacing: '-1px', lineHeight: 1, marginBottom: '5px' }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', color: c.textSecondary, fontWeight: 500 }}>{title}</div>
      </div>
      <div style={{ marginTop: '12px', marginRight: '-1px', marginLeft: '-1px', marginBottom: '-1px' }}>
        <Sparkline data={spark} color={sparkColor} />
      </div>
    </div>
  )
}

/* ── Glass Card ── */
function GlassCard({ children, style, c }: { children: React.ReactNode; style?: React.CSSProperties; c: ReturnType<typeof useDashboardColors> }) {
  return (
    <div style={{
      background: c.cardBg,
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      borderRadius: '20px',
      border: c.cardBorder,
      boxShadow: c.cardShadow,
      padding: '22px',
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ── Card Header ── */
function CardHeader({ icon: Icon, title, sub, tag, c }: {
  icon: React.ElementType; title: string; sub?: string
  tag?: { label: string; color: 'green' | 'neutral' }
  c: ReturnType<typeof useDashboardColors>
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '11px',
          background: c.iconChipBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 2px rgba(10,22,40,0.05)',
        }}>
          <Icon size={18} color={c.iconColor} strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: c.textPrimary }}>{title}</div>
          {sub && <div style={{ fontSize: '11px', color: c.textMuted, marginTop: '2px' }}>{sub}</div>}
        </div>
      </div>
      {tag && (
        <div style={{
          fontSize: '11px', fontWeight: 700, padding: '5px 11px', borderRadius: '9px',
          display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
          ...(tag.color === 'green'
            ? { background: '#DCFCE7', color: '#15803D' }
            : { background: c.tagNeutralBg, color: c.textSecondary, border: c.tagNeutralBorder, cursor: 'pointer' }),
        }}>
          {tag.label}
        </div>
      )}
    </div>
  )
}

/* ── Activity icon ── */
function ActivityIcon({ type }: { type: 'order' | 'refund' | 'alert' }) {
  const cfg = {
    order:  { bg: 'linear-gradient(135deg,#D1FAE5,#A7F3D0)', color: '#059669', Icon: CheckCircle },
    refund: { bg: 'linear-gradient(135deg,#FEF3C7,#FDE68A)', color: '#D97706', Icon: RotateCcw },
    alert:  { bg: 'linear-gradient(135deg,#FEE2E2,#FECACA)', color: '#DC2626', Icon: AlertCircle },
  }[type]
  return (
    <div style={{
      width: '42px', height: '42px', borderRadius: '13px', flexShrink: 0,
      background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <cfg.Icon size={19} color={cfg.color} strokeWidth={2.2} />
    </div>
  )
}

const PERIOD_MAP: Record<Period, 'today' | 'week' | 'month'> = {
  today: 'today',
  week:  'week',
  month: 'month',
}

const PAYMENT_COLORS: Record<string, string> = {
  cash:    '#059669',
  card:    '#0C447C',
  split:   '#7C3AED',
  unknown: '#94A3B8',
}

/* ══════════════════════════════════════════════════════════ */
export function DashboardOverview() {
  const user    = useAuthStore((s) => s.user)
  const currency = useTenantStore((s) => s.currency_symbol)
  const router  = useRouter()
  const locale  = useLocale()
  const [period, setPeriod] = useState<Period>('week')
  const t = useTranslations('dashboard')
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const c = useDashboardColors(isDark)

  const PERIOD_LABELS: Record<Period, string> = {
    today: t('periodToday'),
    week:  t('periodWeek'),
    month: t('periodMonth'),
  }


  useEffect(() => {
    if (!user) router.replace(`/${locale}/login`)
  }, [user, router, locale])

  const apiPeriod = PERIOD_MAP[period]

  const { data: revenue } = useQuery({
    queryKey: ['dashboard', 'revenue', apiPeriod],
    queryFn: () => reportsApi.getRevenue({ period: apiPeriod }),
    enabled: !!user, refetchInterval: 30000, staleTime: 0,
  })

  const { data: payments } = useQuery({
    queryKey: ['dashboard', 'payments', apiPeriod],
    queryFn: () => reportsApi.getPayments({ period: apiPeriod }),
    enabled: !!user, refetchInterval: 30000, staleTime: 0,
  })

  const { data: expenses } = useQuery({
    queryKey: ['dashboard', 'expenses', apiPeriod],
    queryFn: () => reportsApi.getExpenses({ period: apiPeriod }),
    enabled: !!user, refetchInterval: 30000, staleTime: 0,
  })

  const { data: shift } = useQuery({
    queryKey: ['dashboard', 'shift'],
    queryFn: () => shiftsApi.getCurrent(),
    enabled: !!user, refetchInterval: 10000, staleTime: 0,
  })

  const { data: customerStats } = useQuery({
    queryKey: ['dashboard', 'customers'],
    queryFn: () => customersApi.getStats(),
    enabled: !!user, refetchInterval: 60000, staleTime: 0,
  })

  const { data: sparklines } = useQuery({
    queryKey: ['dashboard', 'sparklines'],
    queryFn: () => reportsApi.getSparklines(),
    enabled: !!user, staleTime: 60000,
  })

  const { data: topItems } = useQuery({
    queryKey: ['dashboard', 'top-items', apiPeriod],
    queryFn: () => reportsApi.getTopItems({ period: apiPeriod }),
    enabled: !!user, staleTime: 60000,
  })

  const { data: recentActivity } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => reportsApi.getRecentActivity(),
    enabled: !!user, refetchInterval: 30000, staleTime: 0,
  })

  if (!user) return null

  /* ── Data ── */
  const totalRevenue  = revenue?.summary?.total_revenue   ?? 0
  const totalOrders   = revenue?.summary?.total_orders    ?? 0
  const avgOrder      = revenue?.summary?.avg_order_value ?? 0
  const totalExpenses = expenses?.summary?.total_approved_amount ?? 0
  const totalCustomers = customerStats?.total ?? 0

  const shiftDuration = shift?.opened_at ? (() => {
    const diff = Date.now() - new Date(shift.opened_at).getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}:${String(m).padStart(2, '0')}`
  })() : null

  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US'

  /* Bar chart — daily_breakdown */
  const barData = (revenue?.daily_breakdown ?? []).map((d) => ({
    label: new Date(d.date).toLocaleDateString(dateLocale, { weekday: 'short' }),
    current: d.total,
  }))

  /* Doughnut — by_payment_method */
  const donutData = Object.entries(revenue?.by_payment_method ?? {}).map(([key, val]) => ({
    name: key === 'cash' ? t('cash') : key === 'card' ? t('card') : key === 'split' ? t('split') : t('other'),
    value: val.total,
    color: PAYMENT_COLORS[key] ?? '#94A3B8',
  }))
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0)

  /* Hero area chart */
  const heroData = (revenue?.daily_breakdown ?? []).map((d) => ({ v: d.total }))

  /* Sparklines */
  const sp = sparklines ?? { sales: [0,0,0,0,0,0,0], orders: [0,0,0,0,0,0,0], customers: [0,0,0,0,0,0,0], expenses: [0,0,0,0,0,0,0] }

  /* Today date */
  const todayStr = new Date().toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: c.textPrimary, letterSpacing: '-0.6px' }}>
            {t('greeting', { name: user?.name ?? '...' })} 👋
          </div>
          <div style={{ fontSize: '12px', color: c.textMuted, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            {shift && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: '#DCFCE7', color: '#15803D',
                padding: '2px 9px', borderRadius: '20px', fontWeight: 600, fontSize: '11px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                {t('live')}
              </span>
            )}
            {todayStr}
          </div>
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            background: c.cardBg, backdropFilter: 'blur(12px)',
            border: c.cardBorder,
            borderRadius: '13px', padding: '4px', gap: '2px',
            boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(10,22,40,0.06)',
          }}>
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '7px 15px', borderRadius: '10px', fontSize: '12px',
                  fontWeight: 600, cursor: 'pointer', border: 'none',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                  transition: 'all .2s',
                  ...(period === p
                    ? { background: 'linear-gradient(135deg,#0C447C,#1761B8)', color: '#fff', boxShadow: '0 6px 18px rgba(12,68,124,0.32)' }
                    : { background: 'transparent', color: c.textSecondary }),
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hero Band ── */}
      <div style={{
        position: 'relative', borderRadius: '22px', overflow: 'hidden',
        marginBottom: '18px',
        background: isDark
          ? 'linear-gradient(125deg,#0D1117 0%,#11161F 50%,#161D29 100%)'
          : 'linear-gradient(125deg,#0C447C 0%,#155799 50%,#2671C4 100%)',
        border: isDark ? '1px solid rgba(91,155,213,0.18)' : 'none',
        boxShadow: isDark
          ? '0 12px 32px rgba(0,0,0,0.5)'
          : '0 12px 36px rgba(12,68,124,0.25),0 4px 12px rgba(12,68,124,0.18)',
        minHeight: '150px',
      }}>
        {/* Area chart bg */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.35, zIndex: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={heroData.length ? heroData : [{ v: 0 }]} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(191,219,254,0.35)" />
                  <stop offset="100%" stopColor="rgba(191,219,254,0)" />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="rgba(191,219,254,0.75)" strokeWidth={2} fill="url(#heroGrad)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Mesh overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(500px 250px at 95% 0%,rgba(99,102,241,0.18),transparent 60%),radial-gradient(420px 240px at 0% 100%,rgba(14,165,233,0.14),transparent 55%)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block', boxShadow: '0 0 0 3px rgba(74,222,128,0.3)' }} />
              {t('totalSalesLabel')} · {PERIOD_LABELS[period]}
            </div>
            <div style={{ fontSize: '40px', fontWeight: 700, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '9px' }}>
              {totalRevenue.toLocaleString('en-US')}
              <span style={{ fontSize: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.72)' }}>{currency}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '14px', flexWrap: 'wrap' }}>
              {avgOrder > 0 && (
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.62)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {t('avgOrderLabel')}: {avgOrder.toLocaleString('en-US', { maximumFractionDigits: 1 })} {currency}
                </span>
              )}
            </div>
          </div>

          {/* Hero stats */}
          <div style={{ display: 'flex', gap: '14px', flexShrink: 0, flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.16)', borderRadius: '15px', padding: '14px 18px', minWidth: '108px',
            }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '9px' }}>
                <ShoppingCart size={17} color="#fff" strokeWidth={2} />
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.5px' }}>
                {totalOrders.toLocaleString('en-US')}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.62)', marginTop: '5px' }}>{t('ordersUnit')}</div>
            </div>
            {shiftDuration && (
              <div style={{
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.16)', borderRadius: '15px', padding: '14px 18px', minWidth: '108px',
              }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '9px' }}>
                  <Clock size={17} color="#fff" strokeWidth={2} />
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.5px' }}>
                  {shiftDuration}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.62)', marginTop: '5px' }}>{t('shiftDurationLabel')}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '18px' }} className="stat-grid">
        <StatCard c={c} title={t('statSales')} value={totalRevenue.toLocaleString('en-US')} icon={TrendingUp}
          spark={sp.sales} sparkColor="#2563EB"
          stripe="linear-gradient(90deg,#0C447C,#3B82F6)" />
        <StatCard c={c} title={t('statOrders')} value={totalOrders.toLocaleString('en-US')} icon={ShoppingCart}
          spark={sp.orders} sparkColor="#059669"
          stripe="linear-gradient(90deg,#059669,#34D399)" />
        <StatCard c={c} title={t('statNewCustomers')} value={totalCustomers.toLocaleString('en-US')} icon={Users}
          spark={sp.customers} sparkColor="#7C3AED"
          stripe="linear-gradient(90deg,#6D28D9,#A78BFA)" />
        <StatCard c={c} title={t('statExpensesTitle')} value={totalExpenses.toLocaleString('en-US')} icon={Wallet}
          spark={sp.expenses} sparkColor="#D97706"
          stripe="linear-gradient(90deg,#B45309,#FBBF24)" />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '16px', marginBottom: '16px' }} className="chart-grid">

        {/* Bar chart */}
        <GlassCard c={c}>
          <CardHeader c={c} icon={BarChart3} title={t('dailySales')} sub={`${PERIOD_LABELS[period]}`} tag={{ label: `↑ ${t('growth')}`, color: 'green' }} />
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.gridLine} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.axisTick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: c.axisTick }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                <Tooltip
                  contentStyle={{ background: 'rgba(10,22,40,0.95)', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`${(Number(v) || 0).toLocaleString('en-US')} ${currency}`, '']}
                />
                <Bar dataKey="current" fill="#0C447C" radius={[8, 8, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Doughnut */}
        <GlassCard c={c}>
          <CardHeader c={c} icon={CreditCard} title={t('paymentMethods')} sub={t('periodDistribution')} />
          <div style={{ position: 'relative', height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData.length ? donutData : [{ name: t('noDataLabel'), value: 1, color: c.rankFallbackBg }]}
                  cx="50%" cy="50%" innerRadius="60%" outerRadius="85%"
                  dataKey="value" startAngle={90} endAngle={-270} strokeWidth={3}>
                  {(donutData.length ? donutData : [{ name: t('noDataLabel'), value: 1, color: c.rankFallbackBg }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke={isDark ? '#0D1117' : '#fff'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(10,22,40,0.95)', border: 'none', borderRadius: '10px', fontSize: '11px', color: '#fff' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`${(Number(v) || 0).toLocaleString('en-US')} ${currency}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: c.textPrimary, letterSpacing: '-0.5px' }}>
                {totalOrders}
              </div>
              <div style={{ fontSize: '10px', color: c.textMuted, marginTop: '2px' }}>{t('ordersUnit')}</div>
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px', marginTop: '14px' }}>
            {donutData.map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: c.textSecondary,
                padding: '7px 9px', borderRadius: '9px', background: c.chipBg,
              }}>
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{d.name}</span>
                <span style={{ fontWeight: 700, color: c.textPrimary }}>
                  {donutTotal > 0 ? Math.round((d.value / donutTotal) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ── Bottom Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }} className="bottom-grid">

        {/* Recent activity */}
        <GlassCard c={c}>
          <CardHeader c={c} icon={BarChart3} title={t('recentActivity')} sub={t('recentActivitySub')} tag={{ label: t('viewAll'), color: 'neutral' }} />
          <div>
            {(recentActivity?.activity ?? []).length === 0 && (
              <p style={{ fontSize: '13px', color: c.textMuted, textAlign: 'center', padding: '20px 0' }}>{t('noActivity')}</p>
            )}
            {(recentActivity?.activity ?? []).map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '13px 0', borderBottom: i < (recentActivity?.activity ?? []).length - 1 ? `1px solid ${c.divider}` : 'none',
              }}>
                <ActivityIcon type={item.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: c.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '11px', color: c.textMuted, marginTop: '2px' }}>{item.sub}</div>
                </div>
                <div style={{ textAlign: 'end', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: item.amount !== null && item.amount < 0 ? '#DC2626' : c.textPrimary }}>
                    {item.amount !== null ? `${item.amount.toLocaleString('en-US')} ${currency}` : t('alertLabel')}
                  </div>
                  <div style={{ fontSize: '10px', color: c.textMuted, marginTop: '2px' }}>
                    {new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Top items */}
          <GlassCard c={c}>
            <CardHeader c={c} icon={Star} title={t('topSelling')} sub={PERIOD_LABELS[period]} />
            {(topItems?.items ?? []).length === 0 && (
              <p style={{ fontSize: '13px', color: c.textMuted, textAlign: 'center', padding: '12px 0' }}>{t('noDataLabel')}</p>
            )}
            {(topItems?.items ?? []).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 0', borderBottom: i < (topItems?.items ?? []).length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 800, color: '#fff',
                  background: i === 0 ? 'linear-gradient(135deg,#FBBF24,#F59E0B)'
                    : i === 1 ? 'linear-gradient(135deg,#CBD5E1,#94A3B8)'
                    : i === 2 ? 'linear-gradient(135deg,#D97706,#B45309)'
                    : c.rankFallbackBg,
                  ...(i >= 3 ? { color: c.textMuted } : {}),
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: c.textPrimary }}>{item.name}</div>
                  <div style={{ height: '5px', background: c.rankFallbackBg, borderRadius: '5px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '5px', width: `${item.pct}%`, background: 'linear-gradient(90deg,#0C447C,#3B82F6)', borderRadius: '5px' }} />
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#5B9BD5' : '#0C447C', flexShrink: 0 }}>
                  {item.total.toLocaleString('en-US')} {currency}
                </div>
              </div>
            ))}
          </GlassCard>

          {/* Quick actions */}
          <GlassCard c={c}>
            <CardHeader c={c} icon={Zap} title={t('quickActions')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: t('newInvoice'),  sub: t('posLabel'),          href: '/dashboard/pos',       color: 'linear-gradient(135deg,#1761B8,#0C447C)' },
                { label: t('newCustomer'), sub: t('addDataLabel'),      href: '/dashboard/customers', color: 'linear-gradient(135deg,#10B981,#059669)' },
                { label: t('newExpense'),  sub: t('recordExpenseLabel'), href: '/dashboard/expenses', color: 'linear-gradient(135deg,#F59E0B,#D97706)' },
                { label: t('todayReport'), sub: t('viewReportsLabel'),  href: '/dashboard/reports',   color: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' },
              ].map((a, i) => (
                <Link key={i} href={`/${locale}${a.href}`} style={{
                  display: 'flex', alignItems: 'center', gap: '11px',
                  padding: '14px', background: c.chipBg, borderRadius: '14px',
                  border: '1.5px solid transparent', textDecoration: 'none',
                  transition: 'all .25s', cursor: 'pointer',
                }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(12,68,124,0.2)'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = c.cardShadow }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'transparent'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Zap size={19} color="#fff" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: c.textPrimary }}>{a.label}</div>
                    <div style={{ fontSize: '10px', color: c.textMuted, marginTop: '2px' }}>{a.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .chart-grid { grid-template-columns: 1fr !important; }
          .bottom-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .stat-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .stat-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
