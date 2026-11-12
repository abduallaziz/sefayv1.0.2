import { apiClient } from '@/lib/api'

export type ZatcaEnv = 'sandbox' | 'simulation' | 'production'

export interface ZatcaDevice {
  id: string
  branch_id: string
  env: ZatcaEnv
  seller: { legal_name: string; vat_number: string; egs_name?: string }
  csid_kind: 'compliance' | 'production' | null
  icv_last: number
  status: string
  has_key: boolean
  has_csr: boolean
  has_certificate: boolean
}

export interface ZatcaInvoiceRow {
  id: string
  kind: string
  invoice_no: string
  icv: number
  status: string
  attempts: number
  last_error: string | null
  issue_at: string
}

export interface CreateZatcaDevice {
  branch_id: string
  env: ZatcaEnv
  egs_name: string
  business_category: string
  seller: {
    legal_name: string
    vat_number: string
    crn: string
    id_scheme?: string
    street: string
    building_no: string
    district: string
    city: string
    postal_zone: string
  }
}

export const zatcaApi = {
  devices: () => apiClient.get<ZatcaDevice[]>('/zatca/devices'),
  createDevice: (dto: CreateZatcaDevice) => apiClient.post<ZatcaDevice>('/zatca/devices', dto),
  csr: (id: string) => apiClient.post<{ csr_pem: string }>(`/zatca/devices/${id}/csr`, {}),
  onboard: (id: string, otp: string) => apiClient.post<ZatcaDevice>(`/zatca/devices/${id}/onboard`, { otp }),
  checks: (id: string) =>
    apiClient.post<{ passed: boolean; results: { kind: string; ok: boolean; status: number }[] }>(
      `/zatca/devices/${id}/compliance-checks`,
      {},
    ),
  activate: (id: string) => apiClient.post<ZatcaDevice>(`/zatca/devices/${id}/activate`, {}),
  invoices: () => apiClient.get<ZatcaInvoiceRow[]>('/zatca/invoices'),
  flush: () => apiClient.post<{ gateway: string; sent: number; waiting: number }>('/zatca/flush', {}),
}
