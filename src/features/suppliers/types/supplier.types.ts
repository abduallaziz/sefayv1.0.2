export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  payment_terms: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SupplierFilters {
  search: string;
  is_active: boolean | 'all';
}

export interface CreateSupplierDTO {
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  payment_terms?: string;
  is_active?: boolean;
}

export type UpdateSupplierDTO = Partial<CreateSupplierDTO>;
