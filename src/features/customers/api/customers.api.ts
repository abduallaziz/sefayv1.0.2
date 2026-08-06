import { apiClient } from '@/lib/api';
import {
  Customer,
  CustomerOrder,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerStats,
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
}

const buildCustomersQuery = ({ search, page, perPage }: CustomersQuery) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (page) params.set('page', String(page));
  // Backend DTO names this `limit` (max 100), not `per_page`.
  if (perPage) params.set('limit', String(perPage));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const customersApi = {
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

  getHistory: (id: string): Promise<CustomerOrder[]> =>
    apiClient.get(`/customers/${id}/history`),

  getStats: (): Promise<CustomerStats> =>
    apiClient.get('/customers/stats'),

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