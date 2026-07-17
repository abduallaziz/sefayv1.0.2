'use client'

import { useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingCart, Users, Wallet, Tag,
  BarChart3, Star, Zap, AlertCircle, UtensilsCrossed,
  Banknote, CreditCard, Landmark, Smartphone, WalletCards,
  Boxes, PackageOpen, Layers3, Receipt,
} from 'lucide-react'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { reportsApi } from '@/features/reports/api/reports.api'
import { shiftsApi } from '@/features/shifts/api/shifts.api'
import { customersApi } from '@/features/customers/api/customers.api'
import { tablesApi } from '@/features/tables/api/tables.api'
import { itemsApi } from '@/features/items/api/items.api'
import { fetchOrders } from '@/features/orders/api/orders.api'
import { useBusinessType } from '@/shared/hooks/useBusinessType'
import { DateRangePicker, type DateRange } from '@/shared/ui/date-range-picker'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function defaultRange(): DateRange {
  const today = toYMD(new Date())
  return { from: today, to: today }
}

/* Real day-over-day delta from an already-loaded 7-day sparkline array —
   the pos-cloud "vs yesterday" chip, computed from real data (last two
   points of the same series already fetched for the sparkline), never a
   new API call or invented figure. */
function computeDelta(series: number[] | undefined): { pct: string; positive: boolean } | null {
  if (!series || series.length < 2) return null
  const prev = series[series.length - 2]
  const curr = series[series.length - 1]
  if (!prev) return null
  const pct = ((curr - prev) / prev) * 100
  return { pct: `${Math.abs(pct).toFixed(0)}%`, positive: pct >= 0 }
}

/* ── pos-cloud's exact Card/CardHeader/CardTitle values (rounded-2xl,
   p-5, shadow-[0_1px_2px_rgba(15,23,42,0.04)]) — reproduced directly
   with posCloud/posCloudDark tokens instead of shared/ui/card.tsx's
   own (differently-tuned) radius/padding, to match pos-cloud pixel-for-
   pixel rather than approximate it. ── */
function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'rounded-2xl border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
      className
    )}>
      {children}
    </div>
  )
}
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[15px] font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{title}</h3>
      {action}
    </div>
  )
}

/* ── pos-cloud's exact StatCard: icon chip, label, value+unit, delta
   ("↑/↓ N% vs yesterday") pinned to the bottom via mt-auto. ── */
function StatCard({
  icon: Icon, iconBg, iconColor, label, value, unit, delta, vsYesterdayLabel,
}: {
  icon: React.ElementType; iconBg: string; iconColor: string
  label: string; value: string; unit?: string
  delta: { pct: string; positive: boolean } | null
  vsYesterdayLabel: string
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface p-5">
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <p className="mt-4 text-xs font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{label}</p>
      <div className="mt-1">
        <div className="break-words text-base font-extrabold leading-tight text-posCloud-text-primary dark:text-posCloudDark-text-primary sm:text-2xl">{value}</div>
        <div className="mt-0.5 h-4 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{unit}</div>
      </div>
      {delta && (
        <div className="mt-auto flex items-center gap-1 text-xs">
          <span className={cn('flex items-center gap-0.5 font-semibold', delta.positive ? 'text-posCloud-success' : 'text-posCloud-danger')}>
            {delta.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {delta.pct}
          </span>
          <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{vsYesterdayLabel}</span>
        </div>
      )}
    </div>
  )
}

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#16a34a',
  card: '#2563eb',
  split: '#7c3aed',
  wallet: '#f59e0b',
  mada: '#0ea5e9',
  visa: '#1d4ed8',
  mastercard: '#dc2626',
  stc_pay: '#7c3aed',
  apple_pay: '#0f172a',
  unknown: '#94a3b8',
}

/* Full payment-method list per explicit request. Keys that appear in the
   real `revenue.by_payment_method` response (cash/card/split/wallet today;
   mada/visa/mastercard/stc_pay/apple_pay only if a tenant's real orders were
   created via the dine-in checkout flow, which already accepts these as real
   input values — see tables.api.ts CheckoutDineInInput) show their real
   percentage. Keys with no matching real data show a muted "soon" badge
   instead of a fabricated number — visual-only for now, tracked in
   docs/rebuild/PARKING_LOT.md for full backend wiring later. */
