export interface Location {
  id: string;
  warehouse_id: string;
  code: string;
  name: string;
  zone: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
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
}

export type UpdateLocationDTO = Partial<CreateLocationDTO>;
