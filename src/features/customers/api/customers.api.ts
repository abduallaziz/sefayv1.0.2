import { apiClient } from '@/lib/api';
import {
  Customer,
  CustomerOrder,
  CustomerVehicle,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerStats,
  CustomerLookupResult,
  CustomerFieldDefinition,
  CreateFieldDefinitionDto,
  UpdateFieldDefinitionDto,
} from '../types/customer.types';

/** Server-paginated envelope returned by GET /customers. */
export interface PagedCustomers {
  data: Customer[];
  total: number;
  page: number;
  perPage: number;
}

export interface CustomersQuery {
  search?: string;
  page?: number;
  perPage?: number;
  // Additive — matches CustomerQueryDto.sortBy/sortOrder on the backend
  // (migration 236 / fn_customers_page_by_spend). Omitting both preserves
  // the existing default (created_at desc).
  sortBy?: 'full_name' | 'created_at' | 'loyalty_points' | 'total_spent';
  sortOrder?: 'asc' | 'desc';
}

const buildCustomersQuery = ({ search, page, perPage, sortBy, sortOrder }: CustomersQuery) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (page) params.set('page', String(page));
  // Backend DTO names this `limit` (max 100), not `per_page`.
  if (perPage) params.set('limit', String(perPage));
  if (sortBy) params.set('sortBy', sortBy);
  if (sortOrder) params.set('sortOrder', sortOrder);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const customersApi = {
  /** Exact normalised lookup by plate or phone (T12). 409 on a phone/plate of two customers. */
  lookup: (params: { plate?: string; phone?: string }): Promise<CustomerLookupResult> => {
    const qs = new URLSearchParams();
    if (params.plate) qs.set('plate', params.plate);
    if (params.phone) qs.set('phone', params.phone);
    return apiClient.get<CustomerLookupResult>(`/customers/lookup?${qs.toString()}`);
  },

  /**
   * Lookup form — returns a bare array for small, search-driven usage
   * (the POS customer picker). Unwraps the envelope so existing consumers
   * keep their `Customer[]` contract and need no change.
   * For tables use getPaged() instead: this drops `total`, so a caller
   * has no way to know the result was truncated.
   */
  getAll: async (search?: string): Promise<Customer[]> => {
    const res = await apiClient.get<PagedCustomers>(
      `/customers${buildCustomersQuery({ search })}`,
    );
    return res.data;
  },

  /** Table form — full envelope with the total needed to drive pagination. */
  getPaged: (query: CustomersQuery = {}): Promise<PagedCustomers> =>
    apiClient.get<PagedCustomers>(`/customers${buildCustomersQuery(query)}`),

  getById: (id: string): Promise<Customer> =>
    apiClient.get(`/customers/${id}`),

  // The endpoint returns { customer, stats, recent_orders }; the screen only
  // needs the orders list.
  getHistory: async (id: string): Promise<CustomerOrder[]> => {
    const res = await apiClient.get<{ recent_orders?: CustomerOrder[] }>(
      `/customers/${id}/history`,
    );
    return res.recent_orders ?? [];
  },

  listVehicles: (id: string): Promise<CustomerVehicle[]> =>
    apiClient.get(`/customers/${id}/vehicles`),

  addVehicle: (id: string, dto: { plate: string; size?: string }): Promise<CustomerVehicle> =>
    apiClient.post(`/customers/${id}/vehicles`, dto),

  updateVehicle: (
    id: string,
    vehicleId: string,
    dto: { plate?: string; size?: string },
  ): Promise<CustomerVehicle> =>
    apiClient.patch(`/customers/${id}/vehicles/${vehicleId}`, dto),

  removeVehicle: (id: string, vehicleId: string): Promise<void> =>
    apiClient.delete(`/customers/${id}/vehicles/${vehicleId}`),

  // With a range, the response also carries `new_in_range` (customers created
  // in those local days); without one it is the all-time / this-month figures.
  getStats: (range?: { from: string; to: string }): Promise<CustomerStats> =>
    apiClient.get(
      range ? `/customers/stats?from=${range.from}&to=${range.to}` : '/customers/stats',
    ),

  create: (dto: CreateCustomerDto): Promise<Customer> =>
    apiClient.post('/customers', dto),

  update: (id: string, dto: UpdateCustomerDto): Promise<Customer> =>
    apiClient.patch(`/customers/${id}`, dto),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/customers/${id}`),
};

export const customerFieldDefinitionsApi = {
  getAll: (): Promise<CustomerFieldDefinition[]> =>
    apiClient.get('/customer-field-definitions'),

  create: (dto: CreateFieldDefinitionDto): Promise<CustomerFieldDefinition> =>
    apiClient.post('/customer-field-definitions', dto),

  update: (id: string, dto: UpdateFieldDefinitionDto): Promise<CustomerFieldDefinition> =>
    apiClient.patch(`/customer-field-definitions/${id}`, dto),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/customer-field-definitions/${id}`),
};