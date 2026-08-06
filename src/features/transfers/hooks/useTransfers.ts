import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { transfersApi, type TransfersQuery } from '../api/transfers.api';
import { TransferFilters, CreateTransferDTO } from '../types/transfer.types';
import { useInventoryErrorHandler } from '@/shared/hooks/useInventoryErrorHandler';

export function useTransfers(filters: TransferFilters = {}) {
  return useQuery({
    queryKey: ['transfers', filters],
    queryFn: () => transfersApi.getAll(filters),
    staleTime: 30_000,
  });
}

/**
 * Table hook — server pagination with the real total.
 * Key starts with 'transfers' so the existing mutation invalidations still
 * reach it. `placeholderData` avoids an empty flash while paging.
 */
export function usePagedTransfers(query: TransfersQuery) {
  return useQuery({
    queryKey: ['transfers', 'paged', query],
    queryFn: () => transfersApi.getPaged(query),
    placeholderData: keepPreviousData,
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
  const onError = useInventoryErrorHandler();
  return useMutation({
    onError,
    mutationFn: (data: CreateTransferDTO) => transfersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] }),
  });
}

export function useApproveTransfer() {
  const qc = useQueryClient();
  const onError = useInventoryErrorHandler();
  return useMutation({
    onError,
    mutationFn: (id: string) => transfersApi.approve(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfers', id] });
    },
  });
}

export function useCompleteTransfer() {
  const qc = useQueryClient();
  const onError = useInventoryErrorHandler();
  return useMutation({
    onError,
    mutationFn: (id: string) => transfersApi.complete(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfers', id] });
    },
  });
}

export function useDispatchTransfer() {
  const qc = useQueryClient();
  const onError = useInventoryErrorHandler();
  return useMutation({
    onError,
    mutationFn: (id: string) => transfersApi.dispatch(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfers', id] });
    },
  });
}

export function useReceiveTransfer() {
  const qc = useQueryClient();
  const onError = useInventoryErrorHandler();
  return useMutation({
    onError,
    mutationFn: (id: string) => transfersApi.receive(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfers', id] });
    },
  });
}

export function useCancelTransfer() {
  const qc = useQueryClient();
  const onError = useInventoryErrorHandler();
  return useMutation({
    onError,
    mutationFn: (id: string) => transfersApi.cancel(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['transfers', id] });
    },
  });
}
