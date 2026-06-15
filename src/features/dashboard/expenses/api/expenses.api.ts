import { apiClient } from '@/lib/api';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface Expense {
  id: string;
  branch_id: string | null;
  category_id: string | null;
  template_id: string | null;
  title: string;
  amount: number;
  notes: string | null;
  status: ExpenseStatus;
  requested_by: string | null;
  approved_by: string | null;
  photo_url: string | null;
  expires_at: string | null;
  resolved_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  template: { id: string; name: string } | null;
  requester: { id: string; name: string; role: string } | null;
  approver: { id: string; name: string; role: string } | null;
}

export interface ExpenseTemplate {
  id: string;
  tenant_id: string;
  name: string;
  default_amount: number | null;
  requires_photo: boolean;
  expiry_hours: number;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseDto {
  branch_id: string;
  template_id?: string;
  amount: number;
  note?: string;
  photo_url?: string;
}

export interface ExpenseStatsResult {
  total_count: number;
  total_amount: number;
  approved_count: number;
  approved_amount: number;
  pending_count: number;
  pending_amount: number;
  rejected_count: number;
  rejected_amount: number;
}

export const expensesApi = {
  getAll: (): Promise<Expense[]> =>
    apiClient.get<Expense[]>('/expenses'),

  getTemplates: (): Promise<ExpenseTemplate[]> =>
    apiClient.get<ExpenseTemplate[]>('/expense-templates'),

  getStats: (): Promise<ExpenseStatsResult> =>
    apiClient.get<ExpenseStatsResult>('/expenses/stats'),

  create: (dto: CreateExpenseDto): Promise<Expense> =>
    apiClient.post<Expense>('/expenses', dto),

  approve: (id: string): Promise<Expense> =>
    apiClient.patch<Expense>(`/expenses/${id}/approve`, {}),

  reject: (id: string, reason?: string): Promise<Expense> =>
    apiClient.patch<Expense>(`/expenses/${id}/reject`, { reason }),

  createTemplate: (dto: Omit<ExpenseTemplate, 'id' | 'tenant_id' | 'deleted_at' | 'created_at' | 'updated_at'>): Promise<ExpenseTemplate> =>
    apiClient.post<ExpenseTemplate>('/expense-templates', dto),

  updateTemplate: (id: string, dto: Partial<Omit<ExpenseTemplate, 'id' | 'tenant_id' | 'deleted_at' | 'created_at' | 'updated_at'>>): Promise<ExpenseTemplate> =>
    apiClient.patch<ExpenseTemplate>(`/expense-templates/${id}`, dto),

  deleteTemplate: (id: string): Promise<void> =>
    apiClient.delete<void>(`/expense-templates/${id}`),
};