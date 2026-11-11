import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  expenseCategoriesV2Api,
  CreateExpenseMasterDto,
  UpdateExpenseMasterDto,
} from '../api/expenses-v2.api';

const KEY = ['expenses-v2', 'categories'] as const;

export const useExpenseCategoriesV2 = (includeInactive = false) =>
  useQuery({
    queryKey: [...KEY, includeInactive],
    queryFn: () => expenseCategoriesV2Api.getAll(includeInactive),
  });

export const useCreateExpenseCategoryV2 = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExpenseMasterDto) => expenseCategoriesV2Api.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useUpdateExpenseCategoryV2 = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExpenseMasterDto }) =>
      expenseCategoriesV2Api.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useDeactivateExpenseCategoryV2 = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseCategoriesV2Api.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
