import { apiClient } from '@/lib/api';
import {
  GoodsReceipt,
  GoodsReceiptFilters,
  CreateGoodsReceiptDTO,
} from '../types/goods-receipt.types';

export const goodsReceiptsApi = {
  getAll: (filters: GoodsReceiptFilters = {}) => {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<GoodsReceipt[]>(`/purchasing/goods-receipts${qs}`);
  },
  getById: (id: string) => apiClient.get<GoodsReceipt>(`/purchasing/goods-receipts/${id}`),
  create: (dto: CreateGoodsReceiptDTO) =>
    apiClient.post<GoodsReceipt>('/purchasing/goods-receipts', dto),
  post: (id: string) => apiClient.post<GoodsReceipt>(`/purchasing/goods-receipts/${id}/post`, undefined),
  cancel: (id: string) => apiClient.post<GoodsReceipt>(`/purchasing/goods-receipts/${id}/cancel`, undefined),
};
