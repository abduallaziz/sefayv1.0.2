import { apiClient } from '@/lib/api'

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'

export interface RestaurantTable {
  id: string
  branch_id: string
  name: string
  capacity: number
  status: TableStatus
  created_at: string
}

export interface DineInItem {
  id: string
  item_id: string
  item_name: string
  qty: number
  price: number
  total_price: number
  variant_id: string | null
  variant_name: string | null
  kitchen_status: string | null
  created_at: string
}

export interface DineInOrder {
  id: string
  branch_id: string
  cashier_id: string
  table_id: string
  subtotal: number
  discount: number
  tax: number
  total: number
  status: string
  created_at: string
  items: DineInItem[]
}

export interface AddDineInItemInput {
  item_id: string
  item_name: string
  variant_id?: string
  variant_name?: string
  quantity: number
  unit_price: number
}

export interface CheckoutDineInInput {
  payment_method: 'cash' | 'card' | 'split' | 'wallet' | 'mada' | 'visa' | 'mastercard' | 'stc_pay' | 'apple_pay'
  cash_tendered?: number
  cash_amount?: number
  card_amount?: number
  customer_id?: string
}

export interface Reservation {
  id: string
  table_id: string
  table_name: string | null
  customer_name: string
  customer_phone: string | null
  party_size: number
  reservation_time: string
  status: 'confirmed' | 'seated' | 'cancelled' | 'no_show'
  notes: string | null
  created_at: string
}

export interface WaitlistEntry {
  id: string
  branch_id: string
  customer_name: string
  customer_phone: string | null
  party_size: number
  quoted_wait_minutes: number | null
  status: 'waiting' | 'seated' | 'cancelled'
  table_id: string | null
  created_at: string
  seated_at: string | null
}

export const tablesApi = {
  getAll: (branchId?: string): Promise<RestaurantTable[]> =>
    apiClient.get(`/tables${branchId ? `?branch_id=${branchId}` : ''}`),

  create: (data: { branch_id: string; name: string; capacity?: number }): Promise<RestaurantTable> =>
    apiClient.post('/tables', data),

  update: (id: string, data: Partial<{ name: string; capacity: number; status: TableStatus }>): Promise<RestaurantTable> =>
    apiClient.patch(`/tables/${id}`, data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/tables/${id}`),

  open: (tableId: string): Promise<DineInOrder> =>
    apiClient.post(`/tables/${tableId}/open`, {}),

  addItems: (tableId: string, items: AddDineInItemInput[]): Promise<DineInOrder> =>
    apiClient.post(`/tables/${tableId}/items`, { items }),

  getCurrentOrder: (tableId: string): Promise<DineInOrder> =>
    apiClient.get(`/tables/${tableId}/order`),

  checkout: (tableId: string, data: CheckoutDineInInput): Promise<{ id: string; total: number; status: string }> =>
    apiClient.post(`/tables/${tableId}/checkout`, data),

  getReservations: (filters?: { tableId?: string; from?: string; to?: string; status?: string }): Promise<Reservation[]> => {
    const params = new URLSearchParams()
    if (filters?.tableId) params.set('table_id', filters.tableId)
    if (filters?.from) params.set('from', filters.from)
    if (filters?.to) params.set('to', filters.to)
    if (filters?.status) params.set('status', filters.status)
    const qs = params.toString()
    return apiClient.get(`/reservations${qs ? `?${qs}` : ''}`)
  },

  createReservation: (data: { table_id: string; customer_name: string; customer_phone?: string; party_size?: number; reservation_time: string; notes?: string }): Promise<Reservation> =>
    apiClient.post('/reservations', data),

  updateReservation: (id: string, data: Partial<{ status: string; customer_name: string; party_size: number; reservation_time: string; notes: string }>): Promise<Reservation> =>
    apiClient.patch(`/reservations/${id}`, data),

  getWaitlist: (branchId?: string, status?: string): Promise<WaitlistEntry[]> => {
    const params = new URLSearchParams()
    if (branchId) params.set('branch_id', branchId)
    if (status) params.set('status', status)
    const qs = params.toString()
    return apiClient.get(`/waitlist${qs ? `?${qs}` : ''}`)
  },

  createWaitlistEntry: (data: { branch_id: string; customer_name: string; customer_phone?: string; party_size?: number; quoted_wait_minutes?: number }): Promise<WaitlistEntry> =>
    apiClient.post('/waitlist', data),

  seatWaitlistEntry: (id: string, tableId: string): Promise<WaitlistEntry> =>
    apiClient.patch(`/waitlist/${id}/seat`, { table_id: tableId }),

  cancelWaitlistEntry: (id: string): Promise<WaitlistEntry> =>
    apiClient.patch(`/waitlist/${id}/cancel`, {}),
}
