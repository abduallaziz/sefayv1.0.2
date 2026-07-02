import { useQuery } from '@tanstack/react-query';
import { stockApi } from '../api/stock.api';
import { StockLevelFilters, StockLevelEnrichedFilters, StockMovementFilters } from '../types/stock.types';

export function useStockLevels(filters: StockLevelFilters = {}) {
  return useQuery({
    queryKey: ['stock-levels', filters],
    queryFn: () => stockApi.getLevels(filters),
    staleTime: 30_000,
  });
}

export function useStockLevelsEnriched(filters: StockLevelEnrichedFilters = {}) {
  return useQuery({
    queryKey: ['stock-levels-enriched', filters],
    queryFn: () => stockApi.getLevelsEnriched(filters),
    staleTime: 30_000,
  });
}

export function useStockMovements(filters: StockMovementFilters = {}) {
  return useQuery({
    queryKey: ['stock-movements', filters],
    queryFn: () => stockApi.getMovements(filters),
    staleTime: 30_000,
  });
}
