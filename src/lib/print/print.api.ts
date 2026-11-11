import { apiClient } from '@/lib/api'
import type {
  InvoicePrintPayload,
  InvoiceTemplate,
  KitchenPrintPayload,
  KitchenTemplate,
  TemplateKind,
} from './types'

export interface TemplateResponse<T> {
  kind: TemplateKind
  scope: 'tenant' | 'branch'
  branch_id: string | null
  has_override: boolean
  template: T
  branches: { id: string; name: string; has_override: boolean }[]
  /** Signed URL of the uploaded logo (private bucket), when there is one. */
  logo_url: string | null
  fallbacks: {
    business_name: string | null
    address: string | null
    phone: string | null
    tax_number: string | null
    logo_url: string | null
    footer: string | null
  }
}

const q = (params: Record<string, string | undefined>) => {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
    .join('&')
  return s ? `?${s}` : ''
}

export const printApi = {
  invoicePayload: (orderId: string, tendered?: number): Promise<InvoicePrintPayload> =>
    apiClient.get(`/print/invoice/${orderId}${q({ tendered: tendered !== undefined ? String(tendered) : undefined })}`),

  kitchenPayload: (orderId: string, all = false): Promise<KitchenPrintPayload> =>
    apiClient.get(`/print/kitchen/${orderId}${q({ all: all ? 'true' : undefined })}`),

  getTemplate: <K extends TemplateKind>(
    kind: K,
    branchId?: string,
  ): Promise<TemplateResponse<K extends 'invoice' ? InvoiceTemplate : KitchenTemplate>> =>
    apiClient.get(`/print/templates/${kind}${q({ branch_id: branchId })}`),

  saveTemplate: <K extends TemplateKind>(
    kind: K,
    template: K extends 'invoice' ? InvoiceTemplate : KitchenTemplate,
    branchId?: string,
  ): Promise<TemplateResponse<K extends 'invoice' ? InvoiceTemplate : KitchenTemplate>> =>
    apiClient.patch(`/print/templates/${kind}`, { template, ...(branchId ? { branch_id: branchId } : {}) }),

  clearBranchOverride: (kind: TemplateKind, branchId: string) =>
    apiClient.delete(`/print/templates/${kind}/branch/${branchId}`),

  /** Multipart upload; apiClient only speaks JSON so this uses fetch directly with the same auth. */
  async uploadLogo(file: File): Promise<{ logo_path: string; logo_url: string }> {
    const { useAuthStore } = await import('@/core/auth/stores/auth.store')
    const { accessToken } = useAuthStore.getState()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/v1/print/logo', {
      method: 'POST',
      credentials: 'include',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message ?? 'Upload failed')
    }
    return res.json()
  },
}
