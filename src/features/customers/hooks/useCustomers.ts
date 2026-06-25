import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, customerFieldDefinitionsApi } from '../api/customers.api';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateFieldDefinitionDto,
  UpdateFieldDefinitionDto,
} from '../types/customer.types';

export const useCustomers = () =>
  useQuery({ queryKey: ['customers'], queryFn: () => customersApi.getAll() });

export const useCustomerSearch = (search: string) =>
  useQuery({
    queryKey: ['customers', 'search', search],
    queryFn: () => customersApi.getAll(search),
    enabled: search.trim().length >= 2,
  });

export const useCustomerDetails = (id: string) =>
  useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.getById(id),
    enabled: !!id,
  });

export const useCustomerHistory = (id: string) =>
  useQuery({
    queryKey: ['customers', id, 'history'],
    queryFn: () => customersApi.getHistory(id),
    enabled: !!id,
  });

export const useCustomerStats = () =>
  useQuery({ queryKey: ['customers', 'stats'], queryFn: customersApi.getStats });

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

export const useCustomerFieldDefinitions = () =>
  useQuery({
    queryKey: ['customer-field-definitions'],
    queryFn: customerFieldDefinitionsApi.getAll,
  });

export const useCreateFieldDefinition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFieldDefinitionDto) => customerFieldDefinitionsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-field-definitions'] }),
  });
};

export const useUpdateFieldDefinition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFieldDefinitionDto }) =>
      customerFieldDefinitionsApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-field-definitions'] }),
  });
};

export const useDeleteFieldDefinition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerFieldDefinitionsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-field-definitions'] }),
  });
};