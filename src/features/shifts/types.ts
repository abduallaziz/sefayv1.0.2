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

export type CountedMethod = 'cash' | 'mada' | 'visa' | 'mastercard';

export interface CloseShiftDto {
  closing_cash?: number;
  counts?: Partial<Record<CountedMethod, number>>;
  notes?: string;
}

export interface CloseReportRow {
  method: CountedMethod | 'other';
  sales: number;
  returns: number;
  expected: number;
  counted: number | null;
  difference: number | null;
}

export interface CloseReport {
  revision: number;
  legacy: boolean;
  generated_at: string;
  shift: {
    id: string;
    opened_at: string;
    closed_at: string;
    cashier_id: string;
    cashier_name: string | null;
    branch_id: string;
    branch_name: string | null;
    notes: string | null;
  };
  totals: {
    invoice_count: number;
    items_count: number;
    total_sales: number;
    discount_total: number;
    tax_total: number;
    expenses_total: number;
    cancelled_count: number;
    cancelled_amount: number;
    returned_count: number;
    returned_amount: number;
  };
  cash: { opening: number; expected: number; counted: number; difference: number };
  methods: CloseReportRow[];
}

export interface CloseShiftResponse {
  shift: Shift;
  report: CloseReport;
}