import { apiClient } from '@/lib/api'

export interface NotePreset {
  id: string
  text: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface NotePresetInput {
  text: string
  sort_order?: number
}

export const notePresetsApi = {
  getAll: (): Promise<NotePreset[]> => apiClient.get('/note-presets'),

  // Active-only, already ordered — what the POS "choose from list" tab renders.
  getActive: (): Promise<NotePreset[]> => apiClient.get('/note-presets/active'),

  create: (data: NotePresetInput): Promise<NotePreset> => apiClient.post('/note-presets', data),

  update: (id: string, data: Partial<NotePresetInput & { is_active: boolean }>): Promise<NotePreset> =>
    apiClient.patch(`/note-presets/${id}`, data),

  remove: (id: string): Promise<void> => apiClient.delete(`/note-presets/${id}`),

  // ids = the full, tenant-owned list in its new order — the server rejects
  // anything that isn't an exact reordering of the existing set.
  reorder: (ids: string[]): Promise<NotePreset[]> => apiClient.patch('/note-presets/reorder', { ids }),
}
