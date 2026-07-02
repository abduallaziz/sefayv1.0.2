import { apiClient } from '@/lib/api'

export type ReportPeriod = 'today' | 'week' | 'month' | 'custom'

export interface ReportQuery {
  period?: ReportPeriod
  from?: string
  to?: string
  branch_id?: string
}

export interface RevenueReport {
  period: { from: string; to: string }
  summary: {
    total_revenue: number
    total_orders: number
    total_discount: number
    total_tax: number
    avg_order_value: number
  }
  by_payment_method: Record<string, { count: number; total: number }>
  daily_breakdown: { date: string; total: number }[]
}

export interface ShiftsReport {
  period: { from: string; to: string }
  summary: {
    total_shifts: number
    closed_shifts: number
    open_shifts: number
    total_discrepancy: number
    avg_discrepancy: number
  }
  shifts: { id: string; opened_at: string; closed_at: string }[]
}

export interface ExpensesReport {
  period: { from: string; to: string }
  summary: {
    total_requests: number
    approved_count: number
    rejected_count: number
    pending_count: number
    total_approved_amount: number
  }
  expenses: { id: string; amount: number; status: string }[]
}

export interface PaymentsReport {
  period: { from: string; to: string }
  summary: {
    total_orders: number
    grand_total: number
    cash: { count: number; total: number }
    card: { count: number; total: number }
    split: { count: number; total: number }
  }
}

export interface TopItemsReport {
  items: { name: string; quantity: number; total: number; pct: number }[]
}

export interface RecentActivityReport {
  activity: {
    type: 'order' | 'refund' | 'alert'
    title: string
    sub: string
    amount: number | null
    time: string
  }[]
}

export interface SparklinesReport {
  sales: number[]
  orders: number[]
  customers: number[]
  expenses: number[]
}

export const reportsApi = {
  getRevenue: (query?: ReportQuery): Promise<RevenueReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const qs = params.toString()
    return apiClient.get(`/reports/revenue${qs ? `?${qs}` : ''}`)
  },

  getShifts: (query?: ReportQuery): Promise<ShiftsReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const qs = params.toString()
    return apiClient.get(`/reports/shifts${qs ? `?${qs}` : ''}`)
  },

  getExpenses: (query?: ReportQuery): Promise<ExpensesReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const qs = params.toString()
    return apiClient.get(`/reports/expenses${qs ? `?${qs}` : ''}`)
  },

  getPayments: (query?: ReportQuery): Promise<PaymentsReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const qs = params.toString()
    return apiClient.get(`/reports/payments${qs ? `?${qs}` : ''}`)
  },

  getTopItems: (query?: ReportQuery): Promise<TopItemsReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const qs = params.toString()
    return apiClient.get(`/reports/top-items${qs ? `?${qs}` : ''}`)
  },

  getRecentActivity: (): Promise<RecentActivityReport> =>
    apiClient.get('/reports/recent-activity'),

  getSparklines: (): Promise<SparklinesReport> =>
    apiClient.get('/reports/sparklines'),
}