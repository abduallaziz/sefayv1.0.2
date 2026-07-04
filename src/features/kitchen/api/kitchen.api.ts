import { apiClient } from '@/lib/api'

export interface KitchenItem {
  id: string
  item_name: string
  qty: number
  kitchen_status: 'pending' | 'preparing' | 'ready' | 'served'
  created_at: string
}

export interface KitchenOrder {
  order_id: string
  table_id: string
  table_name: string | null
  created_at: string
  items: KitchenItem[]
}

export const kitchenApi = {
  getActiveOrders: (branchId?: string): Promise<KitchenOrder[]> =>
    apiClient.get(`/kitchen/orders${branchId ? `?branch_id=${branchId}` : ''}`),

  updateItemStatus: (itemId: string, status: string): Promise<KitchenItem> =>
    apiClient.patch(`/kitchen/items/${itemId}`, { status }),
}
