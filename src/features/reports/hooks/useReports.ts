import { useQuery } from '@tanstack/react-query'
import { reportsApi, ReportQuery } from '../api/reports.api'

export function useRevenueReport(query?: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'revenue', query],
    queryFn: () => reportsApi.getRevenue(query),
  })
}

export function useShiftsReport(query?: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'shifts', query],
    queryFn: () => reportsApi.getShifts(query),
  })
}

export function useExpensesReport(query?: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'expenses', query],
    queryFn: () => reportsApi.getExpenses(query),
  })
}

export function usePaymentsReport(query?: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'payments', query],
    queryFn: () => reportsApi.getPayments(query),
  })
}

export function useEmployeesReport(query?: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'employees', query],
    queryFn: () => reportsApi.getEmployees(query),
  })
}

export function useCustomersReport(query?: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'customers', query],
    queryFn: () => reportsApi.getCustomersReport(query),
  })
}

export function useTaxReport(query?: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'tax', query],
    queryFn: () => reportsApi.getTax(query),
  })
}

export function useInventoryReport(warehouseId?: string) {
  return useQuery({
    queryKey: ['reports', 'inventory', warehouseId],
    queryFn: () => reportsApi.getInventory(warehouseId),
  })
}