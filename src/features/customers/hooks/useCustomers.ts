
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api/customers.api';
import {
  mockCustomers,
  mockCustomerOrders,
  mockCustomerStats,
} from '../mock/customers.mock';
import { CreateCustomerDto, UpdateCustomerDto } from '../types/customer.types';

const USE_MOCK = true;

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: USE_MOCK
      ? async () => mockCustomers
      : customersApi.getAll,
  });
};

export const useCustomerDetails = (id: string) => {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: USE_MOCK
      ? async () => mockCustomers.find((c) => c.id === id)!
      : () => customersApi.getById(id),
    enabled: !!id,
  });
};

export const useCustomerHistory = (id: string) => {
  return useQuery({
    queryKey: ['customers', id, 'history'],
    queryFn: USE_MOCK
      ? async () => mockCustomerOrders
      : () => customersApi.getHistory(id),
    enabled: !!id,
  });
};

export const useCustomerStats = () => {
  return useQuery({
    queryKey: ['customers', 'stats'],
    queryFn: USE_MOCK
      ? async () => mockCustomerStats
      : customersApi.getStats,
  });
};

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCustomerDto) => customersApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCustomerDto }) =>
      customersApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useDeleteCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
};