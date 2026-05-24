
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../api/items.api';
import { mockItems, mockCategories } from '../mock/items.mock';
import { CreateItemDTO, UpdateItemDTO, CreateVariantDTO } from '../types/item.types';

const USE_MOCK = true;

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      if (USE_MOCK) return mockItems;
      return itemsApi.getItems('tenant-id');
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      if (USE_MOCK) return mockCategories;
      return itemsApi.getCategories();
    },
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateItemDTO) => itemsApi.createItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemDTO }) =>
      itemsApi.updateItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemsApi.deleteItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useCreateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: CreateVariantDTO }) =>
      itemsApi.createVariant(itemId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useDeleteVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, variantId }: { itemId: string; variantId: string }) =>
      itemsApi.deleteVariant(itemId, variantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}