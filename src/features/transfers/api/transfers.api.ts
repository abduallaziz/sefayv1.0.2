import { apiClient } from '@/lib/api';
import { Transfer, TransferFilters, CreateTransferDTO } from '../types/transfer.types';

/** Server-paginated envelope returned by GET /inventory/transfers. */
export interface PagedTransfers {
  data: Transfer[];
  total: number;
  page: number;
  perPage: number;
}

export interface TransfersQuery extends TransferFilters {
  page?: number;
  perPage?: number;
}

const buildTransfersQuery = ({ status, page, perPage }: TransfersQuery) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (page) params.set('page', String(page));
  // Backend reads `per_page`, not `perPage`.
  if (perPage) params.set('per_page', String(perPage));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const transfersApi = {
  /**
   * Lookup form — unwraps the envelope so any caller expecting `Transfer[]`
   * keeps working. Still one page: use getPaged() for tables, since this
   * drops `total` and so hides truncation.
   */
  getAll: async (filters: TransferFilters = {}): Promise<Transfer[]> => {
    const res = await apiClient.get<PagedTransfers>(
      `/inventory/transfers${buildTransfersQuery(filters)}`,
    );
    return res.data;
  },

  /** Table form — full envelope with the real total. */
  getPaged: (query: TransfersQuery = {}) =>
    apiClient.get<PagedTransfers>(`/inventory/transfers${buildTransfersQuery(query)}`),

  getById: (id: string) => apiClient.get<Transfer>(`/inventory/transfers/${id}`),
  create: (dto: CreateTransferDTO) => apiClient.post<Transfer>('/inventory/transfers', dto),
  approve: (id: string) => apiClient.post<Transfer>(`/inventory/transfers/${id}/approve`, undefined),
  dispatch: (id: string) => apiClient.post<Transfer>(`/inventory/transfers/${id}/dispatch`, undefined),
  receive: (id: string) => apiClient.post<Transfer>(`/inventory/transfers/${id}/receive`, undefined),
  complete: (id: string) => apiClient.post<Transfer>(`/inventory/transfers/${id}/complete`, undefined),
  cancel: (id: string) => apiClient.post<Transfer>(`/inventory/transfers/${id}/cancel`, undefined),
};
