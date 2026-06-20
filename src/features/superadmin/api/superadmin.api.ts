import { apiClient } from '@/lib/api'
import type {
  GlobalStats,
  AnalyticsSummary,
  MRRHistoryPoint,
  ChurnData,
  GrowthData,
  RevenueByPlanItem,
  AuditLog,
  AuditLogsResponse,
} from '../types'

export type AnalyticsPeriod =
  | '30d'
  | '90d'
  | '6m'
  | '12m'
  | 'ytd'

export interface AuditLogsParams {
  page?: number
  limit?: number
  action?: string
  resource?: string
  tenant_id?: string
  from?: string
  to?: string
}

export const superadminApi = {
  // ─── Stats ────────────────────────────────────────────────────────────────
  getStats: (): Promise<GlobalStats> =>
    apiClient.get('/superadmin/stats'),

  // ─── Analytics ────────────────────────────────────────────────────────────
  getAnalyticsSummary: (period?: AnalyticsPeriod): Promise<AnalyticsSummary> => {
    const params = period ? `?period=${period}` : ''
    return apiClient.get(`/superadmin/analytics/summary${params}`)
  },

  getMRR: (): Promise<number> =>
    apiClient.get('/superadmin/analytics/mrr'),

  getARR: (): Promise<number> =>
    apiClient.get('/superadmin/analytics/arr'),

  getMRRHistory: (period?: AnalyticsPeriod): Promise<MRRHistoryPoint[]> => {
    const params = period ? `?period=${period}` : ''
    return apiClient.get(`/superadmin/analytics/mrr/history${params}`)
  },

  getChurnRate: (period?: AnalyticsPeriod): Promise<ChurnData> => {
    const params = period ? `?period=${period}` : ''
    return apiClient.get(`/superadmin/analytics/churn${params}`)
  },

  getGrowthRate: (period?: AnalyticsPeriod): Promise<GrowthData> => {
    const params = period ? `?period=${period}` : ''
    return apiClient.get(`/superadmin/analytics/growth${params}`)
  },

  getRevenueByPlan: (): Promise<RevenueByPlanItem[]> =>
    apiClient.get('/superadmin/analytics/revenue-by-plan'),

  // ─── Audit Logs ───────────────────────────────────────────────────────────
  getAuditLogs: (params: AuditLogsParams = {}): Promise<AuditLogsResponse> => {
    const query = new URLSearchParams()
    if (params.page)      query.set('page',      String(params.page))
    if (params.limit)     query.set('limit',     String(params.limit))
    if (params.action)    query.set('action',    params.action)
    if (params.resource)  query.set('resource',  params.resource)
    if (params.tenant_id) query.set('tenant_id', params.tenant_id)
    if (params.from)      query.set('from',      params.from)
    if (params.to)        query.set('to',        params.to)
    const qs = query.toString()
    return apiClient.get(`/superadmin/audit-logs${qs ? `?${qs}` : ''}`)
  },

  getAuditLogById: (id: string): Promise<AuditLog> =>
    apiClient.get(`/superadmin/audit-logs/${id}`),
}