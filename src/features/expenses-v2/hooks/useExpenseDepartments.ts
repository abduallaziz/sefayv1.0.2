import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  expenseDepartmentsApi,
  CreateExpenseMasterDto,
  UpdateExpenseMasterDto,
} from '../api/expenses-v2.api';

const KEY = ['expenses-v2', 'departments'] as const;

export const useExpenseDepartments = (includeInactive = false) =>
  useQuery({
    queryKey: [...KEY, includeInactive],
    queryFn: () => expenseDepartmentsApi.getAll(includeInactive),
  });

export const useCreateExpenseDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExpenseMasterDto) => expenseDepartmentsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useUpdateExpenseDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExpenseMasterDto }) =>
      expenseDepartmentsApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useDeactivateExpenseDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseDepartmentsApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
