import { useQuery } from '@tanstack/react-query';
import { inventoryAnalyticsApi } from '../api/inventory-analytics.api';

const staleTime = 60 * 1000;

export function useValuation(warehouseId?: string) {
  return useQuery({
    queryKey: ['analytics', 'valuation', warehouseId ?? 'all'],
    queryFn: () => inventoryAnalyticsApi.valuation(warehouseId),
    staleTime,
  });
}

export function useTurnover(dateFrom: string, dateTo: string, warehouseId?: string) {
  return useQuery({
    queryKey: ['analytics', 'turnover', dateFrom, dateTo, warehouseId ?? 'all'],
    queryFn: () => inventoryAnalyticsApi.turnover(dateFrom, dateTo, warehouseId),
    enabled: !!dateFrom && !!dateTo,
    staleTime,
  });
}

export function useAging(warehouseId?: string) {
  return useQuery({
    queryKey: ['analytics', 'aging', warehouseId ?? 'all'],
    queryFn: () => inventoryAnalyticsApi.aging(warehouseId),
    staleTime,
  });
}

export function useAbcAnalysis(dateFrom: string, dateTo: string, warehouseId?: string) {
  return useQuery({
    queryKey: ['analytics', 'abc', dateFrom, dateTo, warehouseId ?? 'all'],
    queryFn: () => inventoryAnalyticsApi.abcAnalysis(dateFrom, dateTo, warehouseId),
    enabled: !!dateFrom && !!dateTo,
    staleTime,
  });
}

export function useDeadStock(lookbackDays?: number, warehouseId?: string) {
  return useQuery({
    queryKey: ['analytics', 'dead-stock', lookbackDays ?? 90, warehouseId ?? 'all'],
    queryFn: () => inventoryAnalyticsApi.deadStock(lookbackDays, warehouseId),
    staleTime,
  });
}

export function useSlowMoving(lookbackDays?: number, maxUnitsSold?: number, warehouseId?: string) {
  return useQuery({
    queryKey: ['analytics', 'slow-moving', lookbackDays ?? 90, maxUnitsSold ?? 5, warehouseId ?? 'all'],
    queryFn: () => inventoryAnalyticsApi.slowMoving(lookbackDays, maxUnitsSold, warehouseId),
    staleTime,
  });
}

export function useOverstock(warehouseId?: string) {
  return useQuery({
    queryKey: ['analytics', 'overstock', warehouseId ?? 'all'],
    queryFn: () => inventoryAnalyticsApi.overstock(warehouseId),
    staleTime,
  });
}

export function useStockAccuracy(dateFrom: string, dateTo: string, warehouseId?: string) {
  return useQuery({
    queryKey: ['analytics', 'stock-accuracy', dateFrom, dateTo, warehouseId ?? 'all'],
    queryFn: () => inventoryAnalyticsApi.stockAccuracy(dateFrom, dateTo, warehouseId),
    enabled: !!dateFrom && !!dateTo,
    staleTime,
  });
}

export function useCoverage(warehouseId?: string) {
  return useQuery({
    queryKey: ['analytics', 'coverage', warehouseId ?? 'all'],
    queryFn: () => inventoryAnalyticsApi.coverage(warehouseId),
    staleTime,
  });
}
