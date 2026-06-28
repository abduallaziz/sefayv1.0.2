export interface Warehouse {
  id: string;
  code: string;
  name: string;
  branch_id: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WarehouseFilters {
  search: string;
  is_active: boolean | 'all';
}

export interface CreateWarehouseDTO {
  code: string;
  name: string;
  branch_id?: string;
  address?: string;
  is_active?: boolean;
}

export type UpdateWarehouseDTO = Partial<CreateWarehouseDTO>;
