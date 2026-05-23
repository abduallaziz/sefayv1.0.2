import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'worker' | 'superadmin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  branchId?: string;
  permissions: string[];
  features: string[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),
      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'sefay-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);