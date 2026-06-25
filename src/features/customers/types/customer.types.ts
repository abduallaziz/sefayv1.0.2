export interface Customer {
  id: string;
  tenant_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  loyalty_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  orders_count?: number;
  total_spent?: number;
  custom_fields?: Record<string, string | number | boolean | null>;
}

export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface CustomFieldOption {
  value: string;
  label_ar: string;
  label_en: string;
}

export type ContactRole = 'phone' | 'email' | 'plate_number' | 'visit_date' | 'odometer';

export interface CustomerFieldDefinition {
  id: string;
  field_key: string;
  label_ar: string;
  label_en: string;
  field_type: CustomFieldType;
  options: CustomFieldOption[] | null;
  required: boolean;
  is_active: boolean;
  sort_order: number;
  contact_role: ContactRole | null;
  created_at: string;
}

export interface CreateFieldDefinitionDto {
  field_key: string;
  label_ar: string;
  label_en: string;
  field_type: CustomFieldType;
  options?: CustomFieldOption[];
  required?: boolean;
  contact_role?: ContactRole;
}

export interface UpdateFieldDefinitionDto {
  label_ar?: string;
  label_en?: string;
  field_type?: CustomFieldType;
  options?: CustomFieldOption[];
  required?: boolean;
  is_active?: boolean;
  sort_order?: number;
  contact_role?: ContactRole | null;
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
  full_name?: string;
  phone?: string;
  email?: string;
  custom_fields?: Record<string, string | number | boolean | null>;
}

export interface UpdateCustomerDto {
  full_name?: string;
  phone?: string;
  email?: string;
  custom_fields?: Record<string, string | number | boolean | null>;
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