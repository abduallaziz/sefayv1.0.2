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