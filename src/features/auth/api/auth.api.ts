import { apiClient } from '@/lib/api';

export interface LoginDto {
  email: string;
  password: string;
  device_name: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenant_id: string | null;
    session_id: string;
    permissions: string[];
    features: string[];
    business_type: string | null;
  };
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string | null;
  session_id: string;
  permissions: string[];
  features: string[];
  business_type: string | null;
}

export const authApi = {
  login: (dto: LoginDto) =>
    apiClient.post<LoginResponse>('/auth/login', dto),

  logout: () =>
    apiClient.post<void>('/auth/logout', {}),

  me: () =>
    apiClient.get<MeResponse>('/auth/me'),
};