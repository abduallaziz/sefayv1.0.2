import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { customersApi, customerFieldDefinitionsApi, type CustomersQuery } from '../api/customers.api';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateFieldDefinitionDto,
  UpdateFieldDefinitionDto,
} from '../types/customer.types';

export const useCustomers = () =>
  useQuery({ queryKey: ['customers'], queryFn: () => customersApi.getAll() });

/**
 * Table hook — server-side search + pagination. `placeholderData` keeps the
 * previous page on screen while the next one loads, so paging doesn't flash
 * an empty table on a slow connection.
 */
export const usePagedCustomers = (query: CustomersQuery) =>
  useQuery({
    queryKey: ['customers', 'paged', query],
    queryFn: () => customersApi.getPaged(query),
    placeholderData: keepPreviousData,
  });

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

export const useCustomerVehicles = (id: string) =>
  useQuery({
    queryKey: ['customers', id, 'vehicles'],
    queryFn: () => customersApi.listVehicles(id),
    enabled: !!id,
  });

export const useVehicleMutations = (customerId: string) => {
  const qc = useQueryClient();
  // A plate change also alters what the POS lookup returns for this customer.
  const done = () => {
    qc.invalidateQueries({ queryKey: ['customers', customerId, 'vehicles'] });
    qc.invalidateQueries({ queryKey: ['customers', 'lookup'] });
  };
  return {
    add: useMutation({
      mutationFn: (dto: { plate: string; size?: string }) => customersApi.addVehicle(customerId, dto),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ vehicleId, dto }: { vehicleId: string; dto: { plate?: string; size?: string } }) =>
        customersApi.updateVehicle(customerId, vehicleId, dto),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (vehicleId: string) => customersApi.removeVehicle(customerId, vehicleId),
      onSuccess: done,
    }),
  };
};

export const useCustomerStats = () =>
  useQuery({ queryKey: ['customers', 'stats'], queryFn: () => customersApi.getStats() });

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

export const useCustomerFieldDefinitions = () => {
  const authReady = useAuthStore((s) => !s.isLoading);
  return useQuery({
    queryKey: ['customer-field-definitions'],
    queryFn: customerFieldDefinitionsApi.getAll,
    enabled: authReady,
  });
};

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