const PAYMENT_METHOD_DEFS: { key: string; labelAr: string; labelEn: string; icon: React.ElementType }[] = [
  { key: 'cash', labelAr: 'نقدي', labelEn: 'Cash', icon: Banknote },
  { key: 'mada', labelAr: 'مدى', labelEn: 'mada', icon: CreditCard },
  { key: 'visa', labelAr: 'فيزا', labelEn: 'Visa', icon: CreditCard },
  { key: 'mastercard', labelAr: 'ماستر كارد', labelEn: 'Mastercard', icon: CreditCard },
  { key: 'apple_pay', labelAr: 'آبل باي', labelEn: 'Apple Pay', icon: Smartphone },
  { key: 'stc_pay', labelAr: 'STC Pay', labelEn: 'STC Pay', icon: Smartphone },
  { key: 'bank_transfer', labelAr: 'تحويل بنكي', labelEn: 'Bank Transfer', icon: Landmark },
  { key: 'wallet', labelAr: 'محفظة إلكترونية', labelEn: 'E-Wallet', icon: WalletCards },
]

export function DashboardOverview() {
  const user = useAuthStore((s) => s.user)
  const currency = useTenantStore((s) => s.currency_symbol)
  const router = useRouter()
  const locale = useLocale()
  const [range, setRange] = useState<DateRange>(defaultRange)
  const t = useTranslations('dashboard')
  const { config } = useBusinessType()
  const isRTL = locale === 'ar'
  const vsYesterdayLabel = isRTL ? 'مقارنة بالأمس' : 'vs yesterday'
  const showTables = config.sidebar.includes('tables')

  useEffect(() => {
    if (!user) router.replace(`/${locale}/login`)
  }, [user, router, locale])

  const rangeQuery = { period: 'custom' as const, from: range.from, to: range.to }
  // Fixed last-7-days window for the sales chart specifically — independent
  // of the top date-range picker, matching pos-cloud's static "last 7 days"
  // framing. Reuses the same existing getRevenue endpoint, just a second
  // real call with a fixed range instead of the picker's range.
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const last7 = { from: toYMD(sevenDaysAgo), to: toYMD(new Date()) }

  const { data: revenue, error: revenueError } = useQuery({
    queryKey: ['dashboard', 'revenue', range.from, range.to],
    queryFn: () => reportsApi.getRevenue(rangeQuery),
    enabled: !!user && !!range.from && !!range.to, refetchInterval: 120000, staleTime: 60000,
  })

  const { data: revenue7d, error: revenue7dError } = useQuery({
    queryKey: ['dashboard', 'revenue-7d', last7.from, last7.to],
    queryFn: () => reportsApi.getRevenue({ period: 'custom', from: last7.from, to: last7.to }),
    enabled: !!user, refetchInterval: 120000, staleTime: 60000,
  })

  const { data: payments, error: paymentsError } = useQuery({
    queryKey: ['dashboard', 'payments', range.from, range.to],
    queryFn: () => reportsApi.getPayments(rangeQuery),
    enabled: !!user && !!range.from && !!range.to, refetchInterval: 120000, staleTime: 60000,
  })

  const { data: expenses, error: expensesError } = useQuery({
    queryKey: ['dashboard', 'expenses', range.from, range.to],
    queryFn: () => reportsApi.getExpenses(rangeQuery),
    enabled: !!user && !!range.from && !!range.to, refetchInterval: 120000, staleTime: 60000,
  })

  // Reuses the existing items.api.ts endpoint (already used by the Products
  // page) — Total Products is a real count. Low Stock / Total Stock / Due
  // Invoices have no real data anywhere in the system (no stock-quantity
  // field exists — see docs/rebuild/PARKING_LOT.md B1) and are shown as
  // "Soon" rather than pos-cloud's mock numbers.
  const { data: items } = useQuery({
    queryKey: ['dashboard', 'items-count'],
    queryFn: () => itemsApi.getAll(),
    enabled: !!user, staleTime: 120000,
  })

  // Reuses the existing orders.api.ts fetchOrders() (already used by the
  // Orders page) for a real "Recent Invoices" list — real customer_name,
  // total, status (completed/pending/cancelled mapped to paid/due badges).
  const { data: recentOrders } = useQuery({
    queryKey: ['dashboard', 'recent-orders'],
    queryFn: () => fetchOrders({}),
    enabled: !!user, staleTime: 60000,
  })

  // Reuses the existing tables.api.ts endpoint (already used by the Tables
  // page) — no new API, just consumed from this page too. Occupied count is
  // a simple aggregation of the already-fetched list, matching pos-cloud's
  // food-service-only "occupied tables" stat card exactly.
  const { data: tables } = useQuery({
    queryKey: ['dashboard', 'tables'],
    queryFn: () => tablesApi.getAll(),
    enabled: !!user && showTables, refetchInterval: 30000, staleTime: 15000,
  })

  const { data: shift, error: shiftError } = useQuery({
    queryKey: ['dashboard', 'shift'],
    queryFn: () => shiftsApi.getCurrent(),
    enabled: !!user, refetchInterval: 30000, staleTime: 15000,
  })

  const { data: customerStats, error: customerStatsError } = useQuery({
    queryKey: ['dashboard', 'customers'],
    queryFn: () => customersApi.getStats(),
    enabled: !!user, refetchInterval: 120000, staleTime: 60000,
  })

  const { data: sparklines, error: sparklinesError } = useQuery({
    queryKey: ['dashboard', 'sparklines'],
    queryFn: () => reportsApi.getSparklines(),
    enabled: !!user, staleTime: 60000,
  })

  const { data: topItems, error: topItemsError } = useQuery({
    queryKey: ['dashboard', 'top-items', range.from, range.to],
    queryFn: () => reportsApi.getTopItems(rangeQuery),
    enabled: !!user && !!range.from && !!range.to, staleTime: 60000,
  })

  const { data: recentActivity, error: recentActivityError } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => reportsApi.getRecentActivity(),
    enabled: !!user, refetchInterval: 120000, staleTime: 60000,
  })

  // HR/Audit summary queries removed from this page — see
  // docs/rebuild/PARKING_LOT.md (A1). The reportsApi.getHrSummary()/
  // getAuditSummary() endpoints themselves are untouched; they'll be
  // called from their own future sidebar page instead.

  const dashboardError = revenueError || revenue7dError || paymentsError || expensesError || shiftError
    || customerStatsError || sparklinesError || topItemsError || recentActivityError

  if (!user) return null

  const totalRevenue = revenue?.summary?.total_revenue ?? 0
  const totalOrders = revenue?.summary?.total_orders ?? 0
  const avgOrder = revenue?.summary?.avg_order_value ?? 0
  const totalExpenses = expenses?.summary?.total_approved_amount ?? 0
  const totalCustomers = customerStats?.total ?? 0
  // Simple arithmetic on already-loaded totals — no new call, no invented data.
  const netProfit = totalRevenue - totalExpenses

  const dateLocale = locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US'

  const barData = (revenue7d?.daily_breakdown ?? []).map((d) => ({
    label: new Date(d.date).toLocaleDateString(dateLocale, { weekday: 'short' }),
    value: d.total,
  }))

  const realPaymentData = revenue?.by_payment_method ?? {}
  const donutTotal = Object.values(realPaymentData).reduce((s, v) => s + v.total, 0)
  // Every method in the requested list, with real data where it exists in
  // realPaymentData (by key match) and null (shown as a "soon" badge, never
  // a fabricated number) where it doesn't yet.
  const paymentRows = PAYMENT_METHOD_DEFS.map((def) => {
    const real = realPaymentData[def.key]
    return {
      ...def,
      label: isRTL ? def.labelAr : def.labelEn,
      color: PAYMENT_COLORS[def.key] ?? '#94a3b8',
      value: real?.total ?? null,
      pct: real && donutTotal > 0 ? Math.round((real.total / donutTotal) * 100) : null,
    }
  })
  const donutData = paymentRows.filter((r) => r.value !== null && r.value > 0)

  const sp = sparklines ?? { sales: [0,0,0,0,0,0,0], orders: [0,0,0,0,0,0,0], customers: [0,0,0,0,0,0,0], expenses: [0,0,0,0,0,0,0] }

  const rangeLabel = range.from && range.to
    ? `${new Date(range.from).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })} – ${new Date(range.to).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}`
    : ''

  const rankColor = ['bg-amber-400', 'bg-slate-300', 'bg-amber-700', 'bg-slate-200 text-posCloud-text-tertiary', 'bg-slate-200 text-posCloud-text-tertiary']

  const occupiedTables = (tables ?? []).filter((tb) => tb.status === 'occupied').length
  const totalTables = (tables ?? []).length

  const invoiceRows = [...(recentOrders ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="mx-auto max-w-[1400px]">

      {dashboardError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-posCloud-danger/30 bg-posCloud-danger-light dark:bg-posCloud-danger/15 px-3.5 py-2.5 text-[13px] text-posCloud-danger">
          <AlertCircle size={16} />
          <span>{isRTL
            ? 'تعذّر تحميل بعض بيانات الداشبورد. تحقّق من الاتصال أو حاول تسجيل الدخول مجدداً.'
            : 'Some dashboard data failed to load. Check your connection or try logging in again.'}</span>
        </div>
      )}

      {/* ── Page header — matches pos-cloud's title/subtitle + date-range pattern ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
            {t('greeting', { name: user?.name ?? '...' })}
          </h1>
          <p className="mt-1 text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary flex items-center gap-2">
            {shift && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-posCloud-success-light dark:bg-posCloud-success/15 px-2.5 py-0.5 text-[11px] font-semibold text-posCloud-success">
                <span className="h-1.5 w-1.5 rounded-full bg-posCloud-success" />
                {t('live')}
              </span>
            )}
            {rangeLabel}
          </p>
        </div>
        <DateRangePicker value={range} onChange={(r) => r.from && r.to && setRange(r)} />
      </div>

      {/* ── Stat cards — matches pos-cloud's 6-card grid exactly ── */}
      <div className="grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={TrendingUp} iconBg="bg-posCloud-success-light dark:bg-posCloud-success/15" iconColor="text-posCloud-success"
          label={t('statSales')} value={totalRevenue.toLocaleString('en-US')} unit={currency}
          delta={computeDelta(sp.sales)} vsYesterdayLabel={vsYesterdayLabel} />
        <StatCard icon={Wallet} iconBg="bg-posCloud-success-light dark:bg-posCloud-success/15" iconColor="text-posCloud-success"
          label={t('netProfit')} value={netProfit.toLocaleString('en-US')} unit={currency}
          delta={computeDelta(sp.sales)} vsYesterdayLabel={vsYesterdayLabel} />
        <StatCard icon={Tag} iconBg="bg-posCloud-warning-light dark:bg-posCloud-warning/15" iconColor="text-posCloud-warning"
          label={t('avgOrder')} value={avgOrder.toLocaleString('en-US', { maximumFractionDigits: 1 })} unit={currency}
          delta={null} vsYesterdayLabel={vsYesterdayLabel} />
        <StatCard icon={ShoppingCart} iconBg="bg-posCloud-info-light dark:bg-posCloud-info/15" iconColor="text-posCloud-info"
          label={t('statOrders')} value={totalOrders.toLocaleString('en-US')}
          delta={computeDelta(sp.orders)} vsYesterdayLabel={vsYesterdayLabel} />
        <StatCard icon={Users} iconBg="bg-posCloud-primary-light dark:bg-posCloud-primary/15" iconColor="text-posCloud-primary"
          label={t('statNewCustomers')} value={totalCustomers.toLocaleString('en-US')}
          delta={computeDelta(sp.customers)} vsYesterdayLabel={vsYesterdayLabel} />
        <StatCard icon={Wallet} iconBg="bg-posCloud-danger-light dark:bg-posCloud-danger/15" iconColor="text-posCloud-danger"
          label={t('statExpensesTitle')} value={totalExpenses.toLocaleString('en-US')} unit={currency}
          delta={computeDelta(sp.expenses)} vsYesterdayLabel={vsYesterdayLabel} />
      </div>

      {/* HR/Audit KPI rows moved out — see docs/rebuild/PARKING_LOT.md (A1).
          Dashboard home is overview-only now, matching pos-cloud's card
          count exactly; those real stats move to their own sidebar page. */}

      {/* ── Occupied Tables — matches pos-cloud's food-service-only stat
          card exactly (same conditional-visibility rule as the sidebar's
          "Tables"/"Kitchen Display" entries). Real data: reuses tables.api.ts
          (already used by the Tables page), occupied count is a simple
          aggregation of the already-fetched list. ── */}
      {showTables && (
        <div className="mt-4 grid grid-cols-2 items-stretch gap-4 sm:grid-cols-4">
          <StatCard icon={UtensilsCrossed} iconBg="bg-posCloud-warning-light dark:bg-posCloud-warning/15" iconColor="text-posCloud-warning"
            label={t('occupiedTables')} value={`${occupiedTables} / ${totalTables}`}
            delta={null} vsYesterdayLabel={vsYesterdayLabel} />
        </div>
      )}

      {/* ── Charts row — matches pos-cloud's SalesLineChart (2-col) +
          PaymentDonutChart + a third card layout exactly. Third slot uses
          Sefay's real Quick Actions (existing capability, no pos-cloud
          equivalent for inventory OverviewCard since Sefay has no
          bulk-stock aggregate loaded here — kept honest, not invented). ── */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-4">

        <SectionCard className="lg:col-span-2">
          <SectionHeader
            title={t('salesOver7Days')}
            action={<span className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border px-3 py-1.5 text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{isRTL ? 'آخر 7 أيام' : 'Last 7 days'}</span>}
          />
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={barData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} reversed={isRTL} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} orientation={isRTL ? 'right' : 'left'} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: 12 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`${(Number(v) || 0).toLocaleString('en-US')} ${currency}`, t('statSales')]}
                />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fill="url(#salesFill)"
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title={isRTL ? 'المبيعات حسب طرق الدفع' : 'Sales by Payment Method'} />
          <div className="relative h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData.length ? donutData : [{ key: 'none', value: 1, color: '#f1f5f9' }]}
                  dataKey="value" nameKey="key" innerRadius={62} outerRadius={90} paddingAngle={2} stroke="none">
                  {(donutData.length ? donutData : [{ key: 'none', color: '#f1f5f9' }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{donutTotal.toLocaleString('en-US')}</span>
              <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mt-1">{isRTL ? 'إجمالي المبيعات' : 'Total Sales'} {currency}</span>
            </div>
          </div>
          {/* Full 8-method list, 2 columns, per explicit user request —
              extends pos-cloud's simpler 4-category legend with Sefay's
              actual accepted payment methods. Real % where data exists in
              revenue.by_payment_method; muted "Soon" badge where it
              doesn't yet — never a fabricated number. Tabby/Tamara will be
              added to this same list later (see docs/rebuild/PARKING_LOT.md
              B6) once real backend support exists. */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {paymentRows.map((row) => (
              <div key={row.key} className="flex items-center gap-2 rounded-lg border border-posCloud-border dark:border-posCloudDark-border p-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${row.color}1a` }}>
                  <row.icon className="h-3.5 w-3.5" style={{ color: row.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{row.label}</p>
                  {row.pct !== null ? (
                    <p className="text-xs font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{row.pct}%</p>
                  ) : (
                    <p className="text-[10px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{isRTL ? 'قريبًا' : 'Soon'}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Overview — matches pos-cloud's OverviewCard exactly (icon
            square + label + value rows). Total Products is real (reused
            items.api.ts count); the other 3 rows have no real data
            anywhere in the system — see docs/rebuild/PARKING_LOT.md (B1) —
            shown as "Soon" rather than pos-cloud's mock numbers (1,245 /
            23 / 8,752 / 5). ── */}
        <SectionCard>
          <SectionHeader title={isRTL ? 'نظرة عامة' : 'Overview'} />
          <div className="space-y-4">
            {[
              { icon: Boxes, color: 'text-posCloud-primary bg-posCloud-primary-light dark:bg-posCloud-primary/15', label: isRTL ? 'إجمالي المنتجات' : 'Total Products', value: (items ?? []).length.toLocaleString('en-US') },
              { icon: PackageOpen, color: 'text-posCloud-warning bg-posCloud-warning-light dark:bg-posCloud-warning/15', label: isRTL ? 'المنتجات منخفضة المخزون' : 'Low Stock', value: null },
              { icon: Layers3, color: 'text-posCloud-info bg-posCloud-info-light dark:bg-posCloud-info/15', label: isRTL ? 'إجمالي المخزون' : 'Total Stock', value: null },
              { icon: Receipt, color: 'text-posCloud-danger bg-posCloud-danger-light dark:bg-posCloud-danger/15', label: isRTL ? 'الفواتير المستحقة' : 'Due Invoices', value: null },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', row.color)}>
                    <row.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[13px] text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{row.label}</span>
                </div>
                {row.value !== null ? (
                  <span className="text-sm font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{row.value}</span>
                ) : (
                  <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{isRTL ? 'قريبًا' : 'Soon'}</span>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Second row — matches pos-cloud's exact Recent Invoices +
          Sales by Branch + Best Selling layout. Recent Invoices reuses
          orders.api.ts's fetchOrders() (already used by the Orders page) —
          real customer_name/total/status. Sales by Branch has no real data
          anywhere (no branch backend exists — PARKING_LOT.md B2) and shows
          "Soon" instead of fabricated branch names/figures. Best Selling
          uses the same real topItems data as before. ── */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">

        <SectionCard>
          <SectionHeader
            title={isRTL ? 'آخر الفواتير' : 'Recent Invoices'}
            action={<Link href={`/${locale}/dashboard/orders`} className="text-xs font-semibold text-posCloud-primary">{isRTL ? 'عرض الكل' : 'View all'}</Link>}
          />
          <div className="overflow-x-auto">
            {invoiceRows.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('noDataLabel')}</p>
            ) : (
              <table className="w-full text-start text-[13px]">
                <thead>
                  <tr className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                    <th className="pb-3 font-medium">{isRTL ? 'رقم الفاتورة' : 'Invoice'}</th>
                    <th className="pb-3 font-medium">{isRTL ? 'العميل' : 'Customer'}</th>
                    <th className="pb-3 font-medium">{isRTL ? 'المبلغ' : 'Amount'}</th>
                    <th className="pb-3 font-medium">{isRTL ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceRows.map((o) => (
                    <tr key={o.id} className="border-t border-posCloud-border dark:border-posCloudDark-border">
                      <td className="py-3 font-semibold text-posCloud-primary">#{o.id.slice(-6).toUpperCase()}</td>
                      <td className="py-3 text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{o.customer_name || '—'}</td>
                      <td className="py-3 font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{o.total.toLocaleString('en-US')} {currency}</td>
                      <td className="py-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          o.status === 'completed' ? 'bg-posCloud-success-light dark:bg-posCloud-success/15 text-posCloud-success'
                            : o.status === 'pending' ? 'bg-posCloud-warning-light dark:bg-posCloud-warning/15 text-posCloud-warning'
                            : 'bg-posCloud-danger-light dark:bg-posCloud-danger/15 text-posCloud-danger'
                        )}>
                          {o.status === 'completed' ? (isRTL ? 'مدفوعة' : 'Paid') : o.status === 'pending' ? (isRTL ? 'مستحقة' : 'Due') : (isRTL ? 'ملغاة' : 'Cancelled')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader
            title={isRTL ? 'المبيعات حسب الفروع' : 'Sales by Branch'}
            action={<span className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border px-3 py-1.5 text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{isRTL ? 'هذا الشهر' : 'This month'}</span>}
          />
          <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
            <BarChart3 className="h-8 w-8 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" />
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{isRTL ? 'قريبًا — يحتاج نظام فروع حقيقي' : 'Soon — needs a real branch system'}</p>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader
            title={t('topSelling')}
            action={<span className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border px-3 py-1.5 text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{rangeLabel}</span>}
          />
          <div className="space-y-3">
            {(topItems?.items ?? []).length === 0 && (
              <p className="py-4 text-center text-[13px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('noDataLabel')}</p>
            )}
            {(topItems?.items ?? []).slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-posCloud-text-secondary dark:bg-white/5 dark:text-posCloudDark-text-secondary">
                  <Star className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{item.name}</p>
                  <div className="h-1.5 rounded-full bg-posCloud-background dark:bg-posCloudDark-background mt-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-posCloud-primary" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
                <span className="text-[13px] font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary shrink-0">
                  {item.total.toLocaleString('en-US')} {currency}
                </span>
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white', rankColor[i] ?? rankColor[4])}>
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Third row — Branches Overview (pos-cloud reference) + Sefay-only
          extras (Recent Activity, Quick Actions). Branches Overview has no
          real data anywhere (no branch backend, no branches-list endpoint —
          confirmed via direct search, PARKING_LOT.md B2) and shows a "Soon"
          placeholder instead of fabricated branch names/status/sales. ── */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">

        <SectionCard>
          <SectionHeader
            title={isRTL ? 'ملخص الفروع' : 'Branches Overview'}
            action={<span className="text-xs font-semibold text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{isRTL ? 'عرض الكل' : 'View all'}</span>}
          />
          <div className="flex h-[180px] flex-col items-center justify-center gap-2 text-center">
            <Landmark className="h-8 w-8 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" />
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{isRTL ? 'قريبًا — يحتاج نظام فروع حقيقي' : 'Soon — needs a real branch system'}</p>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title={t('recentActivity')} />
          <div>
            {(recentActivity?.activity ?? []).length === 0 && (
              <p className="py-4 text-center text-[13px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('noActivity')}</p>
            )}
            {(recentActivity?.activity ?? []).slice(0, 5).map((item, i, arr) => (
              <div key={i} className={cn('flex items-start gap-3 py-3', i < arr.length - 1 && 'border-b border-posCloud-border dark:border-posCloudDark-border')}>
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  item.type === 'order' ? 'bg-posCloud-success-light dark:bg-posCloud-success/15 text-posCloud-success'
                    : item.type === 'refund' ? 'bg-posCloud-warning-light dark:bg-posCloud-warning/15 text-posCloud-warning'
                    : 'bg-posCloud-danger-light dark:bg-posCloud-danger/15 text-posCloud-danger'
                )}>
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">{item.title}</p>
                  <p className="mt-0.5 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{item.sub}</p>
                </div>
                <div className="text-end shrink-0">
                  <p className={cn('text-sm font-bold', item.amount !== null && item.amount < 0 ? 'text-posCloud-danger' : 'text-posCloud-text-primary dark:text-posCloudDark-text-primary')}>
                    {item.amount !== null ? `${item.amount.toLocaleString('en-US')} ${currency}` : t('alertLabel')}
                  </p>
                  <p className="mt-0.5 text-[10px] text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                    {new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title={t('quickActions')} />
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: t('newCustomer'), href: '/dashboard/customers', color: 'bg-posCloud-success' },
              { label: t('newInvoice'), href: '/dashboard/pos', color: 'bg-posCloud-primary' },
              { label: t('todayReport'), href: '/dashboard/reports', color: 'bg-posCloud-info' },
              { label: t('newExpense'), href: '/dashboard/expenses', color: 'bg-posCloud-warning' },
            ].map((a, i) => (
              <Link key={i} href={`/${locale}${a.href}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-posCloud-border dark:border-posCloudDark-border p-3 text-center transition-colors hover:bg-slate-100 dark:hover:bg-white/5">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', a.color)}>
                  <Zap size={16} className="text-white" />
                </div>
                <span className="text-[11px] font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{a.label}</span>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
