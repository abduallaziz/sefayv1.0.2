'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import {
  TrendingUp, ShoppingCart, Users, Clock,
  CreditCard, Wallet, BarChart3, AlertCircle,
  Zap, ArrowRight,
} from 'lucide-react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/features/reports/api/reports.api'
import { shiftsApi } from '@/features/shifts/api/shifts.api'
import { customersApi } from '@/features/customers/api/customers.api'
import { StatCard } from '@/shared/ui/stat-card'
import Link from 'next/link'

/* ── Payment bar ────────────────────────────────────────── */
function PaymentBar({
  label,
  value,
  total,
  color = '#0C447C',
}: {
  label: string
  value: number
  total: number
  color?: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-content-secondary">{label}</span>
        <span className="tabular-nums text-sm font-medium text-content-primary">
          {value.toLocaleString('en-US')}
          <span className="text-content-muted text-xs ms-1">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

/* ── Section card wrapper ───────────────────────────────── */
function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div
      className="bg-surface-card rounded-md overflow-hidden"
      style={{ borderTop: '3px solid #0C447C' }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-content-primary">{title}</h2>
          <Icon className="w-4 h-4 text-content-muted" strokeWidth={2} />
        </div>
        {children}
      </div>
    </div>
  )
}

/* ── Quick action button ────────────────────────────────── */
function QuickAction({
  label,
  href,
  icon: Icon,
}: {
  label: string
  href: string
  icon: React.ElementType
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-medium text-brand-primary bg-brand-light dark:bg-brand/10 hover:bg-brand hover:text-white transition-all duration-150 group"
    >
      <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
      <span className="flex-1">{label}</span>
      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
    </Link>
  )
}

/* ── Mock sparkline data (replace with real later) ──────── */
const SPARK_SALES    = [12, 18, 14, 22, 19, 28, 24, 31, 27, 35]
const SPARK_ORDERS   = [4,  7,  5,  9,  8,  11, 9,  13, 11, 15]
const SPARK_CUSTOMERS= [2,  3,  2,  4,  3,  5,  4,  6,  5,  7]
const SPARK_EXPENSES = [8,  6,  9,  7,  10, 8,  11, 9,  8,  10]

/* ── Main component ─────────────────────────────────────── */
export function DashboardOverview() {
  const t = useTranslations('dashboard')
  const user = useAuthStore((s) => s.user)
  const currency = useTenantStore((s) => s.currency_symbol)
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    if (!user) router.replace(`/${locale}/login`)
  }, [user, router, locale])

  const { data: revenue, isError: revError } = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: () => reportsApi.getRevenue({ period: 'today' }),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 0,
  })

  const { data: expenses } = useQuery({
    queryKey: ['dashboard', 'expenses'],
    queryFn: () => reportsApi.getExpenses({ period: 'today' }),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 0,
  })

  const { data: payments } = useQuery({
    queryKey: ['dashboard', 'payments'],
    queryFn: () => reportsApi.getPayments({ period: 'today' }),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 0,
  })

  const { data: shift } = useQuery({
    queryKey: ['dashboard', 'shift'],
    queryFn: () => shiftsApi.getCurrent(),
    enabled: !!user,
    refetchInterval: 10000,
    staleTime: 0,
  })

  const { data: customerStats } = useQuery({
    queryKey: ['dashboard', 'customers'],
    queryFn: () => customersApi.getStats(),
    enabled: !!user,
    refetchInterval: 60000,
    staleTime: 0,
  })

  if (!user) return null

  /* ── Data ── */
  const totalRevenue   = revenue?.summary?.total_revenue ?? 0
  const totalOrders    = revenue?.summary?.total_orders ?? 0
  const avgOrder       = revenue?.summary?.avg_order_value ?? 0
  const totalExpenses  = expenses?.summary?.total_approved_amount ?? 0
  const totalCustomers = customerStats?.total ?? 0

  const shiftDuration = shift?.opened_at
    ? (() => {
        const diff = Date.now() - new Date(shift.opened_at).getTime()
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        return `${h}h ${m}m`
      })()
    : '—'

  const paymentTotal = payments?.summary?.grand_total ?? 0
  const cash  = payments?.summary?.cash?.total ?? 0
  const card  = payments?.summary?.card?.total ?? 0
  const other = paymentTotal - cash - card

  return (
    <div className="space-y-6 max-w-content mx-auto animate-fade-up">

      {/* ── Hero band ── */}
      <div
        className="rounded-md p-5 lg:p-7 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 50%, #1761B8 100%)',
          boxShadow: '0 4px 20px rgba(12,68,124,0.25)',
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-8 -end-8 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.3)' }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-6 -start-6 w-24 h-24 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.2)' }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm mb-1">{t('quickStats')}</p>
            <h1 className="text-xl lg:text-2xl font-bold">
              {t('welcome')}، {user?.name ?? '...'} 👋
            </h1>
          </div>

          {/* Hero stat */}
          <div className="text-end">
            <p className="text-white/60 text-xs mb-1">{t('todaySales')}</p>
            <p className="tabular-nums text-3xl font-bold">
              {totalRevenue.toLocaleString('en-US')}
              <span className="text-lg font-normal ms-1 text-white/70">{currency}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {revError && (
        <div className="flex items-center gap-2 bg-semantic-error-bg border border-semantic-error/20 rounded-sm px-4 py-3 text-semantic-error text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span>{t('noData')}</span>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4 stagger">
        <StatCard
          title={t('todaySales')}
          value={`${totalRevenue.toLocaleString('en-US')} ${currency}`}
          icon={TrendingUp}
          sparkline={SPARK_SALES}
          sparklineColor="#0C447C"
        />
        <StatCard
          title={t('invoices')}
          value={totalOrders.toLocaleString('en-US')}
          sub={avgOrder > 0 ? `${t('avgOrder')}: ${avgOrder.toLocaleString('en-US')} ${currency}` : undefined}
          icon={ShoppingCart}
          sparkline={SPARK_ORDERS}
          sparklineColor="#2671C4"
        />
        <StatCard
          title={t('customers')}
          value={totalCustomers.toLocaleString('en-US')}
          icon={Users}
          sparkline={SPARK_CUSTOMERS}
          sparklineColor="#10B981"
          variant="success"
        />
        <StatCard
          title={t('totalExpenses')}
          value={`${totalExpenses.toLocaleString('en-US')} ${currency}`}
          icon={Wallet}
          sparkline={SPARK_EXPENSES}
          sparklineColor="#F59E0B"
          variant="warning"
        />
      </div>

      {/* ── Payment methods + Shift ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">

        <SectionCard title={t('salesByPayment')} icon={CreditCard}>
          {paymentTotal > 0 ? (
            <div className="space-y-3">
              <PaymentBar label={t('cash')}  value={cash}  total={paymentTotal} color="#0C447C" />
              <PaymentBar label={t('card')}  value={card}  total={paymentTotal} color="#2671C4" />
              {other > 0 && (
                <PaymentBar label={t('other')} value={other} total={paymentTotal} color="#10B981" />
              )}
            </div>
          ) : (
            <p className="text-sm text-content-muted">{t('noData')}</p>
          )}
        </SectionCard>

        <SectionCard title={t('shiftDuration')} icon={Clock}>
          {shift ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                <span className="text-sm font-medium text-brand-primary dark:text-blue-300">
                  {t('openShift')}
                </span>
              </div>
              <p className="tabular-nums text-3xl font-semibold text-content-primary">
                {shiftDuration}
              </p>
              <p className="text-xs text-content-muted">
                {t('shiftOpenedAt')}: {new Date(shift.opened_at).toLocaleTimeString('en-US')}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-content-muted">
              <BarChart3 className="w-4 h-4" strokeWidth={2} />
              <span>{t('noShift')}</span>
            </div>
          )}
        </SectionCard>

      </div>

      {/* ── Quick actions ── */}
      <div
        className="bg-surface-card rounded-md overflow-hidden"
        style={{ borderTop: '3px solid #0C447C' }}
      >
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-brand-primary" strokeWidth={2} />
            <h2 className="text-sm font-semibold text-content-primary">{t('quickStats')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <QuickAction label={t('openShift')}   href={`/${locale}/dashboard/shifts`}   icon={Clock} />
            <QuickAction label={t('invoices')}     href={`/${locale}/dashboard/pos`}      icon={ShoppingCart} />
            <QuickAction label={t('customers')}    href={`/${locale}/dashboard/customers`} icon={Users} />
            <QuickAction label={t('totalExpenses')} href={`/${locale}/dashboard/expenses`} icon={Wallet} />
          </div>
        </div>
      </div>

    </div>
  )
}