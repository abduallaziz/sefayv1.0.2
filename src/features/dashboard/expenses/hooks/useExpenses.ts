import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, CreateExpenseDto, CreateCategoryDto, UpdateExpenseTemplateDto } from '../api/expenses.api';

const KEYS = {
  all: ['expenses'] as const,
  stats: ['expenses', 'stats'] as const,
  categories: ['expense-categories'] as const,
  templates: ['expense-templates'] as const,
};

export const useExpenses = () =>
  useQuery({ queryKey: KEYS.all, queryFn: expensesApi.getAll, staleTime: 0 });

export const useExpenseStats = () =>
  useQuery({ queryKey: KEYS.stats, queryFn: expensesApi.getStats });

export const useExpenseCategories = () =>
  useQuery({
    queryKey: KEYS.categories,
    queryFn: expensesApi.getCategories,
    staleTime: 0,
    refetchOnMount: true,
  });

export const useExpenseTemplates = () =>
  useQuery({
    queryKey: KEYS.templates,
    queryFn: expensesApi.getTemplates,
    staleTime: 0,
    refetchOnMount: true,
  });

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExpenseDto) => expensesApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
};

export const useApproveExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
};

export const useRejectExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      expensesApi.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
};

export const useCancelExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCategoryDto) => expensesApi.createCategory(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.categories }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateCategoryDto & { is_active: boolean }> }) =>
      expensesApi.updateCategory(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.categories }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteCategory(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEYS.categories });
      const previous = qc.getQueryData(KEYS.categories);
      qc.setQueryData(KEYS.categories, (old: any[]) =>
        (old ?? []).filter((cat) => cat.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(KEYS.categories, context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.categories });
    },
  });
};

export const useUpdateExpenseTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExpenseTemplateDto }) =>
      expensesApi.updateTemplate(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.templates }),
  });
};

export const useDeleteExpenseTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.templates }),
  });
};

export const useCreateExpenseTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; default_amount?: number | null; expiry_hours?: number; requires_photo?: boolean }) =>
      expensesApi.createTemplate(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.templates }),
  });
};