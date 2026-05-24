
export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email: string | null;
  loyalty_points: number;
  created_at: string;
  deleted_at: string | null;
  // computed
  total_orders?: number;
  total_spent?: number;
}

export interface CustomerOrder {
  id: string;
  created_at: string;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method: string;
  items_count: number;
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
  email?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  email?: string;
}

export interface CustomerFilters {
  search: string;
  sortBy: 'name' | 'created_at' | 'loyalty_points' | 'total_spent';
  sortOrder: 'asc' | 'desc';
}

export interface CustomerStats {
  total: number;
  new_this_month: number;
  total_loyalty_points: number;
}