import { apiClient } from '@/lib/api'

export type ReportPeriod = 'today' | 'week' | 'month' | 'custom'

export interface ReportQuery {
  period?: ReportPeriod
  from?: string
  to?: string
  branch_id?: string
}

export interface RevenueReport {
  total_revenue: number
  total_orders: number
  average_order: number
  by_day: { date: string; revenue: number; orders: number }[]
}

export interface ShiftsReport {
  total_shifts: number
  total_hours: number
  by_shift: { id: string; opened_at: string; closed_at: string; total_sales: number }[]
}

export interface ExpensesReport {
  total_expenses: number
  by_category: { category: string; total: number; count: number }[]
}

export interface PaymentsReport {
  total: number
  by_method: { method: string; total: number; count: number }[]
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
    const qs = params.toString()
    return apiClient.get(`/reports/shifts${qs ? `?${qs}` : ''}`)
  },

  getExpenses: (query?: ReportQuery): Promise<ExpensesReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    const qs = params.toString()
    return apiClient.get(`/reports/expenses${qs ? `?${qs}` : ''}`)
  },

  getPayments: (query?: ReportQuery): Promise<PaymentsReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    const qs = params.toString()
    return apiClient.get(`/reports/payments${qs ? `?${qs}` : ''}`)
  },
}