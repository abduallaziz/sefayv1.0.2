import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, CreateInvoiceDto } from '../api/invoices.api';

export const INVOICES_KEY = ['invoices'] as const;

export function useInvoices(params?: { branch_id?: string; status?: string }) {
  return useQuery({
    queryKey: [...INVOICES_KEY, params],
    queryFn: () => invoicesApi.getAll(params),
    staleTime: 60 * 1000,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInvoiceDto) => invoicesApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVOICES_KEY }),
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      invoicesApi.cancel(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVOICES_KEY }),
  });
}