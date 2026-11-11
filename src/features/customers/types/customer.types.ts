export interface Customer {
  id: string;
  tenant_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  plate_number?: string | null;
  visit_date?: string | null;
  odometer?: number | null;
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
  sortBy: 'full_name' | 'created_at' | 'loyalty_points' | 'total_spent';
  sortOrder: 'asc' | 'desc';
}

export interface CustomerStats {
  total: number;
  new_this_month: number;
  /** Only present when the request carried a from/to range. */
  new_in_range?: number;
  total_loyalty_points: number;
}
export interface CustomerVehicle {
  id: string;
  customer_id: string;
  plate: string;
  size: string | null;
  model: string | null;
  colour: string | null;
}

/** GET /customers/lookup — exact normalised match by plate or phone. */
export interface CustomerLookupResult {
  found: boolean;
  matched_by: 'plate' | 'phone' | null;
  customer: Customer | null;
  vehicles: CustomerVehicle[];
  /** The car matched by plate, or the only car of a phone match. */
  vehicle: CustomerVehicle | null;
  stats: { visit_count: number; last_visit_at: string | null; total_spent: number } | null;
}

/** Sent with the invoice; the server finds or creates the customer and car. */
export interface CustomerCapture {
  phone?: string;
  plate?: string;
  size?: string;
  name?: string;
  custom_fields?: Record<string, string | number | boolean | null>;
}
