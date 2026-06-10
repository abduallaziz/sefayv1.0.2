export interface Customer {
  id: string;
  tenant_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  loyalty_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  orders_count?: number;
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
  full_name: string;
  phone: string;
  email?: string;
}

export interface UpdateCustomerDto {
  full_name?: string;
  phone?: string;
  email?: string;
}

export interface CustomerFilters {
  search: string;
  sortBy: 'full_name' | 'created_at' | 'loyalty_points';
  sortOrder: 'asc' | 'desc';
}

export interface CustomerStats {
  total: number;
  new_this_month: number;
}