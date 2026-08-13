export interface Location {
  id: string;
  warehouse_id: string;
  code: string;
  name: string;
  zone: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  parent_location_id: string | null;
  location_type: 'zone' | 'aisle' | 'rack' | 'shelf' | 'bin' | null;
  location_purpose: 'receiving' | 'storage' | 'picking' | 'packing' | 'quality_hold' | 'damaged' | 'shipping' | null;
  max_quantity: number | null;
  max_weight: number | null;
  max_volume: number | null;
}

export interface LocationsResponse {
  data: Location[];
  total: number;
  page: number;
  limit: number;
}

export interface LocationFilters {
  search: string;
  page: number;
  limit: number;
}

export interface CreateLocationDTO {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
  parent_location_id?: string;
  location_type?: 'zone' | 'aisle' | 'rack' | 'shelf' | 'bin';
  location_purpose?: string;
  max_quantity?: number;
  max_weight?: number;
  max_volume?: number;
  restricted_to_item_ids?: string[];
  restricted_to_category_ids?: string[];
}

export type UpdateLocationDTO = Partial<CreateLocationDTO>;
