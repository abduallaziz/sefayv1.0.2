
export type ItemType = 'product' | 'service' | 'custom';
export type OperationType = 'sell' | 'book' | 'repair' | 'rent';

export interface ItemVariant {
  id: string;
  item_id: string;
  tenant_id: string;
  name: string;
  price_adjustment: number;
  sku: string;
  stock_quantity: number;
  is_active: boolean;
}

export interface Item {
  id: string;
  tenant_id: string;
  name: string;
  type: ItemType;
  operation_type: OperationType;
  price: number;
  category_id: string | null;
  category_name?: string;
  has_inventory: boolean;
  has_variants: boolean;
  is_active: boolean;
  created_at: string;
  deleted_at: string | null;
  variants?: ItemVariant[];
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  type: 'product' | 'service' | 'expense';
  is_active: boolean;
}

export interface ItemFilters {
  search: string;
  type: ItemType | 'all';
  category_id: string | 'all';
  is_active: boolean | 'all';
}

export interface CreateItemDTO {
  name: string;
  type: ItemType;
  operation_type: OperationType;
  price: number;
  category_id?: string;
  has_inventory: boolean;
  has_variants: boolean;
}

export interface UpdateItemDTO extends Partial<CreateItemDTO> {
  is_active?: boolean;
}

export interface CreateVariantDTO {
  name: string;
  price_adjustment: number;
  sku: string;
  stock_quantity: number;
}