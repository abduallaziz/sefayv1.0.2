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
    wallet: { count: number; total: number }
    split: { count: number; total: number }
    tab: { count: number; total: number }
  }
  by_method: Record<string, { count: number; total: number }>
}

export interface PeriodMetrics {
  from: string
  to: string
  revenue: number
  order_count: number
  avg_order_value: number
  unique_customers: number
}

export interface ComparisonReport {
  current_period: PeriodMetrics
  previous_period: PeriodMetrics
  change: {
    revenue_pct: number | null
    order_count_pct: number | null
    avg_order_value_pct: number | null
  }
}

export interface BranchComparisonReport {
  period: { from: string; to: string }
  branches: {
    branch_id: string
    branch_name: string
    revenue: number
    order_count: number
    avg_order_value: number
    unique_customers: number
  }[]
}

export interface CustomerChurnReport {
  current_period: { from: string; to: string }
  previous_period: { from: string; to: string }
  previous_period_customers: number
  current_period_customers: number
  churned_customers: number
  churn_rate_pct: number
}

export interface EmployeesReport {
  period: { from: string; to: string }
  employees: {
    cashier_id: string
    name: string
    order_count: number
    total_sales: number
    avg_order_value: number
  }[]
}

export interface CustomersReport {
  period: { from: string; to: string }
  summary: { unique_customers: number }
  customers: {
    customer_id: string
    name: string
    order_count: number
    total_spent: number
    avg_order_value: number
  }[]
}

export interface TaxReport {
  period: { from: string; to: string }
  tax_rate: number
  summary: {
    total_orders: number
    total_subtotal: number
    total_tax_collected: number
    grand_total: number
  }
  daily_breakdown: { date: string; subtotal: number; tax: number; total: number; order_count: number }[]
}

export interface InventoryReport {
  summary: {
    total_sku_count: number
    total_inventory_value: number
    low_stock_count: number
    out_of_stock_count: number
  }
  top_by_value: {
    item_name: string
    warehouse_name: string
    quantity_on_hand: number
    inventory_value: number
    status: string
  }[]
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

  getEmployees: (query?: ReportQuery): Promise<EmployeesReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const qs = params.toString()
    return apiClient.get(`/reports/employees${qs ? `?${qs}` : ''}`)
  },

  getCustomersReport: (query?: ReportQuery): Promise<CustomersReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const qs = params.toString()
    return apiClient.get(`/reports/customers${qs ? `?${qs}` : ''}`)
  },

  getTax: (query?: ReportQuery): Promise<TaxReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const qs = params.toString()
    return apiClient.get(`/reports/tax${qs ? `?${qs}` : ''}`)
  },

  getInventory: (warehouseId?: string): Promise<InventoryReport> =>
    apiClient.get(`/reports/inventory${warehouseId ? `?warehouse_id=${warehouseId}` : ''}`),

  getComparison: (query?: ReportQuery): Promise<ComparisonReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const qs = params.toString()
    return apiClient.get(`/reports/comparison${qs ? `?${qs}` : ''}`)
  },

  getByBranch: (query?: ReportQuery): Promise<BranchComparisonReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const qs = params.toString()
    return apiClient.get(`/reports/by-branch${qs ? `?${qs}` : ''}`)
  },

  getCustomerChurn: (query?: ReportQuery): Promise<CustomerChurnReport> => {
    const params = new URLSearchParams()
    if (query?.period) params.set('period', query.period)
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const qs = params.toString()
    return apiClient.get(`/reports/customer-churn${qs ? `?${qs}` : ''}`)
  },
}