import { apiClient, refreshSession } from '@/lib/api'
import type {
  ApprovalRecord,
  GeneratedDocument,
  IssueInput,
  BindingDef,
  AssetCategory,
  DocumentAsset,
  DocumentType,
  Orientation,
  Paper,
  TemplateBody,
  TemplateDetail,
  TemplateStatus,
  TemplateSummary,
} from '../types'

const API_BASE = '/api/v1'

// apiClient only speaks JSON; PDFs (binary) and uploads (multipart) need a raw fetch that still
// carries the session token and refreshes it once on 401, exactly like apiClient does.
async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  const { useAuthStore } = await import('@/core/auth/stores/auth.store')
  const doFetch = (token: string | null) =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: { ...(init.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
  let res = await doFetch(useAuthStore.getState().accessToken)
  if (res.status === 401) {
    const refreshed = await refreshSession()
    if (refreshed) {
      useAuthStore.getState().setAccessToken(refreshed.access_token, refreshed.realtime_token)
      res = await doFetch(refreshed.access_token)
    }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? 'Request failed')
  }
  return res
}

export interface CreateTemplateInput {
  doc_type: DocumentType
  name: string
  description?: string
  paper?: Paper
  orientation?: Orientation
  body?: TemplateBody
}

export interface UpdateTemplateInput {
  name?: string
  description?: string
  paper?: Paper
  orientation?: Orientation
  body?: TemplateBody
  note?: string
}

export const documentsApi = {
  enabled: () => apiClient.get<{ enabled: boolean }>('/documents/enabled'),
  bindings: () =>
    apiClient.get<{
      bindings: BindingDef[]
      itemColumns: { key: string; label: { en: string; ar: string } }[]
      qrMinSizeMm: Record<string, number>
    }>(
      '/documents/templates/bindings',
    ),

  // templates
  list: (f: { docType?: string; status?: string } = {}) => {
    const q = new URLSearchParams()
    if (f.docType) q.set('docType', f.docType)
    if (f.status) q.set('status', f.status)
    const s = q.toString()
    return apiClient.get<TemplateSummary[]>(`/documents/templates${s ? `?${s}` : ''}`)
  },
  get: (id: string) => apiClient.get<TemplateDetail>(`/documents/templates/${id}`),
  create: (dto: CreateTemplateInput) => apiClient.post<TemplateSummary>('/documents/templates', dto),
  update: (id: string, dto: UpdateTemplateInput) =>
    apiClient.patch<{ id: string; draft_version: number | null }>(`/documents/templates/${id}`, dto),
  remove: (id: string) => apiClient.delete<{ message: string }>(`/documents/templates/${id}`),
  duplicate: (id: string) => apiClient.post<TemplateSummary>(`/documents/templates/${id}/duplicate`, {}),
  publish: (id: string) =>
    apiClient.post<{ id: string; status: TemplateStatus }>(`/documents/templates/${id}/publish`, {}),
  archive: (id: string) =>
    apiClient.post<{ id: string; status: TemplateStatus }>(`/documents/templates/${id}/archive`, {}),
  setDefault: (id: string) =>
    apiClient.post<{ id: string; is_default: boolean }>(`/documents/templates/${id}/default`, {}),
  versions: (id: string) =>
    apiClient.get<{ id: string; version: number; note: string | null; created_at: string; is_published: boolean }[]>(
      `/documents/templates/${id}/versions`,
    ),
  restore: (id: string, version: number) =>
    apiClient.post<{ id: string; draft_version: number }>(`/documents/templates/${id}/versions/${version}/restore`, {}),

  // preview of the UNSAVED draft (sample data); returns the same HTML the PDF is made from
  previewHtml: (
    id: string,
    dto: { body: TemplateBody; paper: Paper; orientation: Orientation; lang: 'ar' | 'en'; overlays?: boolean },
  ) => apiClient.post<{ html: string; assetUrls: Record<string, string>; warnings: string[] }>(`/documents/templates/${id}/preview`, dto),
  pdf: async (id: string, lang: 'ar' | 'en'): Promise<Blob> => {
    const res = await rawFetch(`/documents/templates/${id}/pdf?lang=${lang}`, { method: 'GET' })
    return res.blob()
  },

  // issuing
  issue: (dto: IssueInput) =>
    apiClient.post<{ id: string; doc_type: DocumentType; document_number: string; verification_url: string }>(
      '/documents/generated/issue',
      dto,
    ),
  generated: (f: { docType?: string } = {}) =>
    apiClient.get<GeneratedDocument[]>(`/documents/generated${f.docType ? `?docType=${f.docType}` : ''}`),
  generatedPdf: async (id: string): Promise<Blob> => (await rawFetch(`/documents/generated/${id}/pdf`, { method: 'GET' })).blob(),
  voidDocument: (id: string, reason: string) =>
    apiClient.post<{ id: string; status: 'void' }>(`/documents/generated/${id}/void`, { reason }),

  // approvals
  approvals: (templateId: string) => apiClient.get<ApprovalRecord[]>(`/documents/approvals?templateId=${templateId}`),
  approve: (dto: { template_id: string; decision: 'approved' | 'rejected'; reason?: string }) =>
    apiClient.post<ApprovalRecord>('/documents/approvals', dto),

  // assets
  assets: (f: { category?: string; status?: string } = {}) => {
    const q = new URLSearchParams()
    if (f.category) q.set('category', f.category)
    if (f.status) q.set('status', f.status)
    const s = q.toString()
    return apiClient.get<DocumentAsset[]>(`/documents/assets${s ? `?${s}` : ''}`)
  },
  uploadAsset: async (input: { file: File; name: string; category: AssetCategory; branchId?: string }) => {
    const fd = new FormData()
    fd.append('file', input.file)
    fd.append('name', input.name)
    fd.append('category', input.category)
    if (input.branchId) fd.append('branch_id', input.branchId)
    const res = await rawFetch('/documents/assets', { method: 'POST', body: fd })
    return (await res.json()) as DocumentAsset
  },
  replaceAssetFile: async (id: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await rawFetch(`/documents/assets/${id}/version`, { method: 'POST', body: fd })
    return (await res.json()) as { id: string; version: number }
  },
  updateAsset: (id: string, dto: { name?: string; status?: 'active' | 'archived' }) =>
    apiClient.patch<DocumentAsset>(`/documents/assets/${id}`, dto),
  removeAsset: (id: string) => apiClient.delete<{ message: string }>(`/documents/assets/${id}`),
  assetUrl: (id: string) => apiClient.get<{ url: string; expires_in: number }>(`/documents/assets/${id}/signed-url`),
}
