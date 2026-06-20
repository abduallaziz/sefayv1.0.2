import { apiClient } from '@/lib/api';
import {
  Customer,
  CustomerOrder,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerStats,
} from '../types/customer.types';

export const customersApi = {
  getAll: (): Promise<Customer[]> =>
    apiClient.get('/customers'),

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