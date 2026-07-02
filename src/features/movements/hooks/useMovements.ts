import { useQuery } from '@tanstack/react-query';
import { movementsApi } from '../api/movements.api';
import { MovementsLedgerFilters } from '../types/movements.types';

export function useMovementsLedger(filters: MovementsLedgerFilters = {}) {
  return useQuery({
    queryKey: ['movements-ledger', filters],
    queryFn: () => movementsApi.getLedger(filters),
    staleTime: 30_000,
  });
}
