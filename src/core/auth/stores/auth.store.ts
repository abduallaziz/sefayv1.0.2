import { create } from 'zustand';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'worker' | 'superadmin';

export type BusinessType = 'restaurant' | 'cafe' | 'retail' | 'services' | 'workshop' | 'other';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  sessionId: string;
  branchId?: string;
  permissions: string[];
  features: string[];
  business_type: BusinessType | null;
  activity: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),

  setAccessToken: (accessToken) =>
    set({ accessToken }),

  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),

  setLoading: (isLoading) => set({ isLoading }),
}));