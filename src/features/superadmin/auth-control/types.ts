export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'cashier' | 'worker' | 'inventory_clerk';
  is_active: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface DeviceSession {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  tenant_id: string;
  tenant_name: string;
  device_name: string;
  device_type: 'web' | 'mobile';
  ip_address: string;
  last_active_at: string;
  is_revoked: boolean;
  created_at: string;
}

export interface TenantOption {
  id: string;
  name: string;
}