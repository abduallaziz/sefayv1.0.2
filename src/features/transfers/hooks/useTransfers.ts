import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersApi } from '../api/transfers.api';
import { TransferFilters, CreateTransferDTO } from '../types/transfer.types';

export function useTransfers(filters: TransferFilters = {}) {
  return useQuery({
    queryKey: ['transfers', filters],
    queryFn: () => transfersApi.getAll(filters),
    staleTime: 30_000,
  });
}

export function useTransfer(id: string | null) {
  return useQuery({
    queryKey: ['transfers', id],
    queryFn: () => transfersApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransferDTO) => transfersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] }),
  });
}

export function useDispatchTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transfersApi.dispatch(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfers', id] });
    },
  });
}

export function useReceiveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transfersApi.receive(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfers', id] });
    },
  });
}

export function useCancelTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transfersApi.cancel(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfers', id] });
    },
  });
}
