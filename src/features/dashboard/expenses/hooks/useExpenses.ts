import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, CreateExpenseDto, ExpenseTemplate } from '../api/expenses.api';

const KEYS = {
  all: ['expenses'] as const,
  templates: ['expenses', 'templates'] as const,
  stats: ['expenses', 'stats'] as const,
};

export const useExpenses = () =>
  useQuery({ queryKey: KEYS.all, queryFn: expensesApi.getAll });

export const useExpenseTemplates = () =>
  useQuery({ queryKey: KEYS.templates, queryFn: expensesApi.getTemplates });

export const useExpenseStats = () =>
  useQuery({ queryKey: KEYS.stats, queryFn: expensesApi.getStats });

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExpenseDto) => expensesApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useApproveExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useRejectExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      expensesApi.reject(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useCreateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Omit<ExpenseTemplate, 'id' | 'tenant_id' | 'deleted_at' | 'created_at' | 'updated_at'>) =>
      expensesApi.createTemplate(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.templates }),
  });
};

export const useUpdateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Omit<ExpenseTemplate, 'id' | 'tenant_id' | 'deleted_at' | 'created_at' | 'updated_at'>> }) =>
      expensesApi.updateTemplate(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.templates }),
  });
};

export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.templates }),
  });
};