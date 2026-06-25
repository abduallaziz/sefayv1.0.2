import { apiClient } from '@/lib/api';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
export type ExpenseType = 'one_time' | 'recurring';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurrenceScheduleType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface ExpenseCategory {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface ExpenseTemplate {
  id: string;
  tenant_id: string;
  name: string;
  default_amount: number | null;
  requires_photo: boolean;
  expiry_hours: number;
  is_active: boolean;
  recurrence_type: RecurrenceScheduleType;
  recurrence_day: number | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
  is_pre_approved: boolean;
}

export interface Expense {
  id: string;
  branch_id: string;
  category_id: string | null;
  amount: number;
  title: string;
  notes: string | null;
  type: ExpenseType;
  recurrence: RecurrenceType | null;
  photo_url: string | null;
  status: ExpenseStatus;
  requested_by: string;
  approved_by: string | null;
  expires_at: string;
  resolved_at: string | null;
  created_at: string;
  category: { id: string; name: string } | null;
  requester: { id: string; name: string; role: string } | null;
  approver: { id: string; name: string; role: string } | null;
}

export interface CreateExpenseDto {
  branch_id: string;
  category_id: string;
  amount: number;
  description?: string;
  type: ExpenseType;
  recurrence?: RecurrenceType;
  photo_url?: string;
  shift_id?: string;
}

export interface CreateCategoryDto {
  name: string;
}

export interface UpdateExpenseTemplateDto {
  name?: string;
  default_amount?: number | null;
  requires_photo?: boolean;
  expiry_hours?: number;
  is_active?: boolean;
  recurrence_type?: RecurrenceScheduleType;
  recurrence_day?: number | null;
  next_run_at?: string | null;
  is_pre_approved?: boolean;
}

export const expensesApi = {
  getAll: (): Promise<Expense[]> =>
    apiClient.get<Expense[]>('/expenses'),

  getStats: () =>
    apiClient.get<any>('/expenses/stats'),

  create: (dto: CreateExpenseDto): Promise<Expense> =>
    apiClient.post<Expense>('/expenses', dto),

  approve: (id: string): Promise<Expense> =>
    apiClient.patch<Expense>(`/expenses/${id}/approve`, {}),

  reject: (id: string, reason?: string): Promise<Expense> =>
    apiClient.patch<Expense>(`/expenses/${id}/reject`, { reason }),

  cancel: (id: string): Promise<Expense> =>
    apiClient.patch<Expense>(`/expenses/${id}/cancel`, {}),

  getCategories: (): Promise<ExpenseCategory[]> =>
    apiClient.get<ExpenseCategory[]>('/expense-categories'),

  createCategory: (dto: CreateCategoryDto): Promise<ExpenseCategory> =>
    apiClient.post<ExpenseCategory>('/expense-categories', dto),

  updateCategory: (id: string, dto: Partial<CreateCategoryDto & { is_active: boolean }>): Promise<ExpenseCategory> =>
    apiClient.patch<ExpenseCategory>(`/expense-categories/${id}`, dto),

  deleteCategory: (id: string): Promise<void> =>
    apiClient.delete<void>(`/expense-categories/${id}`),

  getTemplates: (): Promise<ExpenseTemplate[]> =>
    apiClient.get<ExpenseTemplate[]>('/expense-templates'),

  updateTemplate: (id: string, dto: UpdateExpenseTemplateDto): Promise<ExpenseTemplate> =>
    apiClient.patch<ExpenseTemplate>(`/expense-templates/${id}`, dto),

  deleteTemplate: (id: string): Promise<void> =>
  apiClient.delete<void>(`/expense-templates/${id}`),

  createTemplate: (dto: { name: string; default_amount?: number | null; expiry_hours?: number; requires_photo?: boolean }): Promise<ExpenseTemplate> =>
  apiClient.post<ExpenseTemplate>('/expense-templates', dto),
};