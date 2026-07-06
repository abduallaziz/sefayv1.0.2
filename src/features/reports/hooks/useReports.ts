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

export function useComparisonReport(query?: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'comparison', query],
    queryFn: () => reportsApi.getComparison(query),
  })
}

export function useBranchComparisonReport(query?: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'by-branch', query],
    queryFn: () => reportsApi.getByBranch(query),
  })
}

export function useCustomerChurnReport(query?: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'customer-churn', query],
    queryFn: () => reportsApi.getCustomerChurn(query),
  })
}

export function usePayrollReport(month: string) {
  return useQuery({
    queryKey: ['reports', 'payroll', month],
    queryFn: () => reportsApi.getPayroll(month),
  })
}

export function useHrSummary() {
  return useQuery({
    queryKey: ['reports', 'hr-summary'],
    queryFn: () => reportsApi.getHrSummary(),
  })
}