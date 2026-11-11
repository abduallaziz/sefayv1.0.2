import { apiClient } from '@/lib/api'
import { branchScopedApi } from './branch-scoped-request';

// New Expenses domain — Step 3 (Department + Category administration only).
// Route prefix `expenses-v2`, deliberately distinct from Legacy's own
// `/expenses`/`/expense-categories` routes (still live, unrelated, and
// untouched by this feature — see the Legacy Coexistence design decision).

export interface ExpenseMasterRecord {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseMasterDto {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdateExpenseMasterDto {
  name?: string;
  code?: string;
  description?: string;
  is_active?: boolean;
}

export const expenseDepartmentsApi = {
  getAll: (includeInactive = false) =>
    apiClient.get<ExpenseMasterRecord[]>(
      `/expenses-v2/departments${includeInactive ? '?includeInactive=true' : ''}`,
    ),
  create: (dto: CreateExpenseMasterDto) =>
    apiClient.post<ExpenseMasterRecord>('/expenses-v2/departments', dto),
  update: (id: string, dto: UpdateExpenseMasterDto) =>
    apiClient.patch<ExpenseMasterRecord>(`/expenses-v2/departments/${id}`, dto),
  deactivate: (id: string) =>
    apiClient.patch<ExpenseMasterRecord>(`/expenses-v2/departments/${id}/deactivate`, {}),
};

export const expenseCategoriesV2Api = {
  getAll: (includeInactive = false) =>
    apiClient.get<ExpenseMasterRecord[]>(
      `/expenses-v2/categories${includeInactive ? '?includeInactive=true' : ''}`,
    ),
  create: (dto: CreateExpenseMasterDto) =>
    apiClient.post<ExpenseMasterRecord>('/expenses-v2/categories', dto),
  update: (id: string, dto: UpdateExpenseMasterDto) =>
    apiClient.patch<ExpenseMasterRecord>(`/expenses-v2/categories/${id}`, dto),
  deactivate: (id: string) =>
    apiClient.patch<ExpenseMasterRecord>(`/expenses-v2/categories/${id}/deactivate`, {}),
};

// ============================================================
// Expense core, Quick Expense, Recurring (as an Expense property —
// no Template entity), Activity History, Attachments.
// ============================================================

export type TaxMode = 'none' | 'inclusive' | 'exclusive'
export type PaymentStatus = 'paid' | 'unpaid'
export type ExpenseSource = 'manual' | 'quick' | 'recurring' | 'pos'
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

// Recurring Expenses Final Implementation (Owner Decision): a recurring
// Expense IS an Expense — no separate Template entity. Recurrence is a
// behavior/property carried directly on the Expense record itself.
export interface ExpenseRecord {
  id: string
  branch_id: string
  department_id: string
  category_id: string
  title: string
  description: string | null
  amount: number
  tax_mode: TaxMode
  tax_amount: number
  total_amount: number
  payment_method: string
  payment_status: PaymentStatus
  approval_status: string
  reference_number: string | null
  source: ExpenseSource
  created_by: string | null
  cancelled_by: string | null
  cancelled_at: string | null
  is_recurring: boolean
  frequency: RecurringFrequency | null
  next_occurrence_date: string | null
  recurring_end_date: string | null
  recurring_source_expense_id: string | null
  expense_date: string
  created_at: string
  updated_at: string
}

export interface CreateExpenseDto {
  department_id: string
  category_id: string
  title: string
  description?: string
  amount: number
  tax_mode: TaxMode
  payment_method: string
  reference_number?: string
  payment_status?: PaymentStatus
  // Phase 5 / T8: the OPEN register the cash was paid out of (cash + paid only)
  shift_id?: string
  is_recurring?: boolean
  frequency?: RecurringFrequency
  recurring_end_date?: string
  expense_date?: string
}

export interface UpdateExpenseDto {
  department_id?: string
  category_id?: string
  title?: string
  description?: string
  amount?: number
  tax_mode?: TaxMode
  payment_method?: string
  reference_number?: string
  frequency?: RecurringFrequency
  recurring_end_date?: string
  expense_date?: string
}

export interface ExpenseFilters {
  department_id?: string
  category_id?: string
  source?: ExpenseSource
  payment_status?: PaymentStatus
  search?: string
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  exclude_cancelled?: boolean
  is_recurring?: boolean
}

function toQueryString(filters: ExpenseFilters): string {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const expensesApi = {
  getAll: (branchId: string, filters: ExpenseFilters = {}) =>
    branchScopedApi.get<ExpenseRecord[]>(`/expenses-v2/expenses${toQueryString(filters)}`, branchId),
  getOne: (branchId: string, id: string) =>
    branchScopedApi.get<ExpenseRecord>(`/expenses-v2/expenses/${id}`, branchId),
  create: (branchId: string, dto: CreateExpenseDto) =>
    branchScopedApi.post<ExpenseRecord>('/expenses-v2/expenses', branchId, dto),
  update: (branchId: string, id: string, dto: UpdateExpenseDto) =>
    branchScopedApi.patch<ExpenseRecord>(`/expenses-v2/expenses/${id}`, branchId, dto),
  cancel: (branchId: string, id: string) =>
    branchScopedApi.patch<ExpenseRecord>(`/expenses-v2/expenses/${id}/cancel`, branchId),
  confirmPayment: (branchId: string, id: string) =>
    branchScopedApi.patch<ExpenseRecord>(`/expenses-v2/expenses/${id}/confirm-payment`, branchId),
  createFromQuick: (branchId: string, definitionId: string, dto: { amount?: number; department_id?: string; category_id?: string }) =>
    branchScopedApi.post<ExpenseRecord>(`/expenses-v2/expenses/quick/${definitionId}`, branchId, dto),
  stopRecurring: (branchId: string, id: string) =>
    branchScopedApi.patch<ExpenseRecord>(`/expenses-v2/expenses/${id}/stop-recurring`, branchId),
}

export interface ExpenseActivityRecord {
  id: string
  expense_id: string
  actor_id: string | null
  action: string
  note: string | null
  created_at: string
}

export const expenseActivityApi = {
  getByExpense: (branchId: string, expenseId: string) =>
    branchScopedApi.get<ExpenseActivityRecord[]>(`/expenses-v2/expenses/${expenseId}/activity`, branchId),
}

export interface ExpenseAttachmentRecord {
  id: string
  expense_id: string
  file_url: string
  storage_path: string
  file_type: string
  uploaded_by: string | null
  uploaded_at: string
}

export const expenseAttachmentsApi = {
  getByExpense: (branchId: string, expenseId: string) =>
    branchScopedApi.get<ExpenseAttachmentRecord[]>(`/expenses-v2/expenses/${expenseId}/attachments`, branchId),
  upload: (branchId: string, expenseId: string, file: File) =>
    branchScopedApi.upload<ExpenseAttachmentRecord>(`/expenses-v2/expenses/${expenseId}/attachments`, branchId, file),
}

export type QuickAmountMode = 'fixed' | 'variable'

export interface QuickDefinitionRecord {
  id: string
  label: string
  amount_mode: QuickAmountMode
  fixed_amount: number | null
  tax_mode: TaxMode
  default_department_id: string | null
  default_category_id: string | null
  default_payment_method: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateQuickDefinitionDto {
  label: string
  amount_mode: QuickAmountMode
  fixed_amount?: number
  tax_mode: TaxMode
  default_department_id?: string
  default_category_id?: string
  default_payment_method: string
  sort_order?: number
}

export interface UpdateQuickDefinitionDto extends Partial<CreateQuickDefinitionDto> {
  is_active?: boolean
}

export const quickDefinitionsApi = {
  getAll: (includeInactive = false) =>
    apiClient.get<QuickDefinitionRecord[]>(
      `/expenses-v2/quick-definitions${includeInactive ? '?includeInactive=true' : ''}`,
    ),
  create: (dto: CreateQuickDefinitionDto) =>
    apiClient.post<QuickDefinitionRecord>('/expenses-v2/quick-definitions', dto),
  update: (id: string, dto: UpdateQuickDefinitionDto) =>
    apiClient.patch<QuickDefinitionRecord>(`/expenses-v2/quick-definitions/${id}`, dto),
  deactivate: (id: string) =>
    apiClient.patch<QuickDefinitionRecord>(`/expenses-v2/quick-definitions/${id}/deactivate`, {}),
}

