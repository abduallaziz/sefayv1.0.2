import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notePresetsApi, NotePresetInput } from '../api/note-presets.api'

export function useNotePresets() {
  return useQuery({
    queryKey: ['note-presets'],
    queryFn: () => notePresetsApi.getAll(),
  })
}

// Active-only, ordered — used by the POS "choose from list" tab.
export function useActiveNotePresets() {
  return useQuery({
    queryKey: ['note-presets', 'active'],
    queryFn: () => notePresetsApi.getActive(),
  })
}

export function useCreateNotePreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NotePresetInput) => notePresetsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['note-presets'] }),
  })
}

export function useUpdateNotePreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NotePresetInput & { is_active: boolean }> }) =>
      notePresetsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['note-presets'] }),
  })
}

export function useDeleteNotePreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notePresetsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['note-presets'] }),
  })
}

export function useReorderNotePresets() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => notePresetsApi.reorder(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['note-presets'] }),
  })
}
