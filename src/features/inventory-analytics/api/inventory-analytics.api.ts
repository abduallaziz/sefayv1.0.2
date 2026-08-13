import { apiClient } from '@/lib/api';
import {
  ValuationRow,
  TurnoverRow,
  AgingRow,
  AbcRow,
  DeadStockRow,
  SlowMovingRow,
  OverstockRow,
  StockAccuracyRow,
  CoverageRow,
} from '../types/inventory-analytics.types';

function qs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const str = search.toString();
  return str ? `?${str}` : '';
}

export const inventoryAnalyticsApi = {
  valuation: (warehouseId?: string) =>
    apiClient.get<ValuationRow[]>(`/inventory/analytics/valuation${qs({ warehouse_id: warehouseId })}`),

  turnover: (dateFrom: string, dateTo: string, warehouseId?: string) =>
    apiClient.get<TurnoverRow[]>(
      `/inventory/analytics/turnover${qs({ date_from: dateFrom, date_to: dateTo, warehouse_id: warehouseId })}`,
    ),

  aging: (warehouseId?: string) =>
    apiClient.get<AgingRow[]>(`/inventory/analytics/aging${qs({ warehouse_id: warehouseId })}`),

  abcAnalysis: (dateFrom: string, dateTo: string, warehouseId?: string) =>
    apiClient.get<AbcRow[]>(
      `/inventory/analytics/abc-analysis${qs({ date_from: dateFrom, date_to: dateTo, warehouse_id: warehouseId })}`,
    ),

  deadStock: (lookbackDays?: number, warehouseId?: string) =>
    apiClient.get<DeadStockRow[]>(
      `/inventory/analytics/dead-stock${qs({ lookback_days: lookbackDays, warehouse_id: warehouseId })}`,
    ),

  slowMoving: (lookbackDays?: number, maxUnitsSold?: number, warehouseId?: string) =>
    apiClient.get<SlowMovingRow[]>(
      `/inventory/analytics/slow-moving${qs({ lookback_days: lookbackDays, max_units_sold: maxUnitsSold, warehouse_id: warehouseId })}`,
    ),

  overstock: (warehouseId?: string) =>
    apiClient.get<OverstockRow[]>(`/inventory/analytics/overstock${qs({ warehouse_id: warehouseId })}`),

  stockAccuracy: (dateFrom: string, dateTo: string, warehouseId?: string) =>
    apiClient.get<StockAccuracyRow[]>(
      `/inventory/analytics/stock-accuracy${qs({ date_from: dateFrom, date_to: dateTo, warehouse_id: warehouseId })}`,
    ),

  coverage: (warehouseId?: string) =>
    apiClient.get<CoverageRow[]>(`/inventory/analytics/coverage${qs({ warehouse_id: warehouseId })}`),
};
