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

export const customersApi = {
  getAll: (search?: string): Promise<Customer[]> =>
    apiClient.get(search ? `/customers?search=${encodeURIComponent(search)}` : '/customers'),

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