import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  expensesApi,
  expenseActivityApi,
  expenseAttachmentsApi,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseFilters,
} from '../api/expenses-v2.api'

const KEY = ['expenses-v2', 'expenses'] as const

export const useExpenses = (branchId: string | undefined, filters: ExpenseFilters = {}) =>
  useQuery({
    queryKey: [...KEY, branchId, filters],
    queryFn: () => expensesApi.getAll(branchId!, filters),
    enabled: !!branchId,
  })

export const useCreateExpense = (branchId: string | undefined) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateExpenseDto) => expensesApi.create(branchId!, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export const useUpdateExpense = (branchId: string | undefined) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExpenseDto }) =>
      expensesApi.update(branchId!, id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export const useCancelExpense = (branchId: string | undefined) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => expensesApi.cancel(branchId!, id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export const useConfirmPayment = (branchId: string | undefined) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expensesApi.confirmPayment(branchId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export const useCreateFromQuick = (branchId: string | undefined) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      definitionId,
      dto,
    }: {
      definitionId: string
      dto: { amount?: number; department_id?: string; category_id?: string }
    }) => expensesApi.createFromQuick(branchId!, definitionId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export const useStopRecurring = (branchId: string | undefined) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expensesApi.stopRecurring(branchId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export const useExpenseActivity = (branchId: string | undefined, expenseId: string | null) =>
  useQuery({
    queryKey: [...KEY, 'activity', expenseId],
    queryFn: () => expenseActivityApi.getByExpense(branchId!, expenseId!),
    enabled: !!branchId && !!expenseId,
  })

export const useExpenseAttachments = (branchId: string | undefined, expenseId: string | null) =>
  useQuery({
    queryKey: [...KEY, 'attachments', expenseId],
    queryFn: () => expenseAttachmentsApi.getByExpense(branchId!, expenseId!),
    enabled: !!branchId && !!expenseId,
  })

export const useUploadAttachment = (branchId: string | undefined) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ expenseId, file }: { expenseId: string; file: File }) =>
      expenseAttachmentsApi.upload(branchId!, expenseId, file),
    onSuccess: (_, { expenseId }) =>
      qc.invalidateQueries({ queryKey: [...KEY, 'attachments', expenseId] }),
  })
}
