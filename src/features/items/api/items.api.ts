
import { apiClient } from '@/lib/api';
import { Item, ItemVariant, CreateItemDTO, UpdateItemDTO, CreateVariantDTO, Category } from '../types/item.types';

export const itemsApi = {
  getItems: async (tenantId: string): Promise<Item[]> => {
    const res = await apiClient.get(`/items?tenant_id=${tenantId}`);
    return (res as any).data;
  },

  getItem: async (id: string): Promise<Item> => {
    const res = await apiClient.get(`/items/${id}`);
    return (res as any).data;
  },

  createItem: async (data: CreateItemDTO): Promise<Item> => {
    const res = await apiClient.post('/items', data);
    return (res as any).data;
  },

  updateItem: async (id: string, data: UpdateItemDTO): Promise<Item> => {
    const res = await apiClient.patch(`/items/${id}`, data);
    return (res as any).data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  },

  getVariants: async (itemId: string): Promise<ItemVariant[]> => {
    const res = await apiClient.get(`/items/${itemId}/variants`);
    return (res as any).data;
  },

  createVariant: async (itemId: string, data: CreateVariantDTO): Promise<ItemVariant> => {
    const res = await apiClient.post(`/items/${itemId}/variants`, data);
    return (res as any).data;
  },

  updateVariant: async (itemId: string, variantId: string, data: Partial<CreateVariantDTO>): Promise<ItemVariant> => {
    const res = await apiClient.patch(`/items/${itemId}/variants/${variantId}`, data);
    return (res as any).data;
  },

  deleteVariant: async (itemId: string, variantId: string): Promise<void> => {
    await apiClient.delete(`/items/${itemId}/variants/${variantId}`);
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get('/categories');
    return (res as any).data;
  },
};