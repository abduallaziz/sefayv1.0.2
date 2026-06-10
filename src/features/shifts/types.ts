export interface Shift {
  id: string;
  tenant_id: string;
  branch_id: string;
  cashier_id: string;
  cashier_name?: string;
  status: 'open' | 'closed';
  opening_cash: number;
  closing_cash: number | null;
  expected_cash: number | null;
  discrepancy: number | null;
  opened_at: string;
  closed_at: string | null;
}

export interface ShiftSummaryData {
  totalInvoices: number;
  totalRevenue: number;
  totalCash: number;
  totalCard: number;
  totalExpenses: number;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number;
  discrepancy: number | null;
}

export interface ShiftSummaryResponse {
  shift: Shift;
  summary: ShiftSummaryData;
}

export interface OpenShiftDto {
  opening_cash: number;
  branch_id: string;
}

export interface CloseShiftDto {
  closing_cash: number;
}