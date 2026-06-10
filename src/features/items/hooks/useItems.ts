import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  itemsApi,
  CreateItemDto,
  CreateVariantDto,
} from '../api/items.api';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.getAll(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => itemsApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useItemVariants(itemId: string | null) {
  return useQuery({
    queryKey: ['items', itemId, 'variants'],
    queryFn: () => itemsApi.getVariants(itemId!),
    enabled: !!itemId,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateItemDto) => itemsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateItemDto> & { is_active?: boolean };
    }) => itemsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useCreateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: CreateVariantDto }) =>
      itemsApi.createVariant(itemId, data),
    onSuccess: (_res, { itemId }) => {
      qc.invalidateQueries({ queryKey: ['items', itemId, 'variants'] });
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useDeleteVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, variantId }: { itemId: string; variantId: string }) =>
      itemsApi.deleteVariant(itemId, variantId),
    onSuccess: (_res, { itemId }) => {
      qc.invalidateQueries({ queryKey: ['items', itemId, 'variants'] });
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });
}