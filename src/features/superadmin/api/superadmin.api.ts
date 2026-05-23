import type { OverviewStats, Tenant, RevenueData, AuditLog } from '../types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function fetcher<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  return res.json()
}

export const superadminApi = {
  getStats: () => fetcher<OverviewStats>('/superadmin/stats'),
  getTenants: () => fetcher<Tenant[]>('/superadmin/tenants'),
  getTenant: (id: string) => fetcher<Tenant>(`/superadmin/tenants/${id}`),
  getRevenue: () => fetcher<RevenueData[]>('/superadmin/reports/revenue'),
  getAuditLogs: () => fetcher<AuditLog[]>('/superadmin/audit'),

  activateTenant: (id: string) =>
    fetch(`${BASE_URL}/superadmin/tenants/${id}/activate`, { method: 'PATCH' }),
  deactivateTenant: (id: string) =>
    fetch(`${BASE_URL}/superadmin/tenants/${id}/deactivate`, { method: 'PATCH' }),
  extendTrial: (id: string, days: number) =>
    fetch(`${BASE_URL}/superadmin/tenants/${id}/extend-trial`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    }),
}