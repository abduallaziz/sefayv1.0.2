
import { apiClient } from '@/lib/api';
import {
  Customer,
  CustomerOrder,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerStats,
} from '../types/customer.types';

export const customersApi = {
  getAll: async (): Promise<Customer[]> => {
    const res = await apiClient.get('/customers') as { data: Customer[] };
    return res.data;
  },

  getById: async (id: string): Promise<Customer> => {
    const res = await apiClient.get(`/customers/${id}`) as { data: Customer };
    return res.data;
  },

  getHistory: async (id: string): Promise<CustomerOrder[]> => {
    const res = await apiClient.get(`/customers/${id}/history`) as { data: CustomerOrder[] };
    return res.data;
  },

  getStats: async (): Promise<CustomerStats> => {
    const res = await apiClient.get('/customers/stats') as { data: CustomerStats };
    return res.data;
  },

  create: async (dto: CreateCustomerDto): Promise<Customer> => {
    const res = await apiClient.post('/customers', dto) as { data: Customer };
    return res.data;
  },

  update: async (id: string, dto: UpdateCustomerDto): Promise<Customer> => {
    const res = await apiClient.patch(`/customers/${id}`, dto) as { data: Customer };
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  adjustPoints: async (id: string, points: number, reason: string): Promise<Customer> => {
    const res = await apiClient.patch(`/customers/${id}/points`, { points, reason }) as { data: Customer };
    return res.data;
  },
};