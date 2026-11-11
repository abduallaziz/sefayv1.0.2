import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  quickDefinitionsApi,
  CreateQuickDefinitionDto,
  UpdateQuickDefinitionDto,
} from '../api/expenses-v2.api'

const KEY = ['expenses-v2', 'quick-definitions'] as const

export const useQuickDefinitions = (includeInactive = false) =>
  useQuery({
    queryKey: [...KEY, includeInactive],
    queryFn: () => quickDefinitionsApi.getAll(includeInactive),
  })

export const useCreateQuickDefinition = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateQuickDefinitionDto) => quickDefinitionsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export const useUpdateQuickDefinition = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateQuickDefinitionDto }) =>
      quickDefinitionsApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export const useDeactivateQuickDefinition = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => quickDefinitionsApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
