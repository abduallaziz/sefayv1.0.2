export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'expired'

export interface ExpenseTemplate {
  id: string
  name: string
  default_amount: number | null
  requires_photo: boolean
  expiry_hours: number
  is_active: boolean
}

export interface Expense {
  id: string
  template_id: string | null
  template_name: string
  requested_by: string
  amount: number
  note: string
  photo_url: string | null
  status: ExpenseStatus
  expires_at: string
  created_at: string
  resolved_at: string | null
}

export const mockTemplates: ExpenseTemplate[] = [
  { id: '1', name: 'مستلزمات مكتبية', default_amount: 100, requires_photo: false, expiry_hours: 24, is_active: true },
  { id: '2', name: 'وقود', default_amount: 200, requires_photo: true, expiry_hours: 12, is_active: true },
  { id: '3', name: 'صيانة', default_amount: null, requires_photo: true, expiry_hours: 48, is_active: true },
]

export const mockExpenses: Expense[] = [
  {
    id: '1', template_id: '1', template_name: 'مستلزمات مكتبية',
    requested_by: 'أحمد الكاشير', amount: 85, note: 'ورق طباعة',
    photo_url: null, status: 'pending',
    expires_at: new Date(Date.now() + 3600000 * 20).toISOString(),
    created_at: new Date().toISOString(), resolved_at: null,
  },
  {
    id: '2', template_id: '2', template_name: 'وقود',
    requested_by: 'سارة المديرة', amount: 180, note: 'توصيل طلبات',
    photo_url: null, status: 'approved',
    expires_at: new Date(Date.now() + 3600000 * 8).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    resolved_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3', template_id: '3', template_name: 'صيانة',
    requested_by: 'أحمد الكاشير', amount: 350, note: 'إصلاح طابعة',
    photo_url: null, status: 'rejected',
    expires_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    resolved_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
]